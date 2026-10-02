# Kyrazo Platform - Architecture Report

## Overview

Kyrazo is a **webhook-as-a-service (WaaS) platform** built with **Bun, TypeScript, and Rust** using the **Hono** HTTP framework. It receives webhooks from external services (Stripe, Shopify, GitHub, Slack, PayPal, Webflow), processes/transforms them, and reliably delivers them to customer-defined endpoints. The architecture follows a layered microservices model with clear separation between API gateways, background services, worker runtimes, and infrastructure.

---

## INFRASTRUCTURE

### ClickHouse

**What it is:**
ClickHouse is a high-performance, open-source, column-oriented Online Analytical Processing (OLAP) database management system. It is purpose-built for real-time analytical queries on massive datasets, using vectorized query execution and columnar storage to process billions of rows at sub-second speeds.

**Purpose in Kyrazo:**
Serves as the **analytics and events data store**. Stores all event-related data: ingested webhook events, dispatched delivery events, individual delivery attempt records, and aggregated analytics used for billing and reporting.

**Key Features:**
- Columnar storage with vectorized query execution
- MergeTree engine family for high-throughput real-time ingestion
- Materialized views for pre-computed aggregations
- Horizontal scaling via sharding and replication
- Time-based partitioning with fast partition drops for retention

**Tables:**
| Table | Purpose |
|---|---|
| `ingest_events` | All ingested webhook events |
| `dispatched_events` | All webhook dispatch/delivery events |
| `delivery_attempts` | Individual delivery attempt records (retries, failures) |
| `analytics` | Aggregated analytics for billing and reporting |

---

### NATS

**What it is:**
NATS (Neural Autonomic Transport System) is a lightweight, high-performance, open-source messaging system designed for distributed applications. It provides publish-subscribe, request-reply, and key-value messaging patterns. Its **JetStream** extension adds persistence for at-least-once delivery and message replay.

**Purpose in Kyrazo:**
Serves as the **primary message broker** and **event bus** for inter-service communication. Decouples producers (APIs) from consumers (workers), enabling asynchronous, fault-tolerant event processing.

**Key Features:**
- Core NATS: ultra-low-latency pub/sub and request-reply messaging
- JetStream: persistence layer with at-least-once delivery and message replay
- Streams: server-side message stores with configurable retention policies
- Consumers: stateful views with durable consumers for crash recovery
- WorkQueue retention: ensures each message consumed exactly once
- mTLS security and cluster support

**Production Config:**
- 2-4 node cluster with mTLS and cluster authentication
- Monitoring on port 8222
- Custom `nats-server.conf` with TLS, cluster routing, and JetStream enabled

---

### MongoDB

**What it is:**
MongoDB is a source-available, document-oriented NoSQL database that stores data in flexible, JSON-like BSON documents. It provides rich query capabilities, horizontal scaling via sharding, and high availability via replica sets.

**Purpose in Kyrazo:**
Serves as the **primary transactional database** for all core business entities: users, workspaces, namespaces, API keys, endpoints, sources, targets, transforms, subscriptions, plans, invoices, and two-factor authentication data.

**Key Features:**
- Flexible BSON documents that evolve without migrations
- Aggregation pipeline for complex transformations
- Horizontal scaling via native sharding
- Replica sets for automatic failover
- ACID multi-document transactions
- Rich indexing (compound, text, geospatial, TTL)
- Change streams for real-time notifications

**Collections:**
| Collection | Purpose |
|---|---|
| `users` | User accounts and profiles |
| `workspaces` | Workspace entities (multi-tenant isolation) |
| `namespaces` | Namespace entities (event routing) |
| `keys` | API keys for authentication |
| `endpoints` | Webhook endpoint configurations |
| `sources` | Event source configurations |
| `targets` | Delivery target configurations |
| `transforms` | Data transformation rules |
| `subscriptions` | Billing subscription records |
| `plans` | Pricing plan definitions |
| `invoices` | Billing invoice records |
| `2fa` | Two-factor authentication data |

