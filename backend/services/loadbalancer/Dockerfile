# ── Stage 1: Builder ──────────────────────────────────
FROM rust:1-bookworm AS builder
WORKDIR /app

# Cache dependency layer separately from source
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main(){}" > src/main.rs
RUN cargo build --release
RUN rm src/main.rs

# Copy source and rebuild (only changed code recompiles)
COPY src ./src
RUN touch src/main.rs && cargo build --release

# ── Stage 2: Runtime ─────────────────────────────────
# Using slim instead of distroless so we have a shell for
# environment variable substitution via entrypoint.sh
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    gettext-base ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/loadbalancer  /app/loadbalancer
COPY config/config.toml  /app/config/config.toml.template
COPY entrypoint.sh        /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080 9091

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9091/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
