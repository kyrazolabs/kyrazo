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

# Handle unified certificates (Relocate if unreadable due to read-only mounts)
WRITABLE_SSL_DIR="/tmp/ssl"
mkdir -p "$WRITABLE_SSL_DIR"

for service in redis mongodb; do
    SOURCE_DIR="/etc/ssl/$service"
    TARGET_DIR="$WRITABLE_SSL_DIR/$service"

    if [ -d "$SOURCE_DIR" ]; then
        echo "🔧 Checking permissions for $SOURCE_DIR..."
        
        # Test if bun user can read the private keys
        # We perform a trial read check on any .key or .pem file
        UNREADABLE=false
        for f in "$SOURCE_DIR"/*.key "$SOURCE_DIR"/*.pem; do
            if [ -f "$f" ] && ! su-exec bun cat "$f" >/dev/null 2>&1; then
                UNREADABLE=true
                break
            fi
        done

        if [ "$UNREADABLE" = "true" ]; then
            echo "⚠️  $SOURCE_DIR certificates are unreadable by 'bun' user. Relocating to $TARGET_DIR..."
            mkdir -p "$TARGET_DIR"
            cp -L "$SOURCE_DIR"/* "$TARGET_DIR/" 2>/dev/null || true
            chown -R bun:bun "$TARGET_DIR"
            chmod -R 700 "$TARGET_DIR"
            
            # Export environment variables to point to the new locations
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
            fi
        else
            echo "✅ $SOURCE_DIR certificates are readable."
        fi
    fi
done

# Drop down to the bun user and start the application if running as root
if [ "$(id -u)" = "0" ]; then
    exec su-exec bun bun run prod
else
    exec bun run prod
fi
