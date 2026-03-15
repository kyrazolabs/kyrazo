# Orchestrator — Architecture & Flow Guide

> A single document explaining the full worker lifecycle, from subscription to Coolify deployment, for humans and AI agents.

---

## 1. What the Orchestrator Does

The **Orchestrator** (a.k.a. Scheduler) is a background service that automatically provisions and decommissions **Workers** on behalf of paying **Clients**. Each client's subscription entitles them to N workers. The orchestrator ensures the actual running workers in [Coolify](https://coolify.io) match the desired count.

```
Subscription (Mongo) → Orchestrator (Postgres + Cron) → Coolify API → Docker Containers
```

---

## 2. Data Model (Postgres via Drizzle)

### `clients` table — `src/db/client.ts`

| Column             | Type    | Purpose                                    |
|--------------------|---------|--------------------------------------------|
| `client_id`        | text PK | Workspace ID from MongoDB (external ID)    |
| `plan_max_workers` | int     | Max workers allowed by current plan        |
| `used_workers`     | int     | Current count of non-terminal workers      |

### `servers` table — `src/db/server.ts`

| Column                      | Type    | Purpose                                      |
|-----------------------------|---------|----------------------------------------------|
| `server_id`                 | uuid PK | Auto-generated                               |
| `cores`                     | int     | CPU core count                               |
| `max_workers`               | int     | Maximum workers this server can run           |
| `active_workers`            | int     | Current count of non-terminal workers on it   |
| `status`                    | enum    | `active` / `draining` / `down`               |
| `coolify_server_uuid`       | text    | Coolify API target identifiers               |
| `coolify_project_uuid`      | text    | ↳                                            |
| `coolify_environment_uuid`  | text    | ↳                                            |

### `workers` table — `src/db/worker.ts`

| Column      | Type     | Purpose                                    |
|-------------|----------|--------------------------------------------|
| `worker_id` | uuid PK  | Auto-generated, used in Coolify app name   |
| `client_id` | text FK  | → `clients.client_id`                     |
| `server_id` | uuid FK  | → `servers.server_id`                     |
| `status`    | enum     | `pending → starting → running → stopping → stopped` or `→ failed`  |

### Relations — `src/db/relation.ts`
- One **server** has many **workers**
- One **client** has many **workers**
- One **worker** belongs to one server and one client

---

## 3. Entry Point — `src/index.ts`

Starts a Hono HTTP server with a `/v1/health` endpoint and a **60-second interval** that calls `subscriptionsJob()`.

```
setInterval(subscriptionsJob, 60_000)
```

---

## 4. The Reconciliation Loop

Every 60 seconds, the following chain executes:

```
src/jobs/subscriptions.job.ts
  └─ AutoScalerService.reconcile()          ← src/modules/autoscaler/autoscaler.service.ts
       ├─ [0] Fetch all Coolify apps once
       ├─ [1] WorkerService.reapStaleWorkers()   ← Garbage-collect stopped/failed > 1h
       ├─ [2] WorkerService.reconcileServerCounts()
       ├─ [3] Query active clients from Postgres
       ├─ [4] Query active subscriptions from MongoDB
       ├─ [5] Merge both sets
       ├─ [6] cleanupOrphans()               ← Delete Coolify apps with no DB record
       ├─ [7] For each client:
       │     ├─ reconcileSubscription()
       │     │     ├─ Resolve maxWorkers from plan
       │     │     ├─ syncState()             ← Health-check each worker vs Coolify
       │     │     ├─ Count actual active workers
       │     │     ├─ Scale UP if actual < desired
       │     │     └─ Scale DOWN if actual > desired
       └─ [8] WorkerService.reconcileClientCounts()
```

---

## 5. Key Operations Explained

### 5a. Provisioning a Worker (Scale UP)

**File:** `src/modules/workers/worker.service.ts` → `provisionWorker()`

Two-phase approach to avoid holding DB locks during slow HTTP calls:

```
Phase 1 — DB Transaction (fast, atomic)
  ├─ SELECT client FOR UPDATE        → Lock client row
  ├─ Check: used_workers < plan_max_workers
  ├─ SELECT server FOR UPDATE        → Lock least-loaded server with capacity
  ├─ UPDATE clients SET used_workers = used_workers + 1
  ├─ UPDATE servers SET active_workers = active_workers + 1
  └─ INSERT worker (status = 'pending')
  → COMMIT

Phase 2 — Coolify API (outside transaction)
  ├─ Create GitHub App on Coolify
  ├─ Inject environment variables
  └─ Start the application container
  → If Coolify fails: mark worker as 'failed' (releases counters)
```

**Why FOR UPDATE?** Without it, two concurrent transactions could both read `active_workers = 7` on an 8-capacity server and both write `8`, ending up with 9 workers.

