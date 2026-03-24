#!/bin/sh
set -e

LOG_DIR="/app/services/ingestor/logs"

# Ensure the logs directory exists and is writable by the bun user (UID 1000)
# This runs as root so it works even when the host volume is owned by root.
mkdir -p "$LOG_DIR"
chown -R bun:bun "$LOG_DIR"
chmod 775 "$LOG_DIR"

# Handle Coolify CA certificate if mounted
CA_CRT="/etc/ssl/certs/coolify-ca.crt"
if [ -f "$CA_CRT" ]; then
    echo "📜 Found Coolify CA certificate at $CA_CRT"
    chmod 644 "$CA_CRT" 2>/dev/null || echo "ℹ️ $CA_CRT is read-only, skipping chmod."
fi

# Drop down to the bun user and start the application
exec su-exec bun bun run start
