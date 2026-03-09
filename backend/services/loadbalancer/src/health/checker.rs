use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Duration;

use hyper_util::client::legacy::Client;
use hyper_util::rt::TokioExecutor;
use http_body_util::Empty;
use bytes::Bytes;
use tokio::task::JoinHandle;
use tracing::{info, warn, error};

use hyper::Request;
use crate::config::HealthCheckConfig;
use crate::health::Backend;
use crate::metrics;

/// Spawn one independent health-check Tokio task per backend.
/// Returns join handles so the caller can cancel them on shutdown.
pub fn spawn_health_checks(
    backends: &[Arc<Backend>],
    config: &HealthCheckConfig,
    skip_ssl_verify: bool,
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
                    skip_ssl_verify,
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
    skip_ssl_verify: bool,
) {
    // Build a lightweight HTTP/HTTPS client for health probes
    let mut http = hyper_util::client::legacy::connect::HttpConnector::new();
    http.enforce_http(false);

    let provider = Arc::new(rustls::crypto::aws_lc_rs::default_provider());

    let rustls_config = if skip_ssl_verify {
        rustls::ClientConfig::builder_with_provider(provider)
            .with_safe_default_protocol_versions()
            .expect("failed to build rustls config")
            .dangerous()
            .with_custom_certificate_verifier(Arc::new(crate::forwarder::NoVerifier))
            .with_no_client_auth()
    } else {
        let mut root_store = rustls::RootCertStore::empty();
        for cert in rustls_native_certs::load_native_certs().expect("failed to load native certs") {
            root_store.add(cert).ok();
        }

        rustls::ClientConfig::builder_with_provider(provider)
            .with_safe_default_protocol_versions()
            .expect("failed to build rustls config")
            .with_root_certificates(root_store)
            .with_no_client_auth()
    };

    let connector = hyper_rustls::HttpsConnectorBuilder::new()
        .with_tls_config(rustls_config)
        .https_or_http()
        .enable_http1()
        .wrap_connector(http);

    let client: Client<_, Empty<Bytes>> = Client::builder(TokioExecutor::new())
        .pool_idle_timeout(Duration::from_secs(30))
        .pool_max_idle_per_host(2)
        .build(connector);

    let health_url = format!("{}{}", backend.address.trim_end_matches('/'), path);

    loop {
        let req = match Request::builder()
            .method("GET")
            .uri(&health_url)
            .body(Empty::<Bytes>::new())
        {
            Ok(r) => r,
            Err(_) => return, // Should not happen with static URI
        };

        // Timeout wrapper for the health check request
        let check_fut = async {
            let resp = client.request(req).await.map_err(|e| e.to_string())?;
            let status = resp.status();
            Ok::<hyper::StatusCode, String>(status)
        };

        let result: Result<Result<hyper::StatusCode, String>, tokio::time::error::Elapsed> = 
            tokio::time::timeout(timeout, check_fut).await;

        match &result {
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

                let error_msg = match result {
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
