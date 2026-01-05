#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Starting database infrastructure..."

# 1. Ensure certificates and dhparams are ready (though entrypoint handles it)
# We can pre-generate them here if needed for volume mapping consistency
mkdir -p clickhouse/certificates
mkdir -p mongo/tls
mkdir -p redis/tls

# 2. Check if we should apply host-level firewall rules (iptables)
# Note: This requires sudo/root and is optional but recommended
if [[ $EUID -eq 0 ]]; then
  echo "🔒 Applying IP-based firewall rules for ports 8443, 9440, 27017, 6379..."
  # Flush existing rules for these ports to avoid duplicates (careful here!)
  # For safety, we just add the allowed IP and drop others
  iptables -I INPUT -p tcp -s $ALLOWED_IP -j ACCEPT
  # Note: Standard docker behavior might bypass INPUT chain, 
  # but DOCKER-USER chain is preferred for Docker
  if iptables -L DOCKER-USER >/dev/null 2>&1; then
    iptables -I DOCKER-USER -p tcp -m multiport --dports 8443,9440,27017,6379 -s $ALLOWED_IP -j ACCEPT
    iptables -A DOCKER-USER -p tcp -m multiport --dports 8443,9440,27017,6379 -j DROP
  fi
else
  echo "⚠️  Not running as root. Skipping iptables configuration."
  echo "ℹ️  Application-level IP restrictions in ClickHouse/Mongo/Redis configs will still apply."
fi

# 3. Start the containers
docker compose up -d

echo "✅ Infrastructure is up and restricted to $ALLOWED_IP"
echo "📊 Healthcheck Status:"
docker compose ps
