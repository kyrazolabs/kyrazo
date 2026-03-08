#!/bin/bash
# Kyrazo Load Balancer Setup Script
# Run on the LB server: bash setup.sh
#
# This installs Nginx directly on the host (no Docker)
# so it can reach backend servers without Docker networking issues.

set -e

# ─── Configuration ──────────────────────────────────────────────────
# Replace these with your actual backend IPs and ports

INGEST_SERVER1="152.53.35.61:9000"
INGEST_SERVER2="152.53.35.61:9000"

DASHBOARD_SERVER1="REPLACE_WITH_IP:PORT"
DASHBOARD_SERVER2="REPLACE_WITH_IP:PORT"

API_SERVER1="REPLACE_WITH_IP:PORT"
API_SERVER2="REPLACE_WITH_IP:PORT"

SSL_CERT="/data/coolify/proxy/certs/loadbalancer.pem"

# ─── Install Nginx ──────────────────────────────────────────────────

echo "📦 Installing Nginx..."
apt update && apt install -y nginx

# ─── Stop Coolify Proxy (if running) ────────────────────────────────

echo "🛑 Stopping Coolify proxy to free ports 80/443..."
# Coolify uses Caddy as its proxy. Stop it so Nginx can use 80/443.
docker stop coolify-proxy 2>/dev/null || true

# ─── Configure Nginx ────────────────────────────────────────────────

echo "⚙️  Configuring Nginx load balancer..."

# Replace placeholder IPs in the config
cp nginx.conf /etc/nginx/nginx.conf

sed -i "s|INGEST_SERVER1_IP|${INGEST_SERVER1}|g" /etc/nginx/nginx.conf
sed -i "s|INGEST_SERVER2_IP|${INGEST_SERVER2}|g" /etc/nginx/nginx.conf
sed -i "s|DASHBOARD_SERVER1_IP|${DASHBOARD_SERVER1}|g" /etc/nginx/nginx.conf
sed -i "s|DASHBOARD_SERVER2_IP|${DASHBOARD_SERVER2}|g" /etc/nginx/nginx.conf
sed -i "s|API_SERVER1_IP|${API_SERVER1}|g" /etc/nginx/nginx.conf
sed -i "s|API_SERVER2_IP|${API_SERVER2}|g" /etc/nginx/nginx.conf

# Update SSL cert path
sed -i "s|/data/coolify/proxy/certs/loadbalancer.pem|${SSL_CERT}|g" /etc/nginx/nginx.conf

# ─── Test & Start ───────────────────────────────────────────────────

echo "🔍 Testing Nginx configuration..."
nginx -t

echo "🚀 Starting Nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "✅ Nginx load balancer is running!"
echo ""
echo "Test it:"
echo "  curl -k https://localhost/ingest/v1/health"
echo "  curl -k https://localhost/dashboard/v1/health"
echo "  curl -k https://localhost/v1/health"
