#!/bin/sh
set -e

TLS_DIR=/etc/clickhouse-server/certificates
CERT_FILE=$TLS_DIR/server.crt
KEY_FILE=$TLS_DIR/server.key
CA_FILE=$TLS_DIR/ca.crt

mkdir -p $TLS_DIR

if [ ! -f "$CERT_FILE" ]; then
  echo "Generating self-signed TLS certificates..."
  openssl genrsa -out $TLS_DIR/ca.key 4096
  openssl req -x509 -new -nodes -key $TLS_DIR/ca.key -sha256 -days 3650 -out $CA_FILE -subj "/CN=clickhouse-ca"

  openssl genrsa -out $TLS_DIR/server.key 4096
  openssl req -new -key $TLS_DIR/server.key -out $TLS_DIR/server.csr -subj "/CN=kyrazo-clickhouse"
  openssl x509 -req -in $TLS_DIR/server.csr -CA $CA_FILE -CAkey $TLS_DIR/ca.key \
    -CAcreateserial -out $CERT_FILE -days 825 -sha256
  
  openssl dhparam -out $TLS_DIR/dhparam.pem 2048
  
  chmod 600 $TLS_DIR/server.key $TLS_DIR/ca.key
  chmod 644 $TLS_DIR/server.crt $TLS_DIR/ca.crt $TLS_DIR/dhparam.pem
fi

exec /usr/bin/clickhouse-server --config-file=/etc/clickhouse-server/config.xml
