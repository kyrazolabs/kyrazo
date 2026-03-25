#!/bin/sh
set -e

LOG_DIR="/app/apis/dashboard/logs"

# Ensure the logs directory exists and is writable by the bun user (UID 1000)
# This runs as root so it works even when the host volume is owned by root.
mkdir -p "$LOG_DIR"
chown -R bun:bun "$LOG_DIR"
chmod 775 "$LOG_DIR"

# Handle unified certificates if mounted
for dir in redis mongodb clickhouse; do
    if [ -d "/etc/ssl/$dir" ]; then
        echo "🔧 Setting permissions for /etc/ssl/$dir..."
        chown -R bun:bun "/etc/ssl/$dir" 2>/dev/null || echo "ℹ️ /etc/ssl/$dir is read-only, skipping chown."
        chmod 755 "/etc/ssl/$dir" 2>/dev/null || echo "ℹ️ /etc/ssl/$dir is read-only, skipping chmod."
        find "/etc/ssl/$dir" -type f \( -name "*.crt" -o -name "*.pem" \) -exec chmod 644 {} \; 2>/dev/null
        find "/etc/ssl/$dir" -type f -name "*.key" -exec chmod 600 {} \; 2>/dev/null
    fi
done

# Drop down to the bun user and start the application
exec su-exec bun bun run src/index.ts
