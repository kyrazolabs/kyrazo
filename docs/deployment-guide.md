# Kyrazo Coolify Deployment Guide

This guide details how to deploy Kyrazo's Scheduler and Server Agent nodes securely into Coolify utilizing the automatic server registration strategy.

## 1. Prerequisites

- A properly configured instance of Coolify.
- Access to your Kyrazo Mono-repo on GitHub or your chosen git provider.
- A secure 32+ character string to use as the `CLUSTER_SECRET` and another for `ENCRYPTION_KEY`.

## 2. Deploying the Scheduler

The Scheduler acts as the central brain. It exposes the API endpoints and the WebSocket gateway used by Agents.

### Coolify App Configuration

1. **Source:** Select your Kyrazo Git Repository.
2. **Build Pack:** Dockerfile.
3. **Base Directory:** `/backend`
4. **Dockerfile Location:** `apis/scheduler/Dockerfile`

### Environment Variables

Set the following essential variables in your Coolify Environment Variables tab for the Scheduler:

```env
# Server details
PORT=8000
NODE_ENV=production

# Security & Cluster
ENCRYPTION_KEY=<your_32_char_secret>
CLUSTER_SECRET=<your_secure_cluster_secret>

# Database & Messaging
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/Hookify
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
NATS_SERVERS=nats://...
CLICKHOUSE_HOST=...
```

## 3. Deploying the Agent(s)

Agents connect to the Scheduler securely using the shared `CLUSTER_SECRET` to self-register their IP and obtain a session. You can deploy as many Agent apps in Coolify as needed across your infrastructure.

### Coolify App Configuration

1. **Source:** Select your Kyrazo Git Repository.
2. **Build Pack:** Dockerfile.
3. **Base Directory:** `/backend`
4. **Dockerfile Location:** `runtime/agent/Dockerfile`

### Persistent Volume (Crucial for Auto-Registration)

Because the Agent requests an `API_KEY` on its first boot and saves it, you **must map a persistent volume** so the Agent doesn't create duplicate database records on every restart.

1. Scroll to the **Storage** section of your Coolify App Configuration.
2. Add a Volume:
   - **Source mapped path:** `/data/kyrazo-agent` (or any path on the host)
   - **Destination mapped path:** `/app/runtime/agent/data`

### Environment Variables

Set these variables for _every_ Agent you deploy:

```env
NODE_ENV=production

# Match these exactly to the Scheduler's configuration!
ENCRYPTION_KEY=<your_32_char_secret>
CLUSTER_SECRET=<your_secure_cluster_secret>

# Connection & Identity
SCHEDULER_URL=ws://<SCHEDULER_COOLIFY_DOMAIN>:8000
PUBLIC_IP=<THE_PUBLIC_IP_OF_THIS_SPECIFIC_SERVER>
MAX_WORKERS=5
```

> [!IMPORTANT]  
> If you deploy an Agent on a distinct IP address, ensure `PUBLIC_IP` is manually set in its `.env` config in Coolify. This IP is what users will whitelist for webhooks coming from your platform.
