# Kyrazo Backend Setup & Deployment Guide

This guide details the process for deploying the Kyrazo Scheduler and Server Agent(s) in a Coolify environment, utilizing our **Zero-Config RPC Registration** architecture.

## 1. Prerequisites

- A running instance of Coolify.
- Access to the Kyrazo repository.
- A secure 32+ character string for `ENCRYPTION_KEY` and another for `CLUSTER_SECRET`.

## 2. Deploying the Scheduler (Master Node)

The Scheduler manages the cluster, exposes the API, and handles WebSocket connections from the Agents.

### Coolify App Configuration

1. **Source:** Select the Kyrazo Git Repository.
2. **Build Pack:** Dockerfile.
3. **Base Directory:** `/backend`
4. **Dockerfile Location:** `apis/scheduler/Dockerfile`

### Environment Variables

Set these essential variables in the Coolify Environment tab:

```env
# Server details
PORT=8000
NODE_ENV=production

# Security & Cluster Auth
ENCRYPTION_KEY=<your_32_char_secret>
CLUSTER_SECRET=<your_secure_cluster_secret>

# Database Connections
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
NATS_SERVERS=nats://...
CLICKHOUSE_HOST=...
```

## 3. Deploying the Agent (Worker Nodes)

Agents connect to the Scheduler securely over WebSocket using the shared `CLUSTER_SECRET`. Upon startup, they automatically calculate their hardware capacity (CPU cores, Memory) and upsert themselves into the database—meaning **zero manual API keys or database entries are required**.

You can deploy as many Agent apps in Coolify as you need across different servers.

### Coolify App Configuration

1. **Source:** Select the Kyrazo Git Repository.
2. **Build Pack:** Dockerfile.
3. **Base Directory:** `/backend`
4. **Dockerfile Location:** `runtime/agent/Dockerfile`

### Persistent Volume (Required)

Because the Agent generates a unique `nodeId` to identify itself across restarts, you **must map a persistent volume** so it doesn't appear as a brand new server in the database every time the container restarts.

1. Scroll to the **Storage** section of your Coolify App Configuration.
2. Add a Volume:
   - **Source mapped path:** `/data/kyrazo-agent` (or another host path)
   - **Destination mapped path:** `/app/runtime/agent/data`

### Environment Variables

Set these variables for _every_ Agent you deploy:

```env
NODE_ENV=production

# Security (Must match the Scheduler!)
CLUSTER_SECRET=<your_secure_cluster_secret>

# Connection & Identity
SCHEDULER_URL=ws://<SCHEDULER_COOLIFY_DOMAIN>:8000
PUBLIC_IP=<THE_PUBLIC_IP_OF_THIS_SPECIFIC_SERVER>
MAX_WORKERS=5
```

> **Note on Worker Environment Variables:** The `.env.prod` file located within `backend/runtime/agent/` is injected directly into the ephemeral Docker worker containers that the Agent spawns. Do not place sensitive Agent-level secrets (like `CLUSTER_SECRET`) in that file.

## 4. Verification

1. Deploy the Scheduler and wait for it to become healthy.
2. Deploy the Agent.
3. Check the Scheduler's logs or the PostgreSQL `servers` table. You should instantly see a new server registered and marked as `active`, accurately reflecting the CPU cores and memory of the Agent's host machine.
