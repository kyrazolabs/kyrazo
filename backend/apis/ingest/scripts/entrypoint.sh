#!/bin/sh
set -e

LOG_DIR="/app/apis/ingest/logs"
CERTS_DIR="/data/nats/certs"

# Ensure the logs directory exists and is writable by the bun user (UID 1000)
# This runs as root so it works even when the host volume is owned by root.
mkdir -p "$LOG_DIR"
chown -R bun:bun "$LOG_DIR"
chmod 775 "$LOG_DIR"


# Use a more robust check: attempt to fix permissions but don't fail if the filesystem is read-only.
# This works even when root [ -w ] gives false positives on RO mounts.
mkdir -p "$CERTS_DIR"
echo "🔧 Attempting to set permissions for $CERTS_DIR..."
chown -R bun:bun "$CERTS_DIR" 2>/dev/null || echo "ℹ️ $CERTS_DIR appears to be read-only, skipping chown."
chmod 775 "$CERTS_DIR" 2>/dev/null || echo "ℹ️ $CERTS_DIR appears to be read-only, skipping chmod."

# Handle Coolify CA certificate if mounted
CA_CRT="/etc/ssl/certs/ca.pem"
if [ -f "$CA_CRT" ]; then
    echo "📜 Found Coolify CA certificate at $CA_CRT"
    chmod 644 "$CA_CRT" 2>/dev/null || echo "ℹ️ $CA_CRT is read-only, skipping chmod."
fi

# Drop down to the bun user and start the application
exec su-exec bun bun run src/index.ts
