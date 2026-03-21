#!/bin/sh
set -e

CERTS_DIR="/data/nats/certs"

# Use a more robust check: attempt to fix permissions but don't fail if the filesystem is read-only.
# This works even when root [ -w ] gives false positives on RO mounts.
mkdir -p "$CERTS_DIR"
echo "🔧 Attempting to set permissions for $CERTS_DIR..."
chown -R bun:bun "$CERTS_DIR" 2>/dev/null || echo "ℹ️ $CERTS_DIR appears to be read-only, skipping chown."
chmod 775 "$CERTS_DIR" 2>/dev/null || echo "ℹ️ $CERTS_DIR appears to be read-only, skipping chmod."

# Drop down to the bun user and start the application
exec su-exec bun bun run prod
