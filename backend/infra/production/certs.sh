#!/bin/bash

set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
OUTPUT_DIR="$SCRIPT_DIR/certs"

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

echo "----------------------------------------"
echo "TLS Certificate Generation Script"
echo "Generating certificates in: $OUTPUT_DIR"
echo "----------------------------------------"

# First step: CA Generation
echo "Step 1: CA Setup"
echo "Would you like to:"
echo "1) Generate a new CA"
echo "2) Enter CA manually (copy from another path)"
echo "3) Use existing CA files already in $OUTPUT_DIR"
read -p "Option [1-3]: " ca_option

if [ "$ca_option" == "1" ]; then
  echo "Generating CA..."
  openssl genrsa -out "$OUTPUT_DIR/ca.key" 4096
  openssl req -x509 -new -nodes -key "$OUTPUT_DIR/ca.key" \
    -sha256 -days 3650 \
    -subj "/CN=NATS-CA" \
    -out "$OUTPUT_DIR/ca.pem"
  echo "CA generated: $OUTPUT_DIR/ca.key, $OUTPUT_DIR/ca.pem"
elif [ "$ca_option" == "2" ]; then
  read -p "Enter path to ca.key: " ca_key_path
  read -p "Enter path to ca.pem: " ca_pem_path
  
  if [ ! -f "$ca_key_path" ] || [ ! -f "$ca_pem_path" ]; then
    echo "Error: Files not found."
    exit 1
  fi
  
  cp "$ca_key_path" "$OUTPUT_DIR/ca.key"
  cp "$ca_pem_path" "$OUTPUT_DIR/ca.pem"
  echo "CA files copied to $OUTPUT_DIR."
elif [ "$ca_option" == "3" ]; then
  if [ ! -f "$OUTPUT_DIR/ca.key" ] || [ ! -f "$OUTPUT_DIR/ca.pem" ]; then
    echo "Error: CA files not found in $OUTPUT_DIR."
    exit 1
  fi
  echo "Using existing CA files in $OUTPUT_DIR."
else
  echo "Invalid option."
  exit 1
fi

# Second step: Certificate name and CSR
echo ""
echo "Step 2: Certificate Name"
read -p "Enter the name for the certificate (e.g., nats-3): " CERT_NAME

if [ -z "$CERT_NAME" ]; then
  echo "Error: Certificate name cannot be empty."
  exit 1
fi

echo "Generating $CERT_NAME.key and CSR..."
openssl genrsa -out "$OUTPUT_DIR/$CERT_NAME.key" 2048
openssl req -new -key "$OUTPUT_DIR/$CERT_NAME.key" \
  -subj "/CN=$CERT_NAME" \
  -out "$OUTPUT_DIR/$CERT_NAME.csr"

# Third step: SAN (IPs and DNSs)
echo ""
echo "Step 3: SAN Configuration (Subject Alt Names)"
IP_COUNT=1
DNS_COUNT=1
ALTS=""

while true; do
  read -p "Add an IP? (y/n): " add_ip
  if [ "$add_ip" == "y" ]; then
    read -p "Enter IP address: " ip_addr
    ALTS="${ALTS}IP.$IP_COUNT = $ip_addr\n"
    IP_COUNT=$((IP_COUNT + 1))
  else
    break
  fi
done

while true; do
  read -p "Add a DNS? (y/n): " add_dns
  if [ "$add_dns" == "y" ]; then
    read -p "Enter DNS name: " dns_name
    ALTS="${ALTS}DNS.$DNS_COUNT = $dns_name\n"
    DNS_COUNT=$((DNS_COUNT + 1))
  else
    break
  fi
done

# Default name if none provided
if [ -z "$ALTS" ]; then
  ALTS="DNS.1 = $CERT_NAME"
fi

cat > "$OUTPUT_DIR/$CERT_NAME.ext" <<EOF
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
$(echo -e "$ALTS")
EOF

echo "Extension file $OUTPUT_DIR/$CERT_NAME.ext created."

# Fourth step: Sign the certificate
echo ""
echo "Step 4: Signing Certificate"
openssl x509 -req -in "$OUTPUT_DIR/$CERT_NAME.csr" \
  -CA "$OUTPUT_DIR/ca.pem" -CAkey "$OUTPUT_DIR/ca.key" -CAcreateserial \
  -out "$OUTPUT_DIR/$CERT_NAME.pem" -days 365 -sha256 \
  -extfile "$OUTPUT_DIR/$CERT_NAME.ext"

echo "----------------------------------------"
echo "Success! Generated files in $OUTPUT_DIR/:"
echo "- $CERT_NAME.key"
echo "- $CERT_NAME.pem"
echo "- $CERT_NAME.csr"
echo "- $CERT_NAME.ext"
echo "----------------------------------------"

# Set permissions
echo "Setting permissions for $OUTPUT_DIR..."
chmod 755 "$OUTPUT_DIR"
chmod 644 "$OUTPUT_DIR"/ca.pem
chmod 644 "$OUTPUT_DIR/$CERT_NAME.pem"
chmod 644 "$OUTPUT_DIR/$CERT_NAME.key"
echo "Permissions set: 700 for directory, 600 for files."