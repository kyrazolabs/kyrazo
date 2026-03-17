#!/bin/sh
set -e

CERTS_DIR="/data/nats/certs"

# Ensure the certs directory exists. If it's a writable mount or a local dir, fix permissions.
# If it's a read-only mount, skip permission changes to avoid errors.
mkdir -p "$CERTS_DIR"
if [ -w "$CERTS_DIR" ]; then
    echo "🔧 Setting permissions for $CERTS_DIR..."
    chown -R bun:bun "$CERTS_DIR"
    chmod 775 "$CERTS_DIR"
else
    echo "ℹ️ $CERTS_DIR is read-only or not writable, skipping permission changes."
fi

# Drop down to the bun user and start the application
exec su-exec bun bun run prod
