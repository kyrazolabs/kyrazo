#!/bin/bash

# Configuration
SSL_BASE_DIR="$(pwd)/mongo"
MONGO_DOMAIN_OR_IP="159.195.64.180"
DAYS_VALID=365

mkdir -p "$SSL_BASE_DIR"
cd "$SSL_BASE_DIR"

echo "--- Installing openssl ---"
apt install openssl

echo "--- Generating Certificate Authority (CA) ---"
openssl genrsa -out ca.key 4096 &> /dev/null
openssl req -x509 -new -nodes -key ca.key -sha256 -days $DAYS_VALID -out ca.crt -subj "/CN=MyMongoDB-CA" &> /dev/null

echo "--- Generating Server Certificate ---"
openssl genrsa -out mongodb.key 2048 &> /dev/null
openssl req -new -key mongodb.key -out mongodb.csr -subj "/CN=$MONGO_DOMAIN_OR_IP=" &> /dev/null

echo "--- Signing Server Certificate with CA ---"
openssl x509 -req -in mongodb.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out mongodb.crt -days $DAYS_VALID -sha256 &> /dev/null

echo "--- Creating combined PEM file ---"
cat mongodb.key mongodb.crt > mongodb.pem

echo "--- Adjusting Permissions for Docker (UID 999) ---"
chmod 600 mongodb.pem mongodb.key ca.key
sudo chown -R 999:999 "$SSL_BASE_DIR"

echo "---------------------------------------------------"
echo "✅ Certificates Generated Successfully!"
echo "---------------------------------------------------"
echo "FULL PATHS FOR COOLIFY MOUNTS:"
echo "---------------------------------------------------"
echo "Combined PEM (Key + Cert): $SSL_BASE_DIR/mongodb.pem"
echo "CA Certificate:            $SSL_BASE_DIR/ca.crt"
echo "---------------------------------------------------"
echo "Instructions:"
echo "1. In Coolify, mount these files to /data/coolify/ssl/mongo/"
echo "2. Add the following to your MongoDB arguments or environment:"
echo "   --tlsMode requireTLS --tlsCertificateKeyFile /data/coolify/ssl/mongo/mongodb.pem --tlsCAFile /data/coolify/ssl/mongo/ca.crt"
