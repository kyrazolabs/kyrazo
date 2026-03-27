#!/bin/sh
set -e

LOG_DIR="/app/runtime/worker/logs"
CERTS_DIR="/data/nats/certs"

if [ "$(id -u)" = "0" ]; then
    echo "🔧 Setting permissions for log directory..."
    mkdir -p "$LOG_DIR"
    chown -R bun:bun "$LOG_DIR" 2>/dev/null || echo "ℹ️ $LOG_DIR appears to be read-only or host-managed, skipping chown."
    chmod -R 775 "$LOG_DIR" 2>/dev/null || echo "ℹ️ $LOG_DIR appears to be read-only or host-managed, skipping chmod."
fi


if [ "$(id -u)" = "0" ]; then
    mkdir -p "$CERTS_DIR"
    echo "🔧 Attempting to set permissions for $CERTS_DIR..."
    chown -R bun:bun "$CERTS_DIR" 2>/dev/null || echo "ℹ️ $CERTS_DIR appears to be read-only or host-managed, skipping chown."
    chmod -R 775 "$CERTS_DIR" 2>/dev/null || echo "ℹ️ $CERTS_DIR appears to be read-only or host-managed, skipping chmod."
fi

# Handle unified certificates if mounted
for dir in redis mongodb; do
    if [ -d "/etc/ssl/$dir" ]; then
        echo "🔧 Setting permissions for /etc/ssl/$dir..."
        chown -R bun:bun "/etc/ssl/$dir" 2>/dev/null || echo "ℹ️ /etc/ssl/$dir is read-only, skipping chown."
        chmod 755 "/etc/ssl/$dir" 2>/dev/null || echo "ℹ️ /etc/ssl/$dir is read-only, skipping chmod."
        find "/etc/ssl/$dir" -type f \( -name "*.crt" -o -name "*.pem" \) -exec chmod 644 {} \; 2>/dev/null
        find "/etc/ssl/$dir" -type f -name "*.key" -exec chmod 600 {} \; 2>/dev/null
    fi
done



# Drop down to the bun user and start the application if running as root
if [ "$(id -u)" = "0" ]; then
    exec su-exec bun bun run src/index.ts
else
    exec bun run src/index.ts
fi
