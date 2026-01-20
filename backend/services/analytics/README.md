# Analytics Service

A high-throughput, scalable analytics aggregation service for Kyrazo.
This service is responsible for **collecting, aggregating, and persisting analytics data** from Redis into PostgreSQL using time-bucketed rollups.

> ⚠️ This service does NOT expose HTTP APIs.
> It is a background worker designed for horizontal scaling.

---

## 🎯 Responsibilities

- Consume real-time analytics snapshots from Redis
- Aggregate metrics by time buckets (minute)
- Persist aggregated data into PostgreSQL using UPSERTs
- Prepare data for rollups (hourly / daily)
- Enforce retention policies

---

## 🧠 Core Design Principles

- **No raw events storage**
- **Write-optimized**
- **Idempotent operations**
- **Horizontal scalability**
- **Separation of concerns**
- **Analytics isolated from product databases**

---

## 🏗 Architecture Overview

```

┌────────────┐
│   Workers  │
│ (events)   │
└─────┬──────┘
│ INCR / HINCRBY
v
┌────────────┐
│   Redis    │
│ Snapshots  │
└─────┬──────┘
│ every N seconds
v
┌────────────────────┐
│ Analytics Writer   │
│  - Consumers       │
│  - Aggregators     │
│  - Rollups         │
└─────┬──────────────┘
│ UPSERT (batch)
v
┌────────────┐
│ PostgreSQL │
│ Analytics  │
└────────────┘

```

---

## 📦 Folder Structure

```

analytics-writer/
├── src/
│   ├── index.ts              # Bootstrap
│   ├── config.ts             # Singleton config
│   ├── consumers/            # Data consumers
│   │   └── redis-snapshot.consumer.ts
│   ├── aggregators/          # Domain aggregators
│   │   ├── dispatch.aggregator.ts
│   │   └── ingest.aggregator.ts
│   ├── rollups/              # Time rollups
│   │   ├── minute-to-hour.ts
│   │   └── hour-to-day.ts
│   ├── retention/            # Data cleanup
│   │   └── cleanup.ts
│   └── db/
│       ├── client.ts         # Drizzle + PG pool
│       └── schema.ts         # Analytics tables

```

---

## 🔄 Data Workflow

### 1. Event Processing (Outside This Service)

- Events are processed by platform workers
- Metrics are incremented in Redis (counters, histograms)
- Redis holds **temporary snapshots only**

---

### 2. Snapshot Consumption

The `RedisSnapshotConsumer`:

- Runs every `N` seconds
- Scans Redis for snapshot keys
- Reads and deletes snapshots atomically
- Routes data to the correct aggregator

**Why snapshots?**

- Prevent per-event database writes
- Batch writes for performance
- Reduce PostgreSQL load

---

### 3. Aggregation Algorithm

For each snapshot:

1. Normalize time → truncate to minute
2. Identify dimensions:
    - project_id
    - target_id (optional)
    - event_type (optional)
    - response_code (optional)
3. Generate a **composite key**
4. UPSERT aggregated counters

#### Conflict Resolution (Idempotent)

```sql
ON CONFLICT (...)
DO UPDATE SET
  total = total + EXCLUDED.total
```

This guarantees:

- Safe retries
- Horizontal scaling
- No double counting

---

### 4. Rollup Strategy

| Resolution | Source | Target | Retention |
| ---------- | ------ | ------ | --------- |
| Minute     | Redis  | PG     | 7 days    |
| Hour       | Minute | PG     | 30 days   |
| Day        | Hour   | PG     | 365 days  |

Rollups run as scheduled jobs and:

- Aggregate lower-resolution data
- Write higher-resolution summaries
- Delete old partitions

---

### 5. Retention & Cleanup

- Data is partitioned by time
- Old partitions are dropped
- No row-level deletes (fast & safe)

---

## ⚙️ Configuration

Environment variables:

```
REDIS_URL=
PG_ANALYTICS_URL=
```

---

## 🚀 Running the Service

```bash
bun install
bun run src/index.ts
```

You can scale horizontally by running multiple instances.
All operations are idempotent.

---

## ❌ What This Service Does NOT Do

- No HTTP APIs
- No authentication
- No dashboard logic
- No joins with product data
- No raw event storage

---

## 🧩 Extending the System

To add a new analytics domain:

1. Create a new aggregator
2. Define schema (minute/hour/day)
3. Register it in the consumer
4. Add rollup logic

No existing code needs refactoring.

---

## ✅ Production Guarantees

- High write throughput
- Predictable performance
- Safe retries
- Minimal PostgreSQL load
- Analytics isolation

---

## 📄 License

MIT
