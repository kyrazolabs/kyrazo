mod balancer;
mod config;
mod forwarder;
mod health;
mod metrics;
mod middleware;
mod rules;
mod strategy;

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;

use arc_swap::ArcSwap;
use bytes::Bytes;
use clap::Parser;
use http_body_util::Full;
use hyper::body::Incoming;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response};
use tokio::net::TcpListener;
use tokio::signal::unix::{signal, SignalKind};
use tracing::{error, info, warn};

use crate::balancer::Balancer;
use crate::health::checker;

// ─── CLI ────────────────────────────────────────────────────────────

#[derive(Parser)]
#[command(name = "loadbalancer", about = "High-performance internal HTTP load balancer")]
struct Cli {
    /// Path to the TOML configuration file.
    #[arg(short, long, default_value = "config/config.toml")]
    config: PathBuf,
}

// ─── Main ───────────────────────────────────────────────────────────

fn main() {
    let cli = Cli::parse();

    // Load config
    let cfg = config::load_config(&cli.config).expect("failed to load config");

    // Determine worker threads
    let worker_threads = if cfg.server.worker_threads == 0 {
        num_cpus::get()
    } else {
        cfg.server.worker_threads
    };

    // Build Tokio runtime
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(worker_threads)
        .enable_all()
        .build()
        .expect("failed to build Tokio runtime");

    runtime.block_on(async_main(cli.config, cfg));
}

async fn async_main(config_path: PathBuf, cfg: config::Config) {
    // ── Init tracing ──────────────────────────────────────────────
    init_tracing();

    info!(
        worker_threads = num_cpus::get(),
        "starting loadbalancer"
    );

    // ── Config in ArcSwap for hot-reload ──────────────────────────
    let config_holder = Arc::new(ArcSwap::from_pointee(cfg.clone()));

    // ── Build balancer ────────────────────────────────────────────
    let balancer = Arc::new(Balancer::new(&cfg));

    // ── Spawn health checks ──────────────────────────────────────
    let health_handles = checker::spawn_health_checks(
        &balancer.pool.backends,
        &cfg.health_check,
    );
    info!(count = health_handles.len(), "spawned health check tasks");

    // ── Init metrics (force lazy init) ────────────────────────────
    let _ = &*metrics::REQUESTS_TOTAL;
    let _ = &*metrics::UPSTREAM_ERRORS_TOTAL;
    let _ = &*metrics::RATE_LIMITED_TOTAL;
    let _ = &*metrics::ALL_BACKENDS_DOWN_TOTAL;
    let _ = &*metrics::REQUEST_DURATION;
    let _ = &*metrics::ACTIVE_CONNECTIONS;
    let _ = &*metrics::BACKEND_HEALTHY;

    // Set initial backend health gauges (unhealthy until first check)
    for backend in &balancer.pool.backends {
        metrics::BACKEND_HEALTHY
            .with_label_values(&[&backend.id])
            .set(0.0);
    }

    // ── Start metrics server ──────────────────────────────────────
    let metrics_addr: SocketAddr = cfg
        .server
        .metrics_bind
        .parse()
        .expect("invalid metrics_bind address");

    tokio::spawn(run_metrics_server(metrics_addr));

    // ── Start main server ─────────────────────────────────────────
    let bind_addr: SocketAddr = cfg
        .server
        .bind
        .parse()
        .expect("invalid bind address");

    let listener = TcpListener::bind(bind_addr)
        .await
        .expect("failed to bind TCP listener");

    // Enable SO_REUSEADDR (SO_REUSEPORT is set by Tokio on Linux by default)
    info!(addr = %bind_addr, "listening for connections");

    // ── Signal handlers ───────────────────────────────────────────
    let config_holder_sighup = Arc::clone(&config_holder);
    let config_path_sighup = config_path.clone();

    // SIGHUP → hot-reload config
    tokio::spawn(async move {
        let mut sighup = signal(SignalKind::hangup()).expect("failed to register SIGHUP");
        loop {
            sighup.recv().await;
            info!("received SIGHUP, reloading config");
            match config::hot_reload(&config_path_sighup, &config_holder_sighup) {
                Ok(()) => info!("config reloaded successfully"),
                Err(e) => error!(error = %e, "failed to reload config (keeping old config)"),
            }
        }
    });

    // SIGTERM/SIGINT → graceful shutdown
    let shutdown = async {
        let mut sigterm = signal(SignalKind::terminate()).expect("failed to register SIGTERM");
        let mut sigint = signal(SignalKind::interrupt()).expect("failed to register SIGINT");

        tokio::select! {
            _ = sigterm.recv() => info!("received SIGTERM"),
            _ = sigint.recv() => info!("received SIGINT"),
        }
    };

    // ── Accept loop ───────────────────────────────────────────────
    let accept_loop = async {
        loop {
            let (stream, remote_addr) = match listener.accept().await {
                Ok(conn) => conn,
                Err(e) => {
                    warn!(error = %e, "failed to accept connection");
                    continue;
                }
            };

            let balancer = Arc::clone(&balancer);

            tokio::spawn(async move {
                let service = service_fn(move |req: Request<Incoming>| {
                    let balancer = Arc::clone(&balancer);
                    async move {
                        Ok::<_, hyper::Error>(balancer.handle_request(req).await)
                    }
                });

                if let Err(e) = http1::Builder::new()
                    .keep_alive(true)
                    .serve_connection(hyper_util::rt::TokioIo::new(stream), service)
                    .await
                {
                    if !e.to_string().contains("connection closed") {
                        warn!(
                            remote_addr = %remote_addr,
                            error = %e,
                            "connection error"
                        );
                    }
                }
            });
        }
    };

    // Wait for shutdown signal or accept loop (which runs forever)
    tokio::select! {
        _ = accept_loop => {},
        _ = shutdown => {
            info!("initiating graceful shutdown");

            // Cancel health check tasks
            for handle in health_handles {
                handle.abort();
            }

            // Give in-flight requests time to drain
            info!("draining in-flight requests (30s max)");
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;

            info!("shutdown complete");
        }
    }
}

