
# NATS JetStream Worker Service

A standalone worker service that consumes webhook events from NATS JetStream and delivers them to target URLs with full **message integrity and validation**.

---

## Architecture

```

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   API       │───▶│   NATS      │───▶│   Worker    │
│   Server    │    │ JetStream   │    │   Service   │
└─────────────┘    └─────────────┘    └─────────────┘
│
┌─────────────┐                               │
│  Webhook    │◀──────────────────────────────┘
│  Targets    │
└─────────────┘

```

### Consumer Detailed Flow

```

+-------------------------+
|  Worker Consumer        |
|                         |
|  1️⃣ Integrity Check    |
|     - Verify Signature |
|     - Verify Checksum  |
|                         |
|  2️⃣ Redis Cache Check  |
|     - workspaceId,     |
|       webhookId exist? |
|                         |
|  3️⃣ MongoDB Validation |
|     - Query DB if ID   |
|       not in cache     |
|                         |
|  4️⃣ Message Processing |
|     - Business logic    |
|                         |
|  5️⃣ Ack / Nak / Term   |
+-------------------------+

````

---

## Setup

### 1. Install Dependencies

```bash
bun install
````

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your NATS configuration:

```bash
NATS_SERVERS=nats://localhost:4222,nats://localhost:4223,nats://localhost:4224
NATS_USER=worker
NATS_PASSWORD=workerPass
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/mydb
LOG_LEVEL=info
```

### 3. Start NATS Servers

```bash
cd ../infra/nats
./start-cluster.sh
```

---

## Running

### Development Mode (with hot reload)

```bash
bun run dev
```

### Production Mode

```bash
bun run start
```

### Background Mode

```bash
# Using Bun (recommended)
bun run src/index.ts

# Or using nohup
nohup bun run src/index.ts > worker.log 2>&1 &
```

---

## Features

### ✅ Reliable Event Processing

* **JetStream Persistence**: Messages survive restarts
* **ACK Support**: Explicit acknowledgment for guaranteed delivery
* **Retry Logic**: Automatic retry on failures
* **Dead Letter**: Failed messages can be handled separately
* **Message Integrity**: Signature & checksum verification

### ✅ Validation & Security

* **Redis Cache Check**: Reduce DB load
* **MongoDB Validation**: Ensure workspaceId, webhookId, payload are valid
* **Schema Validation**: Validate message format before processing

### ✅ High Performance

* **Concurrent Processing**: Multiple workers can run simultaneously
* **Connection Pooling**: Efficient NATS connection management
* **Memory Efficient**: Streaming processing without loading all messages
* **Horizontal Scaling**: Add more worker instances as needed

### ✅ Professional Features

* **Health Monitoring**: Built-in health checks
* **Graceful Shutdown**: Proper cleanup on exit
* **Error Handling**: Comprehensive error management
* **Logging**: Structured logging with configurable levels
* **TypeScript**: Full type safety

---

## Monitoring

### Worker Status

```
🚀 Starting NATS JetStream Worker Service...
✅ Worker connected to NATS successfully
🚀 JetStream initialized
📚 Created EVENTS stream
👂 Created worker consumer
🎧 Worker consumer started successfully
💡 Listening for webhook events...
```

### Processing Events

```
📨 Processing webhook event: {
  eventId: "evt_123",
  eventType: "webhook.created",
  workspaceId: "ws_456",
  targetsCount: 2
}
🔐 Signature & Checksum verified
📦 Validated IDs in Redis / MongoDB
🚀 Delivering webhook to: https://example.com/webhook
✅ Webhook delivered successfully: { statusCode: 200, responseTimeMs: 150 }
✅ Event processed and acknowledged
```

---

## Scaling

### Multiple Workers

```bash
# Terminal 1
WORKER_NAME=worker-1 bun run src/index.ts

# Terminal 2
WORKER_NAME=worker-2 bun run src/index.ts
```

### Load Balancing

NATS JetStream automatically load balances between consumers with the same durable name.

---

## Troubleshooting

### Common Issues

1. **Connection Failed**

```bash
curl http://localhost:8222/varz
tail -f ../infra/nats/srv1.log
```

2. **No Messages Processed**

```bash
nats stream ls
nats consumer ls EVENTS
```

3. **Worker Not Starting**

```bash
cat .env
tail -f worker.log
```

### Debug Mode

```bash
LOG_LEVEL=debug bun run dev
```

---

## API Integration

### Backend (API Server)

```typescript
// Publishes events to NATS JetStream
await natsEventPublisher.publish(eventData);
```

### Worker (Consumer Service)

```typescript
// Consumes and processes events
await workerConsumer.start();
```

---

## Production Deployment

### Docker Deployment

```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production

COPY src ./src
COPY .env ./

CMD ["bun", "run", "src/index.ts"]
```

### Process Management

```bash
# Using PM2
pm2 start ecosystem.config.js

# Using systemd
sudo cp worker.service /etc/systemd/system/
sudo systemctl enable worker
sudo systemctl start worker
```

### Monitoring

```bash
curl http://localhost:3001/health
curl http://localhost:3001/metrics
```

---

**🚀 Your NATS JetStream Worker Service is ready for secure, high-performance production use!**
