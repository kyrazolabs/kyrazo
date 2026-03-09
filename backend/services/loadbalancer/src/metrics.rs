use once_cell::sync::Lazy;
use prometheus::{
    Encoder, GaugeVec, HistogramOpts, HistogramVec, IntCounterVec, IntGaugeVec, Opts, Registry,
    TextEncoder,
};

// ─── Global Registry ────────────────────────────────────────────────

pub static REGISTRY: Lazy<Registry> = Lazy::new(Registry::new);

// ─── Counters ───────────────────────────────────────────────────────

pub static REQUESTS_TOTAL: Lazy<IntCounterVec> = Lazy::new(|| {
    let opts = Opts::new("lb_requests_total", "Total requests processed")
        .namespace("lb");
    let counter = IntCounterVec::new(opts, &["backend_id", "status_code"]).unwrap();
    REGISTRY.register(Box::new(counter.clone())).unwrap();
    counter
});

pub static UPSTREAM_ERRORS_TOTAL: Lazy<IntCounterVec> = Lazy::new(|| {
    let opts = Opts::new("lb_upstream_errors_total", "Total upstream errors")
        .namespace("lb");
    let counter = IntCounterVec::new(opts, &["backend_id", "error_type"]).unwrap();
    REGISTRY.register(Box::new(counter.clone())).unwrap();
    counter
});

pub static RATE_LIMITED_TOTAL: Lazy<IntCounterVec> = Lazy::new(|| {
    let opts = Opts::new("lb_rate_limited_total", "Total rate-limited requests")
        .namespace("lb");
    let counter = IntCounterVec::new(opts, &[]).unwrap();
    REGISTRY.register(Box::new(counter.clone())).unwrap();
    counter
});

pub static ALL_BACKENDS_DOWN_TOTAL: Lazy<IntCounterVec> = Lazy::new(|| {
    let opts = Opts::new(
        "lb_all_backends_down_total",
        "Total times all backends were down",
    )
    .namespace("lb");
    let counter = IntCounterVec::new(opts, &[]).unwrap();
    REGISTRY.register(Box::new(counter.clone())).unwrap();
    counter
});

// ─── Histogram ──────────────────────────────────────────────────────

pub static REQUEST_DURATION: Lazy<HistogramVec> = Lazy::new(|| {
    let opts = HistogramOpts::new(
        "lb_request_duration_seconds",
        "Request duration in seconds",
    )
    .namespace("lb")
    .buckets(vec![0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0]);
    let hist = HistogramVec::new(opts, &["backend_id"]).unwrap();
    REGISTRY.register(Box::new(hist.clone())).unwrap();
    hist
});

// ─── Gauges ─────────────────────────────────────────────────────────

pub static ACTIVE_CONNECTIONS: Lazy<IntGaugeVec> = Lazy::new(|| {
    let opts = Opts::new("lb_active_connections", "Active connections per backend")
        .namespace("lb");
    let gauge = IntGaugeVec::new(opts, &["backend_id"]).unwrap();
    REGISTRY.register(Box::new(gauge.clone())).unwrap();
    gauge
});

pub static BACKEND_HEALTHY: Lazy<GaugeVec> = Lazy::new(|| {
    let opts = Opts::new("lb_backend_healthy", "Backend health status (1=up, 0=down)")
        .namespace("lb");
    let gauge = GaugeVec::new(opts, &["backend_id"]).unwrap();
    REGISTRY.register(Box::new(gauge.clone())).unwrap();
    gauge
});

// ─── Metrics Encoding ───────────────────────────────────────────────

/// Encode all registered metrics into Prometheus text format.
pub fn encode_metrics() -> String {
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    String::from_utf8(buffer).unwrap()
}
