#!/bin/bash
set -e

TLS_DIR=/etc/mongo/tls
PEM_FILE=$TLS_DIR/server.pem
CA_FILE=$TLS_DIR/ca.crt

mkdir -p $TLS_DIR

if [ ! -f "$PEM_FILE" ]; then
  echo "Generating self-signed TLS certificates..."

  # CA
  openssl genrsa -out $TLS_DIR/ca.key 4096
  openssl req -x509 -new -nodes \
    -key $TLS_DIR/ca.key \
    -sha256 -days 3650 \
    -out $CA_FILE \
    -subj "/CN=kyrazo-mongo-ca"

  # Server key
  openssl genrsa -out $TLS_DIR/server.key 4096

  # CSR
  openssl req -new \
    -key $TLS_DIR/server.key \
    -out $TLS_DIR/server.csr \
    -subj "/CN=kyrazo-mongo"

  # Server cert
  openssl x509 -req \
    -in $TLS_DIR/server.csr \
    -CA $CA_FILE \
    -CAkey $TLS_DIR/ca.key \
    -CAcreateserial \
    -out $TLS_DIR/server.crt \
    -days 825 -sha256

  # PEM (key + cert)
  cat $TLS_DIR/server.key $TLS_DIR/server.crt > $PEM_FILE

  chmod 600 $PEM_FILE
  chmod 644 $CA_FILE
fi

exec mongod --config /etc/mongo/mongod.conf
