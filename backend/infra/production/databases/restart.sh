#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🔄 Restarting database infrastructure..."

# 1. Validate required env vars
if [ -z "$ALLOWED_IP" ]; then
  echo "❌ ALLOWED_IP is not set in .env"
  exit 1
fi

# 2. Ensure TLS directories still exist (do NOT regenerate certs)
mkdir -p clickhouse/certificates
mkdir -p mongo/tls
mkdir -p redis/tls

# 3. Apply firewall rules safely (idempotent)
if [[ $EUID -eq 0 ]]; then
  echo "🔒 Ensuring firewall rules are in place..."

  # Docker-safe chain
  if iptables -L DOCKER-USER >/dev/null 2>&1; then
    # Allow trusted IP
    iptables -C DOCKER-USER -p tcp -s "$ALLOWED_IP" -j ACCEPT 2>/dev/null \
      || iptables -I DOCKER-USER -p tcp -s "$ALLOWED_IP" -j ACCEPT

    # Drop others on DB ports
    iptables -C DOCKER-USER -p tcp -m multiport \
      --dports 8443,9440,27017,6379 \
      -j DROP 2>/dev/null \
      || iptables -A DOCKER-USER -p tcp -m multiport \
        --dports 8443,9440,27017,6379 -j DROP
  fi
else
  echo "⚠️  Not running as root. Firewall rules unchanged."
fi

# 4. Restart containers cleanly
echo "🛑 Stopping containers..."
docker-compose down

echo "▶️  Starting containers..."
docker-compose up -d

# 5. Status
echo "📊 Container status:"
docker-compose ps

echo "✅ Restart completed successfully"
