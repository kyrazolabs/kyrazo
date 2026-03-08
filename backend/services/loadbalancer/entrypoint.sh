#!/bin/sh
# Replace placeholder IPs with environment variables at runtime
sed -i "s|PORT|${PORT}|g" /etc/nginx/nginx.conf
sed -i "s|INGEST_SERVER1_IP|${INGEST_SERVER1_IP}|g" /etc/nginx/nginx.conf
sed -i "s|INGEST_SERVER2_IP|${INGEST_SERVER2_IP}|g" /etc/nginx/nginx.conf
sed -i "s|DASHBOARD_SERVER1_IP|${DASHBOARD_SERVER1_IP}|g" /etc/nginx/nginx.conf
sed -i "s|DASHBOARD_SERVER2_IP|${DASHBOARD_SERVER2_IP}|g" /etc/nginx/nginx.conf
sed -i "s|API_SERVER1_IP|${API_SERVER1_IP}|g" /etc/nginx/nginx.conf
sed -i "s|API_SERVER2_IP|${API_SERVER2_IP}|g" /etc/nginx/nginx.conf

echo "=== Nginx Load Balancer ==="
echo "Ingest:    ${INGEST_SERVER1_IP}, ${INGEST_SERVER2_IP}"
echo "Dashboard: ${DASHBOARD_SERVER1_IP}, ${DASHBOARD_SERVER2_IP}"
echo "API:       ${API_SERVER1_IP}, ${API_SERVER2_IP}"
echo "==========================="

exec nginx -g "daemon off;"