**Why two phases?** Coolify API calls can take 10+ seconds. Holding a DB transaction that long blocks all other provisioning.

### 5b. Decommissioning a Worker (Scale DOWN)

**File:** `src/modules/workers/worker.service.ts` → `decommissionWorker()`

```
Transaction:
  ├─ Read worker record
  ├─ SET status = 'stopping'
  └─ Call Coolify DELETE /applications/{uuid}
```

The next reconcile loop's `syncState()` will see the worker is gone from Coolify and transition it to `stopped`, which releases counters.

### 5c. Health Sync (Reap-and-Replace)

**File:** `src/modules/autoscaler/autoscaler.service.ts` → `syncState()`

For each worker in an active state, compares DB status to Coolify actual status:

| DB Status          | Coolify Status          | Action                             |
|--------------------|-------------------------|------------------------------------|
| pending / starting | running                 | → Update DB to `running`           |
| any active         | exited / unhealthy / error | → Mark `failed` + delete Coolify app |
| pending / starting / running | *missing* (after 2 min) | → Mark `failed` (zombie)      |
| stopping           | *missing*               | → Mark `stopped`                   |

**Reap-and-replace** means: when a worker is unhealthy, we immediately mark it `failed` (freeing the counter slot) AND delete its Coolify app. The **next** reconcile loop sees `actual < desired` and provisions a fresh replacement.

### 5d. Stale Worker Reaping

**File:** `src/modules/workers/worker.service.ts` → `reapStaleWorkers()`

Workers in `stopped` or `failed` status for **> 1 hour** are:
1. Deleted from Coolify (if app still exists)
2. Deleted from the Postgres `workers` table

This prevents unbounded row growth.

### 5e. Counter Reconciliation

**File:** `src/modules/workers/worker.repo.ts`

After every reconcile loop, the counters are force-synced from actual worker records:

```sql
-- reconcileServerCounts
UPDATE servers SET active_workers = (SELECT COUNT(*) FROM workers WHERE ... status IN ('pending','starting','running','stopping'))

-- reconcileClientCounts  
UPDATE clients SET used_workers = (SELECT COUNT(*) FROM workers WHERE ... status IN ('pending','starting','running','stopping'))
```

This corrects any drift from edge cases (crashes, double-releases, etc.).

---

## 6. Coolify Integration

**Files:** `src/modules/coolify/actions/*.ts`

The orchestrator never SSHs into servers. It uses the Coolify HTTP API:

| Action               | Coolify Endpoint                       | Used For                       |
|----------------------|----------------------------------------|--------------------------------|
| `createGitHubApp`    | POST /applications (build_pack: dockercompose) | Create a new worker container  |
| `bulkInjectEnvs`     | POST /applications/{uuid}/envs         | Inject NATS, DB, Redis configs |
| `startApplication`   | POST /applications/{uuid}/start        | Boot the container             |
| `getApplications`    | GET /applications                      | List all apps for health sync  |
| `deleteApplication`  | DELETE /applications/{uuid}            | Tear down a worker             |

Worker apps are named `Worker - {worker_id}` for easy lookup.

---

## 7. Command Dispatcher

**File:** `src/modules/commands/command.dispatcher.ts`

Translates high-level intents into Coolify API calls:

- `dispatchStartWorker(serverId, workerId, clientId)` → Create + configure + start
- `dispatchStopWorker(serverId, workerId, clientId)` → Find app by name + delete

---

## 8. Safeguards Summary

| Safeguard                         | Where                     | Prevents                                |
|-----------------------------------|---------------------------|-----------------------------------------|
| `SELECT ... FOR UPDATE` on server | `worker.repo.ts`          | Two TXs claiming last server slot        |
| `SELECT ... FOR UPDATE` on client | `worker.repo.ts`          | Exceeding plan_max_workers               |
| Atomic SQL increments             | `worker.repo.ts`          | Stale counter writes (TOCTOU)            |
| `GREATEST(0, ...)`  floor guards  | `worker.repo.ts`          | Counter underflow from double-release    |
| Two-phase provisioning            | `worker.service.ts`       | Long Coolify calls blocking DB           |
| Coolify failure → mark failed     | `worker.service.ts`       | Ghost reservations with no actual worker |
| Stale reaping (1h TTL)            | `worker.service.ts`       | Unbounded DB row growth                  |
| Counter reconciliation            | `worker.repo.ts`          | Long-term drift from any edge case       |
| Reap-and-replace                  | `autoscaler.service.ts`   | Unhealthy workers blocking fresh ones    |
| Orphan cleanup                    | `autoscaler.service.ts`   | Coolify apps with no DB record (leaks)   |
