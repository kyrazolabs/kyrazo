# loadbalancer — Internal HTTP Load Balancer

High-performance, lock-free HTTP load balancer written in Rust. Designed to sit
**behind** Coolify (Traefik/Caddy) which handles SSL termination, header rewriting,
and public-facing concerns.

```
Internet → Coolify (Traefik/Caddy) → [loadbalancer] → Backend Pool
```

## Features

- **Lock-free hot path** — `AtomicUsize` round-robin, `AtomicBool` health state, token-bucket rate limiter
- **Weighted round-robin** — pre-expanded backend sequence, zero runtime computation
- **Priority-based routing** — prefix matching rules sorted at startup
- **Active health checks** — independent Tokio task per backend with configurable thresholds
- **Connection pooling** — aggressive reuse via hyper 1.x client (90s idle, 32 max idle/host)
- **Prometheus metrics** — counters, histograms, gauges on a dedicated port
- **Hot-reload** — `SIGHUP` swaps config atomically via `ArcSwap`, zero downtime
- **Graceful shutdown** — `SIGTERM`/`SIGINT` drains in-flight requests

## Quick Start

```bash
# Build
cargo build --release

# Run
./target/release/loadbalancer --config config/config.toml

# Or with Docker Compose (includes 3 echo backends + Prometheus)
docker compose up --build
```

## Configuration Reference

See [`config/config.toml`](config/config.toml) for a fully commented example.

| Section          | Key                   | Description                                   |
| ---------------- | --------------------- | --------------------------------------------- |
| `[server]`       | `bind`                | Listen address (default: `0.0.0.0:8080`)      |
|                  | `metrics_bind`        | Prometheus endpoint (default: `0.0.0.0:9090`) |
|                  | `worker_threads`      | Tokio threads, `0` = auto-detect              |
|                  | `max_connections`     | Connection limit                              |
| `[[backends]]`   | `id`                  | Unique backend identifier                     |
|                  | `address`             | Internal HTTP address                         |
|                  | `weight`              | Round-robin weight (higher = more traffic)    |
|                  | `max_connections`     | Per-backend connection limit                  |
| `[health_check]` | `interval_secs`       | Check frequency                               |
|                  | `timeout_secs`        | Probe timeout                                 |
|                  | `path`                | Health endpoint path                          |
|                  | `healthy_threshold`   | Consecutive successes to mark healthy         |
|                  | `unhealthy_threshold` | Consecutive failures to mark unhealthy        |
| `[[rules]]`      | `match_path`          | Path prefix (e.g. `/api/*`)                   |
|                  | `match_methods`       | HTTP methods filter                           |
|                  | `backends`            | Backend IDs for this rule                     |
|                  | `priority`            | Higher = matched first                        |
| `[rate_limit]`   | `requests_per_second` | Token refill rate                             |
|                  | `burst`               | Max burst capacity                            |
| `[retry]`        | `max_attempts`        | Retry count on 5xx/errors                     |
|                  | `backoff_ms`          | Per-attempt delays                            |

## Hot-Reload

Send `SIGHUP` to reload configuration without dropping connections:

```bash
kill -HUP $(pidof loadbalancer)
```

## Coolify Deployment

1. Add as a service in Coolify — it only needs internal network access
2. Set the build pack to **Dockerfile**
3. Map Coolify's proxy to forward to port `8080`
4. Remove public port mappings from `docker-compose.yml` (Coolify handles external routing)
5. Configure backend addresses to point to your internal services

## Metrics

Prometheus metrics are exposed at `http://<metrics_bind>/metrics`:

| Metric                        | Type      | Labels                      |
| ----------------------------- | --------- | --------------------------- |
| `lb_requests_total`           | Counter   | `backend_id`, `status_code` |
| `lb_request_duration_seconds` | Histogram | `backend_id`                |
| `lb_active_connections`       | Gauge     | `backend_id`                |
| `lb_backend_healthy`          | Gauge     | `backend_id`                |
| `lb_upstream_errors_total`    | Counter   | `backend_id`, `error_type`  |
| `lb_rate_limited_total`       | Counter   | —                           |
| `lb_all_backends_down_total`  | Counter   | —                           |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    loadbalancer                            │
│                                                      │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Rate Limiter│→ │Rules     │→ │Round Robin       │ │
│  │(token      │  │Engine    │  │Strategy          │ │
│  │ bucket)    │  │(prefix   │  │(lock-free,       │ │
│  │            │  │ match)   │  │ weighted)        │ │
│  └────────────┘  └──────────┘  └────────┬─────────┘ │
│                                         │            │
│                              ┌──────────▼─────────┐ │
│                              │HTTP Forwarder      │ │
│                              │(connection pooling, │ │
│                              │ body streaming)     │ │
│                              └──────────┬─────────┘ │
│                                         │            │
│  ┌─────────────────┐           ┌────────▼────────┐  │
│  │Health Checker    │           │Backend Pool     │  │
│  │(1 task/backend)  │──────────▶│[b1] [b2] [b3]  │  │
│  └─────────────────┘           └─────────────────┘  │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │Metrics Server   │  │Config (ArcSwap)          │  │
│  │(:9090)          │  │SIGHUP → atomic reload    │  │
│  └─────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```
