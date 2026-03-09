use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Duration;

use hyper_util::client::legacy::Client;
use hyper_util::rt::TokioExecutor;
use http_body_util::Empty;
use bytes::Bytes;
use tokio::task::JoinHandle;
use tracing::{info, warn, error};

use crate::config::HealthCheckConfig;
use crate::health::Backend;
use crate::metrics;

/// Spawn one independent health-check Tokio task per backend.
/// Returns join handles so the caller can cancel them on shutdown.
pub fn spawn_health_checks(
    backends: &[Arc<Backend>],
    config: &HealthCheckConfig,
) -> Vec<JoinHandle<()>> {
    backends
        .iter()
        .map(|backend| {
            let backend = Arc::clone(backend);
            let path = config.path.clone();
            let interval = Duration::from_secs(config.interval_secs);
            let timeout = Duration::from_secs(config.timeout_secs);
            let healthy_threshold = config.healthy_threshold;
            let unhealthy_threshold = config.unhealthy_threshold;

            tokio::spawn(async move {
                health_check_loop(
                    backend,
                    &path,
                    interval,
                    timeout,
                    healthy_threshold,
                    unhealthy_threshold,
                )
                .await;
            })
        })
        .collect()
}

async fn health_check_loop(
    backend: Arc<Backend>,
    path: &str,
    interval: Duration,
    timeout: Duration,
    healthy_threshold: u32,
    unhealthy_threshold: u32,
) {
    // Build a lightweight HTTP client for health probes
    let client = Client::builder(TokioExecutor::new())
        .pool_idle_timeout(Duration::from_secs(30))
        .pool_max_idle_per_host(2)
        .build_http::<Empty<Bytes>>();

    let health_url = format!("{}{}", backend.address.trim_end_matches('/'), path);

    loop {
        let result = tokio::time::timeout(timeout, async {
            let uri: hyper::Uri = match health_url.parse() {
                Ok(u) => u,
                Err(_) => return Err("invalid health check URI".to_string()),
            };

            let req = hyper::Request::builder()
                .method(hyper::Method::GET)
                .uri(uri)
                .body(Empty::<Bytes>::new())
                .map_err(|e| e.to_string())?;

            let resp = client.request(req).await.map_err(|e| e.to_string())?;
            Ok(resp.status())
        })
        .await;

        match result {
            Ok(Ok(status)) if status.is_success() => {
                // Success
                let successes = backend
                    .state
                    .consecutive_successes
                    .fetch_add(1, Ordering::Relaxed)
                    + 1;
                backend
                    .state
                    .consecutive_failures
                    .store(0, Ordering::Relaxed);

                if successes >= healthy_threshold
                    && !backend.state.healthy.load(Ordering::Relaxed)
                {
                    backend.state.healthy.store(true, Ordering::Relaxed);
                    metrics::BACKEND_HEALTHY
                        .with_label_values(&[&backend.id])
                        .set(1.0);
                    info!(backend_id = %backend.id, address = %backend.address, "backend marked healthy");
                }
            }
            _ => {
                // Failure (timeout, connection error, non-2xx)
                let failures = backend
                    .state
                    .consecutive_failures
                    .fetch_add(1, Ordering::Relaxed)
                    + 1;
                backend
                    .state
                    .consecutive_successes
                    .store(0, Ordering::Relaxed);

                let error_msg = match &result {
                    Ok(Ok(status)) => format!("HTTP {}", status),
                    Ok(Err(e)) => e.clone(),
                    Err(_) => "timeout".to_string(),
                };

                if failures >= unhealthy_threshold
                    && backend.state.healthy.load(Ordering::Relaxed)
                {
                    backend.state.healthy.store(false, Ordering::Relaxed);
                    metrics::BACKEND_HEALTHY
                        .with_label_values(&[&backend.id])
                        .set(0.0);
                    warn!(
                        backend_id = %backend.id, 
                        address = %backend.address,
                        reason = %error_msg,
                        "backend marked UNHEALTHY"
                    );
                }

                // Log every failure if it's currently unhealthy to help debugging
                if !backend.state.healthy.load(Ordering::Relaxed) {
                    error!(
                        backend_id = %backend.id,
                        address = %backend.address,
                        url = %health_url,
                        reason = %error_msg,
                        "health check failed"
                    );
                }
            }
        }

        tokio::time::sleep(interval).await;
    }
}
