# Dragonfly Configuration Reference

This document describes the Dragonfly configuration for all Kyrazo services. Dragonfly is a Redis-compatible in-memory store used for caching, BullMQ job queuing, Redis Streams, and Hash-based event tracking.

---

## Overview of Redis Usage

| Service       | Purpose                            | DB  | Key Patterns                                     |
| ------------- | ---------------------------------- | --- | ------------------------------------------------ |
| Dashboard API | Cache (auth, plans, subscriptions) | `0` | `cache:*`                                        |
| Worker        | BullMQ job queue (event dispatch)  | `1` | `bull:event-dispatch:*`                          |
| Worker        | Real-time analytics (hashes)       | `0` | `analytics:rt:*`                                 |
| Worker        | Stream producer                    | `0` | `stream:dispatch-events`, `stream:ingest-events` |
| Ingestor      | Stream consumer                    | `0` | `stream:dispatch-events`, `stream:ingest-events` |
| Worker        | Event deduplication (hashes)       | `0` | `wh:evt:*`                                       |

---

## Startup Flags (Docker Compose)

```yaml
services:
  dragonfly:
    image: "docker.dragonflydb.io/dragonflydb/dragonfly:v1"
    ulimits:
      memlock: -1
    command:
      - "--port=6379"
      - "--maxmemory=2G"
      - "--cache_mode=false"
      - "--dbnum=4"
      - "--hz=100"
      - "--save_schedule=" # Disable persistence for pure cache / ephemeral queue
      # BullMQ Lua script compatibility
      - "--default_lua_flags=allow-undeclared-keys"
      - "--lua_allow_undeclared_auto_correct=true"
      # Performance
      - "--proactor_threads=2"
      - "--tcp_nodelay=true"
      - "--pipeline_squash=1"
    ports:
      - "6379:6379"
    restart: unless-stopped
```

---

## Configuration Details

### 1. BullMQ (Queue) — DB 1

BullMQ manages the `event-dispatch` queue used by the Worker service. It relies heavily on multi-key Lua scripts that Dragonfly does not support out of the box.

**Required flags:**

```
--default_lua_flags=allow-undeclared-keys
--lua_allow_undeclared_auto_correct=true
```

**Key prefix structure (set via `Worker.connection`):**

```
bull:event-dispatch:id         → Job ID counter (string)
bull:event-dispatch:meta       → Queue metadata (hash)
bull:event-dispatch:marker     → Sorted set of waiting jobs
bull:event-dispatch:prioritized → Priority sorted set
bull:event-dispatch:active     → List of in-progress jobs
bull:event-dispatch:delayed    → Sorted set
bull:event-dispatch:completed  → Sorted set of finished jobs
bull:event-dispatch:events     → Stream of lifecycle events
bull:event-dispatch:pc         → Priority counter
bull:event-dispatch:<jobId>    → Job hash (name, data, opts, timestamps)
```

**ioredis connection config (Worker / Dashboard API):**

```ts
new Redis({
  url: QUEUE_REDIS_URL, // e.g. redis://dragonfly:6379/1
  maxRetriesPerRequest: null, // Required for BullMQ
});
```

**BullMQ Worker init:**

```ts
new Worker("event-dispatch", processor, {
  connection,
  concurrency: env.CONCURRENCY, // typically 10–50
});
```

---

### 2. Redis Streams — DB 0

Redis Streams are used as an internal pipeline between the Worker service (producers) and the Ingestor service (consumer).

**Stream names:**

```
stream:dispatch-events   → delivery attempt records (SQLDeliveryAttempt)
stream:ingest-events     → raw ingest events (SQLIngestEvent)
```

**Producer (Worker):**

```ts
// Adds a message to the stream
redis.xadd("stream:dispatch-events", "*", "payload", JSON.stringify(data));
```

**Consumer group (Ingestor):**

```
Group name:    group:clickhouse-ingestor
Consumer name: consumer:<random-id>
```

**Consumer reads:**

```ts
// Block for new messages
redis.xreadgroup(
  "GROUP",
  group,
  consumer,
  "COUNT",
  1000,
  "BLOCK",
  1000,
  "STREAMS",
  streamName,
  ">",
);

// Reclaim stale messages from crashed consumers
redis.xautoclaim(streamName, group, consumer, idleMs, "0-0", "COUNT", 1000);

// Acknowledge processed messages
redis.xack(streamName, group, ...ids);
```

