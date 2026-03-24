#!/bin/sh
set -e

CONFIG_TEMPLATE="/app/config/config.toml.template"
CONFIG_OUTPUT="/app/config/config.toml"

# Defaults
PORT="${PORT:-8080}"
HEALTH_CHECK_PATH="${HEALTH_CHECK_PATH:-/v1/health}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-5}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-2}"
RATE_LIMIT_RPS="${RATE_LIMIT_RPS:-1000}"
RATE_LIMIT_BURST="${RATE_LIMIT_BURST:-2000}"
export METRICS_BIND=${METRICS_BIND:-0.0.0.0:9091}
export SKIP_SSL_VERIFY=${SKIP_SSL_VERIFY:-false}

echo "loadbalancer: substituting environment variables into config..."

# Use envsubst to replace ${VAR} placeholders in the template
envsubst < "$CONFIG_TEMPLATE" > "$CONFIG_OUTPUT"

echo "loadbalancer: config generated at $CONFIG_OUTPUT"

# Handle Coolify CA certificate if mounted
CA_CRT="/etc/ssl/certs/ca.pem"
if [ -f "$CA_CRT" ]; then
    echo "📜 Found Coolify CA certificate at $CA_CRT"
    chmod 644 "$CA_CRT" 2>/dev/null || echo "ℹ️ $CA_CRT is read-only, skipping chmod."
fi

echo "loadbalancer: starting load balancer on port $PORT..."

exec /app/loadbalancer --config "$CONFIG_OUTPUT"