---

### Dragonfly

**What it is:**
Dragonfly is a modern, open-source, multi-threaded, Redis-compatible in-memory data store. It is a drop-in replacement for Redis that achieves up to 25x the throughput on the same hardware, scaling vertically to 1TB of memory per instance.

**Purpose in Kyrazo:**
Serves as the **unified cache, queue, and streaming layer** for the platform, handling four distinct roles separated by logical database numbers.

**Key Features:**
- Full Redis API compatibility
- Multi-threaded shared-nothing architecture
- BullMQ compatibility with Lua scripting
- Redis Streams support (XADD, XREADGROUP, XAUTOCLAIM, XACK)
- 30-60% better memory utilization than Redis
- Native Prometheus support

**Logical Databases:**
| DB | Purpose | Key Patterns | Used By |
|---|---|---|---|
| `0` | **Cache** | `cache:*`, `wh:evt:*`, `analytics:rt:*` | Dashboard API, Worker |
| `1` | **BullMQ Queue** | `bull:event-dispatch:*` | Worker, Deliver |
| `2` | **Redis Streams** | `stream:dispatch-events`, `stream:ingest-events` | Worker (producer), Ingestor (consumer) |
| `3` | **Reserved** | -- | -- |

---

## DASHBOARD/WEB

### Dashboard Web UI

**What it is:**
The customer-facing frontend of the Kyrazo platform, built as a modern single-page application (SPA).

**Purpose in Kyrazo:**
Provides a rich, interactive web interface for customers to manage webhook infrastructure, view analytics, configure billing, and interact with all platform features.

**Tech Stack:**
- Framework: Angular 20 with TypeScript
- UI Library: PrimeNG 20 with PrimeUI theming
- Styling: Tailwind CSS 4 with PostCSS
- Charts: Chart.js for analytics visualization
- Code Editor: CodeMirror 6 for transformation scripting
- Network Visualization: JointJS for flow/node-based UI
- Authentication: Clerk integration (Google OAuth)
- Analytics: PostHog
- Error Tracking: Sentry Angular integration

**Features:**
- Manage workspaces, namespaces, API keys
- Configure webhook sources, endpoints, and targets
- View real-time analytics and delivery reports
- Manage billing subscriptions and plans
- Configure data transformations
- Manage S3 buckets and SQS queues
- Handle support tickets

---

### Dashboard API

**What it is:**
The primary backend REST API for the Kyrazo platform, handling all management operations.

**Purpose in Kyrazo:**
Central management API providing versioned endpoints (`/v1` and `/v2`) for authentication, workspace management, resource CRUD, billing, analytics queries, and platform administration.

**Tech Stack:**
- HTTP Framework: Hono (lightweight, edge-ready)
- Runtime: Bun
- Authentication: Clerk (JWT-based auth)
- Payments: Stripe + PayPal
- Rate Limiting: Arcjet + rate-limiter-flexible
- Validation: Zod schemas
- Email: Resend + Nodemailer
- Queue Publishing: BullMQ
- NATS Publishing: Event publishing for integration events
- ClickHouse Queries: `@clickhouse/client` for analytics
- Error Tracking: Sentry

**Endpoints:**
| Feature | Path | Description |
|---|---|---|
| Authentication | `/auth` | Login, register, OAuth, 2FA |
| Profile | `/profile` | User profile management |
| Workspaces | `/workspaces` | Workspace CRUD |
| Namespaces | `/namespaces`, `/v2/namespaces` | Namespace management |
| API Keys | `/keys` | API key CRUD |
| Endpoints | `/endpoints`, `/v2/endpoints` | Webhook endpoint management |
| Sources | `/sources`, `/v2/sources` | Event source management |
| Targets | `/targets` | Delivery target management |
| Analytics | `/analytics` | Event analytics queries |
| Billing | `/payments`, `/subscriptions` | Billing & subscriptions |
| Plans | `/plans` | Pricing plans |
| Workers | `/workers` | Worker management |
| ASQS | `/v2/asqs` | SQS queue management |
| S3 | `/v2/s3` | S3 bucket management |
| Transform | `/v2/transform` | Data transformations |

