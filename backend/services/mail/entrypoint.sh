#!/bin/sh
set -e

# Handle Coolify CA certificate if mounted
CA_CRT="/etc/ssl/certs/coolify-ca.crt"
if [ -f "$CA_CRT" ]; then
    echo "📜 Found Coolify CA certificate at $CA_CRT"
    chmod 644 "$CA_CRT" 2>/dev/null || echo "ℹ️ $CA_CRT is read-only, skipping chmod."
fi

# Drop down to the bun user and start the application
exec su-exec bun bun run start
