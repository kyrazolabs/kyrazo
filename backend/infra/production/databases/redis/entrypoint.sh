#!/bin/sh
set -e

TLS_DIR=/usr/local/etc/redis/tls
CERT_FILE=$TLS_DIR/redis.crt
KEY_FILE=$TLS_DIR/redis.key
CA_FILE=$TLS_DIR/ca.crt

mkdir -p $TLS_DIR

if [ ! -f "$CERT_FILE" ]; then
  echo "Generating self-signed TLS certificates..."
  openssl genrsa -out $TLS_DIR/ca.key 4096
  openssl req -x509 -new -nodes -key $TLS_DIR/ca.key -sha256 -days 3650 -out $CA_FILE -subj "/CN=kyrazo-redis"

  openssl genrsa -out $TLS_DIR/redis.key 4096
  openssl req -new -key $TLS_DIR/redis.key -out $TLS_DIR/redis.csr -subj "/CN=kyrazo-redis"
    -CAcreateserial -out $CERT_FILE -days 825 -sha256
fi

exec redis-server /usr/local/etc/redis/redis.conf