---

### Ingest API

**What it is:**
The webhook ingestion gateway -- the public-facing HTTP endpoint that receives incoming webhooks from external services.

**Purpose in Kyrazo:**
Receives external webhook payloads, validates them against configured sources, enforces rate limits and usage quotas, and publishes validated events to NATS JetStream for asynchronous processing.

**Tech Stack:**
- HTTP Framework: Hono with Zod validation
- Runtime: Bun
- Supported Providers: Stripe, PayPal, Shopify, GitHub, Slack, Webflow
- Rate Limiting: Workspace-level and ingest-level rate limiters
- Caching: Redis/Dragonfly caching of source lookups (24h TTL)
- Snowflake IDs: Unique event ID generation

**Endpoints:**
| Path | Method | Description |
|---|---|---|
| `/v1/ingest` | POST | Generic ingest endpoint |
| `/v1/ingest/:service/:IEId` | POST | Service-specific ingest (e.g., `/ingest/stripe/ing_xxx`) |
| `/v1/ingest/:IEId` | POST | Generic ingress endpoint by ID |

**Features:**
- Monthly event limit enforcement per workspace plan
- Configurable event type filtering per source
- NATS JetStream publishing with full event metadata
- Multi-format parsing (JSON and form-urlencoded)
- Async usage counter increments for billing

---

### Integration API

**What it is:**
The developer-facing REST API for programmatic management of Kyrazo resources via SDKs (JavaScript, Python, Go) and cURL.

**Purpose in Kyrazo:**
Provides CRUD operations for all integration resources: sources, targets, endpoints, events, namespaces, transforms, ASQS, and S3.

**Tech Stack:**
- HTTP Framework: Hono with Zod validation
- Runtime: Bun
- Versioned API: v1 (legacy) and v2 (improved schemas)
- API Key Authentication: Bearer token authentication via middleware
- Rate Limiting: Per-resource rate limiters
- Idempotency: Idempotency key middleware for safe retries
- AWS SDK: S3 and SQS client integration

**Key Endpoints (v2):**
| Path | Method | Description |
|---|---|---|
| `/v2/sources/:namespaceId` | GET/POST | List/create sources |
| `/v2/endpoints/:namespaceId` | GET/POST | List/create endpoints |
| `/v2/namespace/:namespaceId` | GET/POST | Namespace management |
| `/v2/asqs/:namespaceId` | GET/POST | SQS queue management |
| `/v2/s3/:namespaceId` | GET/POST | S3 bucket management |
| `/v2/transform/:namespaceId` | GET/POST | Transform management |
| `/v1/events/:namespaceId/publish` | POST | Publish single event |
| `/v1/events/:namespaceId/publish/batch` | POST | Batch publish events |

---

## RUNTIME

### Orchestrator

**What it is:**
A background control-plane service that automatically provisions and decommissions dedicated Worker containers for paying customers.

**Purpose in Kyrazo:**
Manages the lifecycle of worker instances based on customer subscription plans, ensuring each client's actual running workers match their entitled count.

**Key Features:**
- **Reconciliation Loop:** Runs every 60 seconds comparing desired vs. actual state
- **Two-Phase Provisioning:** Fast DB transaction (lock + increment) followed by Coolify API call
- **FOR UPDATE Locking:** Prevents race conditions for last server slot
- **Health Sync (reap-and-replace):** Detects and replaces unhealthy workers
- **Stale Worker Reaping:** Deletes workers in stopped/failed state for >1 hour
- **Counter Reconciliation:** Force-syncs counters from actual worker records
- **Orphan Cleanup:** Removes Coolify apps without database records
- **Coolify API Integration:** Uses HTTP API for all container operations

