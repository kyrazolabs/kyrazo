# Kyrazo Backend

A modular, event-driven webhook infrastructure backend built with Bun, TypeScript, Rust, and various databases.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Frontend (Dashboard)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  APIs (HTTP Services)                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │  Dashboard   │  │    Ingest    │  │ Integration  │                       │
│  │    API       │  │     API      │  │     API      │                       │
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
              ▼                                             ▼
┌─────────────────────────────┐           ┌─────────────────────────────┐
│     Services                │           │     Runtimes                │
│  ┌──────────────┐           │           │  ┌──────────────┐           │
│  │ Loadbalancer │           │           │  │    Worker    │           │
│  │    (Rust)    │           │           │  │              │           │
│  └──────────────┘           │           │  └──────────────┘           │
│  ┌──────────────┐           │           │  ┌──────────────┐           │
│  │  Orchestrator │           │           │  │   Deliver    │           │
│  │  (workers)  │           │           │  │              │           │
│  └──────────────┘           │           │  └──────────────┘           │
│  ┌──────────────┐           │           │                             │
│  │   Ingestor   │           │           │                             │
│  │(→ClickHouse)│           │           │                             │
│  └──────────────┘           │           │                             │
│  ┌──────────────┐           │           │                             │
│  │    Mail      │           │           │                             │
│  │              │           │           │                             │
│  └──────────────┘           │           │                             │
│  ┌──────────────┐           │           │                             │
│  │    Crons     │           │           │                             │
│  │  (billing)   │           │           │                             │
│  └──────────────┘           │           │                             │
└─────────────────────────────┘           └─────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│  Infrastructure                                                               │
│  ┌────────────┐ ┌─────────────┐ ┌────────────┐ ┌───────────────────────────┐  │
│  │   MongoDB  │ │ ClickHouse  │ │    NATS    │ │         Dragonfly         │  │
│  │  (Primary) │ │ (Analytics) │ │  (Message) │ │ (Cache, Messaging, Queue) │  │
│  └────────────┘ └─────────────┘ └────────────┘ └───────────────────────────┘  │                                                              │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
backend/
├── apis/                    # HTTP API Services
│   ├── dashboard/          # Main Dashboard API (management, billing, etc.)
│   ├── ingest/             # Webhook Ingestion API (receives webhooks)
│   └── integration/        # Integration API (sources, targets, endpoints)
├── services/               # Background Services
│   ├── loadbalancer/       # Rust-based load balancer
│   ├── orchestrator/       # Orchestration service
│   ├── ingestor/           # Data ingestion worker (Clickhouse → system)
│   ├── mail/               # Email service (MailQ)
│   └── crons/              # Cron jobs (billing)
├── runtime/                # Worker Runtimes
│   ├── worker/             # General background worker
│   └── deliver/            # Event delivery worker (webhook dispatcher)
├── shared/                 # Shared library (models, configs, utils)
├── infra/                  # Infrastructure configs
│   ├── development/        # Dev environment setup
│   └── production/         # Production setup
└── .github/workflows/      # CI/CD pipelines
```

## APIs

### 1. Dashboard API

**Path:** `apis/dashboard`
**Port:** 3000 (default)
**Description:** Main REST API for the Kyrazo platform management

#### API Versions

The Dashboard API uses versioned endpoints under `/v1` and `/v2`:

| Feature        | v1 Path                              | v2 Path                              | Description                   |
| -------------- | ------------------------------------ | ------------------------------------ | ----------------------------- |
| Authentication | `/auth`                             | -                                    | Login, register, OAuth        |
| Profile        | `/profile`                          | -                                    | User profile management       |
| Workspaces     | `/workspaces`                       | -                                    | Workspace CRUD                |
| Namespaces     | `/namespaces`                       | `/v2/namespaces`                     | Namespace management          |
| API Keys       | `/keys`                             | -                                    | API key CRUD                  |
| Endpoints      | `/endpoints`                        | `/v2/endpoints`                      | Webhook endpoints             |
| Sources        | `/sources`                          | `/v2/sources`                        | Event sources                 |
| Targets        | `/targets`                          | -                                    | Delivery targets              |
| Ingest         | `/ingest`                          | -                                    | Ingestion settings            |
| Analytics     | `/analytics`                        | -                                    | Event analytics               |
| Billing       | `/payments`, `/subscriptions`       | -                                    | Billing & subscriptions       |
| Plans          | `/plans`                            | -                                    | Pricing plans                |
| Workers        | `/workers`                          | -                                    | Worker management             |
| Support       | `/support`                         | -                                    | Support tickets               |
| ASQS           | -                                   | `/v2/asqs`                           | SQS queue management        |
| S3             | -                                   | `/v2/s3`                            | S3 bucket management        |
| Transform     | -                                   | `/v2/transform`                      | Data transformations           |
| Health        | `/health`                          | -                                    | Service health check          |

**v1** - Legacy endpoints (original implementation)
**v2** - Newer endpoints with improved schemas and structure

**Tech Stack:** Hono, MongoDB, ClickHouse, Dragonfly, NATS, Clerk, Stripe, PayPal

**Development:**

```bash
cd apis/dashboard
bun install
bun run dev
```

**Production:**

```bash
bun run build
bun run prod
# or with clustering
bun run dist/cluster.js
```

### 2. Ingest API

**Path:** `apis/ingest`
**Port:** 3001 (default)
**Description:** Receives incoming webhooks from external services

| Feature | Path          | Description                |
| ------- | ------------- | -------------------------- |
| Ingest  | `/v1/ingest`  | Webhook ingestion endpoint |
| Forward | `/v1/forward` | Webhook forwarding         |
| Health  | `/health`     | Service health check       |

**Supported Providers:**

- Stripe
- PayPal
- Shopify
- Slack
- GitHub
- Webflow

**Tech Stack:** Hono, MongoDB, Dragonfly/BullMQ, NATS

**Development:**

```bash
cd apis/ingest
bun install
bun run dev
```

### 3. Integration API

**Path:** `apis/integration`
**Port:** 3002 (default)
**Description:** Integration management for sources, targets, and endpoints

| Feature   | Path            | Description                |
| --------- | --------------- | -------------------------- |
| Sources   | `/v1/sources`   | Event source management    |
| Targets   | `/v1/targets`   | Delivery target management |
| Endpoints | `/v1/endpoints` | Endpoint management        |
| Events    | `/v1/events`    | Event management           |
| Health    | `/health`       | Service health check       |

**Tech Stack:** Hono, MongoDB, ClickHouse, Dragonfly/BullMQ, NATS

**Development:**

```bash
cd apis/integration
bun install
bun run dev
```

## Services (Background)

### 1. Loadbalancer Service

**Path:** `services/loadbalancer`
**Language:** Rust
**Description:** High-performance load balancer for request distribution

**Features:**

- Round-robin load balancing
- Health checking
- Rate limiting middleware
- Retry middleware

**Development:**

```bash
cd services/loadbalancer
cargo run
```

**Production:**

```bash
cargo build --release
./target/release/loadbalancer
```

### 2. Orchestrator Service

**Path:** `services/orchestrator`
**Description:** Manages dedicated workers for each client workspace, handles worker lifecycle, scaling, and coordination

**Features:**

- Dedicated worker provisioning per client
- Worker lifecycle management
- Health monitoring
- MongoDB persistence
- NATS for worker communication

**Development:**

```bash
cd services/orchestrator
bun install
bun run dev
```

### 3. Ingestor Service

**Path:** `services/ingestor`
**Description:** Consumes event data from Dragonfly streams and bulk writes to ClickHouse in batches

**Features:**

- Dragonfly stream consumer for real-time events
- Snapshot consumer for bulk processing
- Batch writing to ClickHouse
- Supports both ingest and dispatch event streams

**Development:**

```bash
cd services/ingestor
bun install
bun run dev
```

### 4. Mail Service

**Path:** `services/mail`
**Description:** Email delivery service (MailQ)

**Development:**

```bash
cd services/mail
bun run dev
```

### 5. Crons Service

**Path:** `services/crons`
**Description:** Scheduled jobs (billing, cleanup, etc.)

## Runtimes

### 1. Worker Runtime

**Path:** `runtime/worker`
**Description:** General-purpose background worker

**Features:**

- BullMQ job processing
- NATS event handling
- MongoDB & ClickHouse integration
- Stripe webhook processing

**Development:**

```bash
cd runtime/worker
bun install
bun run dev
```

### 2. Deliver Runtime

**Path:** `runtime/deliver`
**Description:** Webhook delivery worker

**Features:**

- Event dispatching to targets
- Retry handling
- S3 storage integration
- SQS queue integration
- Sandbox execution for transformations
- HTTP delivery with signature verification

**Development:**

```bash
cd runtime/deliver
bun install
bun run dev
```

## Shared Library

**Path:** `shared`
**Package:** `@kyrazo/shared`

Exports:

- Database configs (MongoDB, ClickHouse, PostgreSQL/Drizzle)
- Logger (Winston)
- Models (MongoDB schemas)
- Types (TypeScript interfaces)
- Zod schemas
- ClickHouse repositories
- Database migrations
- Utility functions (ID generation, snowflake IDs, encryption, etc.)

**Build:**

```bash
cd shared
bun run build
```

## Database Schema

### MongoDB Collections

- `users` - User accounts
- `workspaces` - Workspace entities
- `namespaces` - Namespace entities
- `keys` - API keys
- `endpoints` - Webhook endpoints
- `sources` - Event sources
- `targets` - Delivery targets
- `transforms` - Data transformations
- `subscriptions` - Billing subscriptions
- `plans` - Pricing plans
- `invoices` - Billing invoices
- `2fa` - Two-factor authentication

### ClickHouse Tables (Events & Analytics)

As a webhook-as-a-service platform, ClickHouse stores all event-related data:

- `ingest_events` - All ingested webhook events
- `dispatched_events` - All webhook dispatch/delivery events
- `delivery_attempts` - Individual delivery attempt records (retries, failures)
- `analytics` - Aggregated analytics for billing and reporting

## Environment Variables

Each API/Service uses environment variables for configuration. See `.env.example` files in each directory.

Common variables:

- `PORT` - Service port
- `MONGODB_URI` - MongoDB connection
- `CLICKHOUSE_URL` - ClickHouse URL
- `DRAGONFLY_URL` - Dragonfly URL
- `NATS_URL` - NATS URL
- `JWT_SECRET` - JWT signing secret

## Running Services

### Development Mode

```bash
# Build shared library first
cd shared && bun install && bun run build