**Configurable env vars (Ingestor):**
| Variable | Default | Description |
|---|---|---|
| `STREAM_BATCH_COUNT` | `1000` | Messages per XREADGROUP call |
| `STREAM_BLOCK_MS` | `1000` | Block duration for new messages |
| `STREAM_MAX_IDLE_MS` | `60000` | Idle time before reclaiming a message |
| `STREAM_MAX_RETRIES` | `3` | Max delivery attempts before dead-lettering |

> **Note:** Dragonfly supports all Stream commands (`XADD`, `XREADGROUP`, `XAUTOCLAIM`, `XACK`, `XPENDING`) natively. No special flags required.

---

### 3. Cache — DB 0

The Dashboard API and Worker use a standard `GET`/`SETEX` pattern for caching responses (subscriptions, plans, auth tokens).

**Key patterns:**

```
cache:<namespace>:<id>    → JSON-stringified response (TTL: 3600s default)
cache:plan:<workspaceId>  → Subscription/plan data
cache:auth:<token>        → Session data
```

**Cache method (dashboard API Redis client):**

```ts
// Write (cache miss)
await client.setex(key, ttl ?? 3600, JSON.stringify(data));

// Read (cache hit)
const raw = await client.get(key);
if (raw) return JSON.parse(raw);
```

**Dragonfly tuning for cache workloads:**

```
--cache_mode=false          # Keep as false; use explicit TTLs instead
--maxmemory=2G              # Adjust based on server capacity
--enable_heartbeat_eviction=true
--eviction_memory_budget_threshold=0.1  # Evict when <10% free memory
--mem_defrag_threshold=0.7
--mem_defrag_waste_threshold=0.2
```

---

### 4. HASHES — DB 0

Hashes are used in two primary places:

#### 4a. Real-Time Analytics (Worker → Redis)

Written during event dispatch to accumulate per-minute delivery metrics. Expires after 2 minutes (short-lived hot data).

**Key pattern:**

```
analytics:rt:<namespaceId>:dispatch:<minute>:<targetId>:<eventType>:<responseCode>
```

**Hash fields:**

```
total         → total delivery count
DELIVERED     → successful count
FAILED        → failed count
PROCESSING    → in-progress count
latency_sum   → sum of all response times (ms)
latency_count → number of latency samples
max_latency   → maximum observed latency (via Lua eval)
```

**Write pattern:**

```ts
pipeline.hincrby(key, "total", 1);
pipeline.hincrby(key, status, 1);
pipeline.hincrby(key, "latency_sum", latencyMs);
pipeline.expire(key, 120);
await pipeline.exec();
```

**Max latency uses a Lua eval** — this is where `allow-undeclared-keys` is also required.

#### 4b. Event Deduplication & Delivery Tracking (Worker → Redis)

These short-lived keys track per-event delivery state.

**Key patterns (from `REDIS_KEYS`):**

```
wh:evt:<eventId>:et:<eventType>:tg:<targetId>   → target delivery hash
wh:evt:<eventId>:deliv_count                     → delivery count (string/int)
wh:evt:<eventId>:total                           → total target count
wh:dirty                                         → dirty tracking sorted set
analytics:dedup:<deliveryId>:<status>            → idempotency key (TTL: 3600s)
```

---

## Recommended Database Layout

```
DB 0 (default) → General: cache, streams, hashes, dedup keys
DB 1           → BullMQ: all bull:event-dispatch:* keys
DB 2           → (reserved)
DB 3           → (reserved)
```

Set `--dbnum=4` to match.

Set `REDIS_URL` (cache, streams, hashes) to use `redis://host:6379/0`
Set `QUEUE_REDIS_URL` (BullMQ) to use `redis://host:6379/1`

---

## Persistence

For this use case (queues + short-lived analytics), **disable persistence** to maximize throughput:

```
--save_schedule=    # Empty string disables snapshots
--df_snapshot_format=false
```

> If you want crash recovery for the BullMQ queue, enable snapshots with a schedule:
> `--snapshot_cron="0 * * * *"` (hourly)

---

## Summary Flags Reference

```
--port=6379
--maxmemory=2G
--dbnum=4
--hz=100
--proactor_threads=2
--cache_mode=false
--enable_heartbeat_eviction=true
--eviction_memory_budget_threshold=0.1
--mem_defrag_threshold=0.7
--mem_defrag_waste_threshold=0.2

# BullMQ Lua script compatibility
--default_lua_flags=allow-undeclared-keys
--lua_allow_undeclared_auto_correct=true

# Performance
--tcp_nodelay=true
--pipeline_squash=1
--multi_exec_squash=true

# Persistence (disabled for ephemeral workload)
--save_schedule=
```
