# Analytics Service Integration Guide

This guide explains how the `analytics` service works, how to configure it, and how to verify it is collecting data from the worker.

## Overview

The Analytics Service is designed to be a high-throughput aggregator that consumes real-time metrics from Redis, aggregates them by day, and persists them to PostgreSQL.

**Data Flow:**

1.  **Worker (Producer)**: Increments real-time counters in Redis hashes (`analytics:rt:*`) with minute-level granularity.
2.  **Analytics Service (Consumer)**:
    - Runs on a loop (default: every 5 seconds).
    - Scans Redis for `analytics:rt:*` keys.
    - Atomically retrieves and deletes these keys (to prevent double-counting).
    - Aggregates the metrics in-memory by day and dimensions.
    - Performs bulk upserts (ON CONFLICT DO UPDATE) to PostgreSQL daily tables.

## Configuration

Required Environment Variables in `.env`:

```bash
# Connection string for the Analytics Database (PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/analytics"

# Connection string for Redis
REDIS_URL="redis://localhost:6379"

# (Optional) Snapshot Interval in milliseconds (Default: 5000)
SNAPSHOT_INTERVAL_MS=5000
```

## Running the Service

### Development

```bash
bun run dev
```

### Production

```bash
bun run build
bun start
```

## Database Migrations

The service uses Drizzle ORM.

```bash
# Generate migrations
bun run migrations:generate

# Apply migrations to DB
bun run migrations:push
```

## Worker Integration

The worker integrates automatically if it is configured to write to the same Redis instance.

**Key Format:**

- **Dispatch**: `analytics:rt:{projectId}:dispatch:{minuteIso}:{targetId}:{eventType}:{responseCode}`
- **Ingest**: `analytics:rt:{projectId}:ingest:{minuteIso}:{sourceId}:{status}`

**Important Note on Timestamps:**
The `minuteIso` timestamp in Redis keys uses dashes instead of colons (e.g., `2023-10-27T10-00-00.000Z`) to ensure safe key parsing. The Analytics service automatically normalizes this back to a valid date for storage.

## Verification

To verify the pipeline is working:

1.  Ensure Worker and Analytics service are running.
2.  Trigger webhooks or ingest events.
3.  Check Redis keys: `bunx ioredis-cli keys "analytics:rt:*"` (You should see them appear and then disappear as the consumer processes them).
4.  Check Database: Query `analytics_dispatch_day` or `analytics_ingest_day` to see increments.

```sql
SELECT * FROM analytics_dispatch_day ORDER BY bucket_day DESC;
```
