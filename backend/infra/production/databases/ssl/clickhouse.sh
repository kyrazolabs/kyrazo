#!/bin/bash
SSL_BASE_DIR="/data/coolify/ssl/clickhouse"
CLICKHOUSE_IP="159.195.64.180"

mkdir -p "$SSL_BASE_DIR"
cd "$SSL_BASE_DIR"

# 1. Generate CA (Skip if you want to keep your existing one)
openssl genrsa -out ca.key 4096 &> /dev/null
openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.crt -subj "/CN=Kyrazo-CA" &> /dev/null

# 2. Create a temporary OpenSSL config for SAN
cat > openssl.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = $CLICKHOUSE_IP

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $CLICKHOUSE_IP
EOF

# 3. Generate Server Key & CSR using the config
openssl genrsa -out clickhouse.key 2048 &> /dev/null
openssl req -new -key clickhouse.key -out clickhouse.csr -config openssl.cnf &> /dev/null

# 4. Sign the Cert with the SAN extensions
openssl x509 -req -in clickhouse.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
-out clickhouse.crt -days 365 -sha256 -extensions v3_req -extfile openssl.cnf &> /dev/null

# 5. Fix Permissions for ClickHouse (Using 101 for your version 25.11)
sudo chown -R 101:101 .
chmod 600 clickhouse.key
chmod 644 clickhouse.crt ca.crt
sudo chmod 755 .

echo "✅ ClickHouse Certs with SAN Ready in $SSL_BASE_DIR"
