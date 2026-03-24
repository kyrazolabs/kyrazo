# NATS Production Cluster Setup (Public Network)

This directory contains the configuration and utilities for deploying a secure, production-grade NATS cluster on a public network using **mTLS** and **Cluster Authentication**.

---

## 🔐 1. Certificate Management (`certs.sh`)

For public networks, **mTLS (Mutual TLS)** is mandatory. Use the provided script to generate your certificates.

### How to use:

1.  Run `bash certs.sh` on your main server.
2.  **Step 3 (SANs)**: This is critical. You must add the **Public IPs** of all servers that will participate in the cluster or connect as clients.
    - `127.0.0.1` is added by default.
    - Add the Public IP of **Server 1** (NATS/API)
    - Add the Public IP of **Server 2** (NATS/API)
    - Add the Public IP of **Server 3** (Worker)
    - Add the Public IP of **Server 4** (Worker)
3.  The script will generate `nats.pem` and `nats.key`.

### Distribution:

Copy the following files to `/etc/nats/certs/` (or the mapped volume path) on **all servers**:

- `ca.pem` (The Root CA)
- `nats.pem` (The Certificate)
- `nats.key` (The Private Key)

---

## 🏗️ 2. Cluster Architecture (4-Server Example)

If you have 2 NATS nodes and 2 Worker nodes:

1.  **Nodes 1 & 2**: Run NATS + Dashboard/Ingest APIs.
2.  **Nodes 3 & 4**: Run pure Workers.

All 4 servers should use the **same certificate files** (which list all 4 Public IPs in their SANs) to ensure they are trusted by the NATS nodes.

---

## ⚙️ 3. NATS Configuration (`nats.conf`)

The configuration is hardened for the public network:

### Client Security (`tls`)

Requires all clients (APIs/Workers) to provide a valid certificate signed by your CA.

```hcl
tls {
  cert_file: "/etc/nats/certs/nats.pem"
  key_file:  "/etc/nats/certs/nats.key"
  ca_file:   "/etc/nats/certs/ca.pem"
  verify: true
}
```

### Cluster Security (`cluster`)

Uses both **mTLS** and **Cluster Authentication** (password) to prevent unauthorized nodes from joining.

```hcl
cluster {
  name: "nats-cluster"
  listen: "0.0.0.0:6222"

  authorization {
    user: "cluster_user"
    password: "YOUR_BCRYPT_PASSWORD"
  }

  tls {
    cert_file: "/etc/nats/certs/nats.pem"
    key_file:  "/etc/nats/certs/nats.key"
    ca_file:   "/etc/ssl/certs/coolify-ca.crt"
    verify: true
  }

  routes = [
    "nats://cluster_user:PASSWORD@PUBLIC_IP_NODE_2:6222"
  ]
}
```

---

## 🐳 4. Docker Integration

Ensure your `docker-compose.yml` mounts the project-wide Coolify CA cert:

```yaml
volumes:
  - "/data/nats/certs:/etc/nats/certs:ro"
```

---

## ✅ 5. Verification

Once deployed, check your NATS logs. You should see:

1. `TLS required for client connections`
2. `Cluster Name: nats-cluster`
3. `Route connection established` (when nodes connect to each other)
