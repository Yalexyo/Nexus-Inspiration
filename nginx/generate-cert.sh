#!/bin/sh
CERT_DIR="/etc/nginx/ssl"

if [ ! -f "$CERT_DIR/selfsigned.crt" ]; then
    echo "Generating self-signed SSL certificate..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 3650 \
        -newkey rsa:2048 \
        -keyout "$CERT_DIR/selfsigned.key" \
        -out "$CERT_DIR/selfsigned.crt" \
        -subj "/C=CN/ST=Local/L=Local/O=Internal/CN=172.20.58.37" \
        -addext "subjectAltName=IP:172.20.58.37"
    echo "Certificate generated."
else
    echo "Certificate already exists, skipping generation."
fi

# Start nginx
exec nginx -g 'daemon off;'
