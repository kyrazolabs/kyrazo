#!/bin/bash

# Configuration
SSL_BASE_DIR="/data/coolify/ssl/dragonfly"
DRAGONFLY_DOMAIN_OR_IP="159.195.64.180"
DAYS_VALID=365

mkdir -p "$SSL_BASE_DIR"
cd "$SSL_BASE_DIR"

echo "--- Generating CA ---"
openssl genrsa -out ca.key 4096 &> /dev/null
openssl req -x509 -new -nodes -key ca.key -sha256 -days $DAYS_VALID -out ca.crt -subj "/CN=MyDragonfly-CA" &> /dev/null

echo "--- Generating Server Cert ---"
openssl genrsa -out dragonfly.key 2048 &> /dev/null
openssl req -new -key dragonfly.key -out dragonfly.csr -subj "/CN=$DRAGONFLY_DOMAIN_OR_IP" &> /dev/null
openssl x509 -req -in dragonfly.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out dragonfly.crt -days $DAYS_VALID -sha256 &> /dev/null

echo "--- Generating Client Cert ---"
# On the production server (where /etc/dragonfly/ssl/ca.key exists):
openssl genrsa -out client.key 2048
openssl req -new -key client.key -subj "/CN=dragonfly-client" -out client.csr
openssl x509 -req -in client.csr \
  -CA ./ca.crt \
  -CAkey ./ca.key \
  -CAcreateserial \
  -out client.crt -days 365 -sha256


# Dragonfly can take separate keys or a combined PEM. Let's keep them separate for clarity.
sudo chown -R 999:999 . 
chmod 644 dragonfly.crt ca.crt
chmod 600 dragonfly.key

echo "---------------------------------------------------"
echo "✅ Dragonfly Certificates Ready!"
echo "---------------------------------------------------"
