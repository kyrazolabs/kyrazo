# Kyrazo Scheduler & Agent Setup Guide

This guide describes how to set up and run the new refactored Scheduler <--> Agent architecture using RPC and Docker.

## Prerequisites

- **Bun** (v1.0+)
- **Docker** (Running and accessible by current user)
- **Node.js** (Optional, but recommended for some tools)

## Architecture Overview

- **Scheduler**: Manages workers, client logic, and connects to Agents via WebSocket.
- **Agent**: Runs on a worker server, connects to Scheduler via WebSocket, and manages Docker containers for workers.
- **Shared**: Common types and logic (RPC schemas).

## Step-by-Step Setup

### 1. Build Shared Library

The shared library contains the RPC definitions. It must be built before starting other services.

```bash
cd backend/shared
bun install
bun run build
```

### 2. Setup Scheduler

The Scheduler listens for API requests and Agent connections.

1. Navigate to directory:
   ```bash
   cd backend/apis/scheduler
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Start the Scheduler:
   ```bash
   bun run dev
   ```
   _Runs on port defined in `.env` (default 3300)._

### 3. Setup Agent

The Agent connects to the Scheduler and manages Docker containers.

1. Navigate to directory:
   ```bash
   cd backend/runtime/agent
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Configure Environment:
   Create `.env` (or use existing):

   ```env
   SCHEDULER_URL=ws://localhost:3300/servers/gateway
   AGENT_KEY=my-secure-agent-key
   ```

   _(Note: Ensure `AGENT_KEY` matches what the Scheduler expects/validates if implemented)._

4. Start the Agent:
   ```bash
   bun run dev
   ```
   _The Agent will connect to the Scheduler and log "✅ Connected to Scheduler"._

### 4. Running Workers (Usage)

To start a worker, send a request to the Scheduler API (or use the frontend if integrated).

**API Endpoint:** `POST /schedule/worker/start`

```json
{
  "clientId": "client-123"
}
```

**Flow:**

1. Scheduler validates request.
2. Scheduler selects an available Agent.
3. Scheduler sends `START_WORKER` RPC to Agent.
4. Agent pulls/runs Docker container `hookify/worker:latest` with limits (1 CPU, 2GB RAM).
5. Agent sends `ACK` and `WORKER_UPDATE` back to Scheduler.

## Troubleshooting

- **"Docker daemon is not running"**: Ensure Docker is started (`sudo systemctl start docker` or open Docker Desktop).
- **"WebSocket Error"**: Check if Scheduler is running and `SCHEDULER_URL` is correct.
- **"Invalid Key"**: Verify `AGENT_KEY`.

## Security

- **Agents** are authenticated via `AGENT_KEY`.
- **Containers** are isolated using Docker with strict resource limits.
- **Communication** is over WebSocket (use WSS in production).
