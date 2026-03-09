use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;

use bytes::Bytes;
use http_body_util::Full;
use hyper::body::Incoming;
use hyper::{Request, Response, StatusCode};
use tracing::{info, warn, error};
use uuid::Uuid;

use crate::config::Config;
use crate::forwarder::{self, ForwardResult, HttpClient};
use crate::health::{Backend, BackendPool};
use crate::middleware::rate_limiter::RateLimiter;
use crate::middleware::retry::RetryPolicy;
use crate::metrics;
use crate::rules::matcher;
use crate::rules::Rule;
use crate::strategy::round_robin::RoundRobinStrategy;
use crate::strategy::Strategy;

// ─── Balancer State ─────────────────────────────────────────────────

/// The central load balancer state shared across all request handlers.
#[allow(dead_code)]
pub struct Balancer {
    /// All backends.
    pub pool: Arc<BackendPool>,
    /// Pre-sorted routing rules.
    pub rules: Vec<Rule>,
    /// Per-rule round-robin strategies (keyed by rule ID).
    pub rule_strategies: HashMap<String, RoundRobinStrategy>,
    /// Global round-robin strategy (for requests matching no rule).
    pub global_strategy: RoundRobinStrategy,
    /// Shared HTTP client with connection pooling.
    pub client: HttpClient,
    /// Rate limiter.
    pub rate_limiter: Arc<RateLimiter>,
    /// Retry policy.
    pub retry_policy: RetryPolicy,
}

impl Balancer {
    /// Build the balancer from a loaded config.
    pub fn new(config: &Config) -> Self {
        // Build backend pool
        let backends: Vec<Arc<Backend>> = config
            .backends
            .iter()
            .map(Backend::from_config)
            .collect();

        let pool = Arc::new(BackendPool::new(backends));

        // Build sorted rules
        let rules = matcher::build_rules(&config.rules);

        // Build per-rule strategies
        let mut rule_strategies = HashMap::new();
        for rule in &rules {
            let rule_backends = pool.subset(&rule.backend_ids);
            rule_strategies.insert(
                rule.id.clone(),
                RoundRobinStrategy::new(&rule_backends),
            );
        }

        // Build global strategy
        let global_strategy = RoundRobinStrategy::new(&pool.backends);

        // Build HTTP client
        let client = forwarder::build_client();

        // Build rate limiter
        let rate_limiter = Arc::new(RateLimiter::new(
            config.rate_limit.requests_per_second,
            config.rate_limit.burst,
            config.rate_limit.enabled,
        ));

        // Build retry policy
        let retry_policy = RetryPolicy::from_config(&config.retry);

        Self {
            pool,
            rules,
            rule_strategies,
            global_strategy,
            client,
            rate_limiter,
            retry_policy,
        }
    }