# Then run any API/service
cd apis/dashboard && bun run dev
cd apis/ingest && bun run dev
cd apis/integration && bun run dev

# Services
cd services/orchestrator && bun run dev
cd services/loadbalancer && cargo run
```

### Production Mode

```bash
# Build shared
cd shared && bun run build

# Build all
bun run build  # in each directory

# Run with clustering
bun run prod
```

## Testing

```bash
# Run tests
bun test

# Coverage
bun run test:coverage

# HTML coverage report
bun run test:coverage:html
```

## Type Checking

```bash
# TypeScript type checking
bun run typecheck
# or
bunx tsc --noEmit
```

## Linting & Formatting

```bash
# Lint
bun run lint

# Fix lint
bun run lint:fix

# Format
bun run format

# Check format
bun run format:check
```

## Infrastructure

### Development

```bash
# Start NATS
cd infra/development/nats
./start.sh

# Stop NATS
cd infra/development/nats
./stop.sh
```

### Production

See `infra/production/` for production configurations.

## CI/CD

GitHub Actions workflows are in `.github/workflows/`:

- `ci-dashboard.yml` - Dashboard API
- `ci-ingest.yml` - Ingest API
- `ci-integration.yml` - Integration API
- `ci-ingestor.yml` - Ingestor Service
- `ci-loadbalancer.yml` - Loadbalancer Service
- `ci-mail.yml` - Mail Service
- `ci-orchestrator.yml` - Orchestrator Service
- `ci-worker.yml` - Worker Runtime

## Tech Stack Summary

| Component          | Technology       |
| ------------------ | ---------------- |
| Runtime            | Bun              |
| Language           | TypeScript, Rust |
| HTTP Framework     | Hono             |
| Primary Database  | MongoDB          |
| Events/Analytics   | ClickHouse       |
| Queue/Cache        | Dragonfly        |
| Message Broker     | NATS             |
| Auth               | Clerk            |
| Payments           | Stripe, PayPal   |
| Logging            | Winston          |
| Validation         | Zod              |
| Error Tracking     | Sentry           |
| Rate Limiting      | Arcjet           |