**Data Model (PostgreSQL):**
| Table | Key Columns | Purpose |
|---|---|---|
| `clients` | `client_id`, `plan_max_workers`, `used_workers` | Client plan entitlements |
| `servers` | `server_id`, `cores`, `max_workers`, `active_workers`, `coolify_*_uuid` | Server capacity |
| `workers` | `worker_id`, `client_id`, `server_id`, `status` | Worker lifecycle |

**Worker Lifecycle States:**
```
pending -> starting -> running -> stopping -> stopped
                                         -> failed
```

---

### Deliver

**What it is:**
A specialized webhook delivery worker that consumes processed events and dispatches them to customer-defined endpoint URLs.

**Purpose in Kyrazo:**
The final stage in the event pipeline, responsible for making HTTP requests to deliver webhook payloads to external services.

**Key Features:**
- HTTP delivery with configurable timeouts
- HMAC signature generation and verification
- Retry handling with exponential backoff
- Rate limiting per endpoint
- S3 integration for large payload storage
- SQS integration for alternative delivery patterns
- Sandboxed transformation execution
- NATS JetStream and BullMQ consumers
- ClickHouse delivery attempt logging
- Redis/Dragonfly real-time analytics counters
- Event deduplication via Redis hash tracking
- Graceful shutdown and health checks

**Consumer Processing Flow:**
```
1. Integrity Check (signature + checksum verification)
2. Redis Cache Check (workspace/target validation)
3. MongoDB Validation (fallback if not cached)
4. Message Processing (transformation, HTTP delivery)
5. Ack / Nak / Term (message acknowledgment)
```

---

### Worker

**What it is:**
A general-purpose background processing runtime that handles event validation, transformation, routing, and coordination between the Ingest API and the Deliver runtime.

**Purpose in Kyrazo:**
The core event processing engine -- consumes raw events, applies business logic, and queues them for delivery.

**Processing Flow:**
```
NATS JetStream (receive events)
       |
       v
Worker Consumer
       |
       +----> Integrity Check (signature, checksum)
       +----> Cache/MongoDB Validation
       +----> Business Logic (routing, transformation)
       +----> ClickHouse (event storage)
       +----> Redis Hashes (analytics counters)
       +----> Redis Streams (stream to Ingestor)
       |
       v
BullMQ Queue (event-dispatch)
       |
       v
Deliver Runtime (HTTP delivery to endpoints)
```

**Key Features:**
- NATS JetStream consumer with durable consumers
- BullMQ job processing for `event-dispatch` queue
- Redis Streams producer for Ingestor consumption
- Batch writes to ClickHouse
- Real-time analytics hash updates
- Event deduplication
- MongoDB validation
- Stripe webhook processing
- Bull Board UI for queue monitoring
- Configurable worker concurrency
- Graceful shutdown

---

## SERVICES

### MailQ

**What it is:**
A dedicated email delivery service implemented as a BullMQ-based worker that processes email jobs from a queue.

**Purpose in Kyrazo:**
Handles all transactional email delivery: verification emails, password reset emails, support notifications, billing receipts, and any other platform-triggered email communication.

**Architecture:**
```
Dashboard API / Other Services
       |
       v (publish email job)
BullMQ Queue (Redis/Dragonfly)
       |
       v (consume)
MailQ Workers
  +-- High Priority Worker (security alerts, password resets)
  +-- Medium Priority Worker (standard notifications)
  +-- Low Priority Worker (marketing, batch emails)
  +-- General Send Worker
       |
       v
SMTP Server (Nodemailer)
       |
       v
Recipient Inbox
```

**Key Features:**
- Three priority levels (high/medium/low)
- SMTP transport via Nodemailer
- Health check HTTP endpoint
- Redis queue health monitoring
- Monorepo structure with shared utilities
- Docker deployment with Bun alpine base