// ─── Metrics Server ─────────────────────────────────────────────────

async fn run_metrics_server(addr: SocketAddr) {
    let listener = TcpListener::bind(addr)
        .await
        .expect("failed to bind metrics server");

    info!(addr = %addr, "metrics server listening");

    loop {
        let (stream, _) = match listener.accept().await {
            Ok(conn) => conn,
            Err(e) => {
                warn!(error = %e, "metrics: failed to accept");
                continue;
            }
        };

        tokio::spawn(async move {
            let service = service_fn(|req: Request<Incoming>| async move {
                let resp = if req.uri().path() == "/metrics" {
                    let body = metrics::encode_metrics();
                    Response::builder()
                        .status(200)
                        .header("content-type", "text/plain; version=0.0.4; charset=utf-8")
                        .body(Full::new(Bytes::from(body)))
                        .unwrap()
                } else {
                    Response::builder()
                        .status(404)
                        .body(Full::new(Bytes::from("Not Found")))
                        .unwrap()
                };
                Ok::<_, hyper::Error>(resp)
            });

            if let Err(e) = http1::Builder::new()
                .serve_connection(hyper_util::rt::TokioIo::new(stream), service)
                .await
            {
                if !e.to_string().contains("connection closed") {
                    warn!(error = %e, "metrics connection error");
                }
            }
        });
    }
}

// ─── Tracing Init ───────────────────────────────────────────────────

fn init_tracing() {
    use tracing_subscriber::prelude::*;
    use tracing_subscriber::{fmt, EnvFilter};

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    let is_production = std::env::var("RUST_LOG")
        .map(|v| v == "info" || v == "warn" || v == "error")
        .unwrap_or(true);

    if is_production {
        // JSON output for production (Coolify log aggregation)
        tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt::layer().json().flatten_event(true))
            .init();
    } else {
        // Pretty colored output for development
        tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt::layer().pretty())
            .init();
    }
}
