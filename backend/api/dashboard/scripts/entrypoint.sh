#!/bin/sh
set -e

LOG_DIR="/app/api/dashboard/logs"

if [ "$(id -u)" = "0" ]; then
    echo "🔧 Setting permissions for log directory..."
    mkdir -p "$LOG_DIR"
    chown -R bun:bun "$LOG_DIR" 2>/dev/null || echo "ℹ️ $LOG_DIR appears to be read-only or host-managed, skipping chown."
    chmod -R 775 "$LOG_DIR" 2>/dev/null || echo "ℹ️ $LOG_DIR appears to be read-only or host-managed, skipping chmod."
fi

# Handle unified certificates (Relocate to writable /tmp/ssl to ensure consistency and readability)
WRITABLE_SSL_DIR="/tmp/ssl"
mkdir -p "$WRITABLE_SSL_DIR"

# Handle Redis, MongoDB, and Clickhouse Certificates
for service in redis mongodb clickhouse; do
    SOURCE_DIR="/etc/ssl/$service"
    TARGET_DIR="$WRITABLE_SSL_DIR/$service"

    if [ -d "$SOURCE_DIR" ]; then
        FILES_PRESENT=$(ls "$SOURCE_DIR"/*.crt "$SOURCE_DIR"/*.key "$SOURCE_DIR"/*.pem 2>/dev/null | wc -l)

        if [ "$FILES_PRESENT" -gt 0 ]; then
            echo "🔧 Relocating $SOURCE_DIR certificates to $TARGET_DIR for consistent environment access..."
            mkdir -p "$TARGET_DIR"
            cp -L "$SOURCE_DIR"/* "$TARGET_DIR/" 2>/dev/null || true

            # Ensure proper ownership if running as root
            if [ "$(id -u)" = "0" ]; then
                chown -R bun:bun "$TARGET_DIR"
            fi
            chmod -R 700 "$TARGET_DIR"

            # ALWAYS export path overrides to ensure the app uses the writable copies
            if [ "$service" = "redis" ]; then
                export REDIS_CA_FILE="$TARGET_DIR/ca.crt"
                export REDIS_CERT_FILE="$TARGET_DIR/client.crt"
                export REDIS_KEY_FILE="$TARGET_DIR/client.key"
                export QUEUE_REDIS_CA_FILE="$TARGET_DIR/ca.crt"
                export QUEUE_REDIS_CERT_FILE="$TARGET_DIR/client.crt"
                export QUEUE_REDIS_KEY_FILE="$TARGET_DIR/client.key"
            elif [ "$service" = "mongodb" ]; then
                export MONGODB_CA_FILE="$TARGET_DIR/ca.crt"
                export MONGODB_CERT_KEY_FILE="$TARGET_DIR/mongodb.pem"
            elif [ "$service" = "clickhouse" ]; then
                export CLICKHOUSE_CA_FILE="$TARGET_DIR/ca.crt"
                export NODE_EXTRA_CA_CERTS="$TARGET_DIR/ca.crt"
            fi
        else
            echo "ℹ️  No certificate files found in $SOURCE_DIR, skipping relocation."
        fi
    fi
done


# Drop down to the bun user and start the application if running as root
if [ "$(id -u)" = "0" ]; then
    exec su-exec bun bun run dist/index.js
else
    exec bun run dist/index.js
fi
