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
/// Supports both http:// and https:// via hyper-rustls.
pub type HttpClient = Client<
    hyper_rustls::HttpsConnector<hyper_util::client::legacy::connect::HttpConnector>,
    Incoming,
>;

/// Build a reusable HTTP client with connection pooling and HTTPS support.
pub fn build_client(skip_verify: bool) -> HttpClient {
    let mut http = hyper_util::client::legacy::connect::HttpConnector::new();
    http.set_nodelay(true);
    http.enforce_http(false);

    let provider = Arc::new(rustls::crypto::aws_lc_rs::default_provider());
    
    let rustls_config = if skip_verify {
        rustls::ClientConfig::builder_with_provider(provider)
            .with_safe_default_protocol_versions()
            .expect("failed to build rustls config")
            .dangerous()
            .with_custom_certificate_verifier(Arc::new(NoVerifier))
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

    Client::builder(TokioExecutor::new())
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(32)
        .build(connector)
}

/// A verifier that accepts any certificate.
#[derive(Debug)]
pub struct NoVerifier;

impl rustls::client::danger::ServerCertVerifier for NoVerifier {
    fn verify_server_cert(
        &self,
        _end_entity: &rustls::pki_types::CertificateDer<'_>,
        _intermediates: &[rustls::pki_types::CertificateDer<'_>],
        _server_name: &rustls::pki_types::ServerName<'_>,
        _ocsp_response: &[u8],
        _now: rustls::pki_types::UnixTime,
    ) -> Result<rustls::client::danger::ServerCertVerified, rustls::Error> {
        Ok(rustls::client::danger::ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        _message: &[u8],
        _cert: &rustls::pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn verify_tls13_signature(
        &self,
        _message: &[u8],
        _cert: &rustls::pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn supported_verify_schemes(&self) -> Vec<rustls::SignatureScheme> {
        vec![
            rustls::SignatureScheme::RSA_PKCS1_SHA1,
            rustls::SignatureScheme::ECDSA_SHA1_Legacy,
            rustls::SignatureScheme::RSA_PKCS1_SHA256,
            rustls::SignatureScheme::RSA_PKCS1_SHA384,
            rustls::SignatureScheme::RSA_PKCS1_SHA512,
            rustls::SignatureScheme::ECDSA_NISTP256_SHA256,
            rustls::SignatureScheme::ECDSA_NISTP384_SHA384,
            rustls::SignatureScheme::ECDSA_NISTP521_SHA512,
            rustls::SignatureScheme::RSA_PSS_SHA256,
            rustls::SignatureScheme::RSA_PSS_SHA384,
            rustls::SignatureScheme::RSA_PSS_SHA512,
            rustls::SignatureScheme::ED25519,
            rustls::SignatureScheme::ED448,
        ]
    }
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
