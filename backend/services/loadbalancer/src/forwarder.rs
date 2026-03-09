use std::sync::Arc;
use std::time::Duration;

use hyper::body::Incoming;
use hyper::{Request, Response};
use hyper_util::client::legacy::Client;
use hyper_util::rt::TokioExecutor;
use tracing::warn;

use crate::health::Backend;
use crate::metrics;

/// Shared HTTP client for forwarding requests to backends.
/// Uses connection pooling for maximum throughput.
pub type HttpClient = Client<
    hyper_util::client::legacy::connect::HttpConnector,
    Incoming,
>;

/// Build a reusable HTTP client with connection pooling.
pub fn build_client() -> HttpClient {
    let mut connector = hyper_util::client::legacy::connect::HttpConnector::new();
    connector.set_nodelay(true);
    connector.enforce_http(true);

    Client::builder(TokioExecutor::new())
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(32)
        .build(connector)
}

/// Result type for forwarding — the balancer maps errors to responses.
pub enum ForwardResult {
    /// Successfully got a response from upstream (may be 5xx).
    Response(Response<Incoming>),
    /// Connection/protocol error — no response received.
    Error(String),
}

/// Forward a request to the selected backend with proper error handling.
///
/// - Streams body in both directions — never buffers the full payload.
/// - Adds `X-LB-Backend` and `X-LB-Request-Id` headers to the response.
/// - Returns `ForwardResult` so the balancer can handle error responses.
#[inline]
pub async fn try_forward(
    client: &HttpClient,
    backend: &Arc<Backend>,
    req: Request<Incoming>,
    request_id: &str,
) -> ForwardResult {
    let upstream_uri = format!(
        "{}{}",
        backend.address.trim_end_matches('/'),
        req.uri()
            .path_and_query()
            .map(|pq| pq.as_str())
            .unwrap_or("/")
    );

    let uri: hyper::Uri = match upstream_uri.parse() {
        Ok(u) => u,
        Err(e) => {
            return ForwardResult::Error(format!("invalid upstream URI: {e}"));
        }
    };

    let (parts, body) = req.into_parts();
    let mut upstream_req = Request::builder()
        .method(parts.method)
        .uri(uri)
        .version(parts.version);

    if let Some(headers) = upstream_req.headers_mut() {
        *headers = parts.headers;
    }

    let upstream_req = match upstream_req.body(body) {
        Ok(r) => r,
        Err(e) => {
            return ForwardResult::Error(format!("failed to build upstream request: {e}"));
        }
    };

    metrics::ACTIVE_CONNECTIONS
        .with_label_values(&[&backend.id])
        .inc();

    let result = client.request(upstream_req).await;

    metrics::ACTIVE_CONNECTIONS
        .with_label_values(&[&backend.id])
        .dec();

    match result {
        Ok(mut resp) => {
            resp.headers_mut().insert(
                "x-lb-backend",
                backend.id.parse().unwrap_or_else(|_| "unknown".parse().unwrap()),
            );
            resp.headers_mut().insert(
                "x-lb-request-id",
                request_id.parse().unwrap_or_else(|_| "unknown".parse().unwrap()),
            );
            ForwardResult::Response(resp)
        }
        Err(e) => {
            warn!(
                backend_id = %backend.id,
                error = %e,
                "upstream connection failed"
            );
            metrics::UPSTREAM_ERRORS_TOTAL
                .with_label_values(&[&backend.id, "connection"])
                .inc();
            ForwardResult::Error(format!("upstream connection failed: {e}"))
        }
    }
}