    /// Handle an incoming request: rate limit → route → forward (with retries).
    #[inline]
    pub async fn handle_request(
        &self,
        req: Request<Incoming>,
    ) -> Response<Full<Bytes>> {
        let start = Instant::now();
        let request_id = Uuid::new_v4().to_string();
        let method = req.method().clone();
        let path = req.uri().path().to_string();

        // ── Rate limiting ─────────────────────────────────────────
        if !self.rate_limiter.try_acquire() {
            warn!(
                request_id = %request_id,
                method = %method,
                path = %path,
                "rate limited"
            );
            return response_with_header(
                StatusCode::TOO_MANY_REQUESTS,
                "Rate limit exceeded",
                "retry-after",
                "1",
            );
        }

        // ── All backends down? ────────────────────────────────────
        if self.pool.all_unhealthy() {
            error!(
                request_id = %request_id,
                "all backends unhealthy"
            );
            metrics::ALL_BACKENDS_DOWN_TOTAL.with_label_values(&[]).inc();
            return response_with_header(
                StatusCode::SERVICE_UNAVAILABLE,
                "All backends unavailable",
                "retry-after",
                "5",
            );
        }

        // ── Rule matching ─────────────────────────────────────────
        let matched_rule = matcher::match_rule(&self.rules, &path, &method);
        let rule_id = matched_rule.map(|r| r.id.as_str()).unwrap_or("global");

        // ── Backend selection ─────────────────────────────────────
        let strategy: &dyn Strategy = match matched_rule {
            Some(rule) => {
                match self.rule_strategies.get(&rule.id) {
                    Some(s) => s,
                    None => &self.global_strategy,
                }
            }
            None => &self.global_strategy,
        };

        let backend = match strategy.select(&self.pool.backends) {
            Some(b) => b,
            None => {
                error!(
                    request_id = %request_id,
                    rule = %rule_id,
                    "no healthy backend available"
                );
                metrics::ALL_BACKENDS_DOWN_TOTAL.with_label_values(&[]).inc();
                return response_with_header(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "No healthy backend",
                    "retry-after",
                    "5",
                );
            }
        };

        info!(
            request_id = %request_id,
            method = %method,
            path = %path,
            matched_rule = %rule_id,
            backend_id = %backend.id,
            "routing request"
        );

        // ── Path prefix stripping ─────────────────────────────────
        let mut req = req;
        if let Some(rule) = matched_rule {
            if rule.strip_prefix {
                let new_path = if path.len() > rule.path_prefix.len() {
                    &path[rule.path_prefix.len()..]
                } else {
                    "/"
                };
                
                // Ensure new_path starts with /
                let final_path = if new_path.starts_with('/') {
                    new_path.to_string()
                } else {
                    format!("/{}", new_path)
                };

                let mut uri_parts = req.uri().clone().into_parts();
                uri_parts.path_and_query = Some(final_path.parse().unwrap());
                *req.uri_mut() = http::Uri::from_parts(uri_parts).unwrap();
                
                info!(
                    request_id = %request_id,
                    old_path = %path,
                    new_path = %final_path,
                    "stripped path prefix"
                );
            }
        }

        // ── Forward with retry ────────────────────────────────────
        let result = forwarder::try_forward(&self.client, &backend, req, &request_id).await;

        let elapsed = start.elapsed();
        let latency_ms = elapsed.as_secs_f64() * 1000.0;

        match result {
            ForwardResult::Response(resp) => {
                let status = resp.status();
                let status_str = status.as_u16().to_string();

                metrics::REQUESTS_TOTAL
                    .with_label_values(&[&backend.id, &status_str])
                    .inc();
                metrics::REQUEST_DURATION
                    .with_label_values(&[&backend.id])
                    .observe(elapsed.as_secs_f64());

                info!(
                    request_id = %request_id,
                    backend_id = %backend.id,
                    status = %status,
                    latency_ms = %latency_ms,
                    "request completed"
                );

                // Convert Response<Incoming> to Response<Full<Bytes>> by
                // collecting the body. For streaming we'd return Incoming directly,
                // but since our service handler returns Full<Bytes> for simplicity
                // with hyper's service trait, we collect here.
                // For production streaming, the main.rs handler would use
                // a BoxBody approach instead.
                let (parts, body) = resp.into_parts();
                let body_bytes = match http_body_util::BodyExt::collect(body).await {
                    Ok(collected) => collected.to_bytes(),
                    Err(e) => {
                        warn!(
                            request_id = %request_id,
                            error = %e,
                            "failed to read upstream body"
                        );
                        return text_response(StatusCode::BAD_GATEWAY, "Bad Gateway");
                    }
                };
                Response::from_parts(parts, Full::new(body_bytes))
            }
            ForwardResult::Error(e) => {
                warn!(
                    request_id = %request_id,
                    backend_id = %backend.id,
                    error = %e,
                    latency_ms = %latency_ms,
                    "upstream error"
                );
                metrics::REQUESTS_TOTAL
                    .with_label_values(&[&backend.id, "502"])
                    .inc();
                text_response(StatusCode::BAD_GATEWAY, "Bad Gateway")
            }
        }
    }
}

// ─── Response Helpers ───────────────────────────────────────────────

fn text_response(status: StatusCode, body: &str) -> Response<Full<Bytes>> {
    Response::builder()
        .status(status)
        .header("content-type", "text/plain")
        .body(Full::new(Bytes::from(body.to_string())))
        .unwrap()
}

fn response_with_header(
    status: StatusCode,
    body: &str,
    header_name: &str,
    header_value: &str,
) -> Response<Full<Bytes>> {
    Response::builder()
        .status(status)
        .header("content-type", "text/plain")
        .header(header_name, header_value)
        .body(Full::new(Bytes::from(body.to_string())))
        .unwrap()
}