**Configuration:**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_SECURE` -- TLS toggle
- `SENDER_MAIL` -- sender address
- `REDIS_URL` -- BullMQ queue connection

---

### Ingestor

**What it is:**
A high-throughput background data ingestion service that consumes event data from Redis Streams and batch-writes aggregated analytics to ClickHouse.

**Purpose in Kyrazo:**
Bridges the real-time event processing pipeline and the analytics data store by consuming events, aggregating metrics, and persisting to ClickHouse.

**Data Flow:**
```
Worker Runtime
       |
       v (produce events)
Redis/Dragonfly Streams
  stream:dispatch-events
  stream:ingest-events
       |
       v (consume + aggregate)
Ingestor Service
       |
       v (batch UPSERT)
ClickHouse
       |
       v (analytical queries)
Dashboard API -> Customer dashboards
```

**Key Features:**
- Redis Stream consumer via XREADGROUP with consumer groups
- Configurable batch sizes (default 1000)
- Blocking reads with configurable block duration
- Message reclaim via XAUTOCLAIM for crashed consumers
- Idempotent writes: `ON CONFLICT DO UPDATE SET total = total + EXCLUDED.total`
- Time-bucketed aggregation (minute-level granularity)
- Multi-dimensional metrics (project_id, target_id, event_type, response_code)
- Rollup strategy: Minute (7 days) -> Hour (30 days) -> Day (365 days)
- Partition-based retention with fast drops
- Horizontally scalable due to idempotent operations

**Configuration:**
- `CLICKHOUSE_URL` -- ClickHouse connection
- `SNAPSHOT_REDIS_URL` -- Redis for snapshot consumption
- `STREAM_REDIS_URL` -- Redis Streams connection
- `SNAPSHOT_INTERVAL_MS` -- Consumer poll interval
- `STREAM_BATCH_COUNT` -- Messages per XREADGROUP call (default: 1000)
- `STREAM_BLOCK_MS` -- Block duration (default: 1000ms)
- `STREAM_MAX_IDLE_MS` -- Reclaim threshold (default: 60000ms)

---

## System Architecture Diagram

```
                    EXTERNAL SERVICES
                    (Stripe, Shopify, GitHub, etc.)
                            |
                            v (webhooks)
              +------+------+------+
              |      |      |      |
              v      v      v      v
         +---------+  +---------+  +---------+
         | Ingest  |  |Dashboard|  |Integra- |
         |  API    |  |  API    |  |  tion   |
         +---------+  +---------+  +---------+
              |             |            |
              |        +----+----+       |
              |        |         |       |
              v        v         v       v
         +------+  +-------+  +------+  +------+
         | NATS |  |MongoDB|  |Dragon-|  |Click-|
         |(msgs)|  |  (DB) |  | fly   |  |House |
         +------+  +-------+  +------+  +------+
              |                  |
              v                  v
         +---------+      +----------+
         | Worker  |<---->| Deliver  |
         |Runtime  |      | Runtime  |
         +---------+      +----------+
              |                  |
              v                  v
         +---------+      +----------+
         |Ingestor |      | Customer |
         | Service |      | Endpoints|
         +---------+      +----------+
              |
              v
         +---------+      +----------+
         |ClickHouse|     |  MailQ   |
         +---------+      +----------+

    +----- ORCHESTRATOR ----+
    |  (manages Worker fleet |
    |   via Coolify API)     |
    +------------------------+
```

## Data Flow Summary

1. External services send webhooks to the **Ingest API**
2. Ingest API validates and publishes to **NATS JetStream**
3. **Worker** consumes, validates, transforms, and routes events
4. Worker publishes delivery jobs to **BullMQ** (via Dragonfly) and event data to **Redis Streams**
5. **Deliver** consumes from BullMQ and makes HTTP calls to customer endpoints
6. **Ingestor** consumes from Redis Streams and batch-writes to **ClickHouse**
7. **Dashboard API** queries ClickHouse for analytics and serves the **Dashboard Web UI**
8. **Orchestrator** manages the Worker/Deliver container fleet via Coolify
9. **MailQ** processes email jobs from BullMQ queues asynchronously
