#!/bin/sh
set -e

# Handle unified certificates if mounted
for dir in redis; do
    if [ -d "/etc/ssl/$dir" ]; then
        echo "🔧 Setting permissions for /etc/ssl/$dir..."
        chown -R bun:bun "/etc/ssl/$dir" 2>/dev/null || echo "ℹ️ /etc/ssl/$dir is read-only, skipping chown."
        chmod 755 "/etc/ssl/$dir" 2>/dev/null || echo "ℹ️ /etc/ssl/$dir is read-only, skipping chmod."
        find "/etc/ssl/$dir" -type f \( -name "*.crt" -o -name "*.pem" \) -exec chmod 644 {} \; 2>/dev/null
        find "/etc/ssl/$dir" -type f -name "*.key" -exec chmod 600 {} \; 2>/dev/null
    fi
done


# Drop down to the bun user and start the application
exec su-exec bun bun run start
