# ── Stage 1: Builder ──────────────────────────────────
FROM rust:1.78-bookworm AS builder
WORKDIR /app

ENV RUSTFLAGS="-C target-cpu=native"

# Cache dependency layer separately from source
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs
RUN cargo build --release
RUN rm src/main.rs

# Copy source and rebuild (only changed code recompiles)
COPY src ./src
COPY config ./config
RUN touch src/main.rs && cargo build --release

# ── Stage 2: Runtime (distroless = minimal attack surface) ──
FROM gcr.io/distroless/cc-debian12
WORKDIR /app
COPY --from=builder /app/target/release/rust-lb  /app/rust-lb
COPY --from=builder /app/config/config.toml       /app/config/config.toml
EXPOSE 8080 9090
ENTRYPOINT ["/app/rust-lb", "--config", "/app/config/config.toml"]
