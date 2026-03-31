# Kyrazo SDK

Official JavaScript/TypeScript SDK for the Kyrazo webhook delivery platform.

## Installation

```bash
npm install @kyrazo/sdk
```

## Quick Start

```typescript
import { Kyrazo } from "@kyrazo/sdk";

const kyrazo = new Kyrazo({
  apiKey: "your-api-key",
  baseURL: "http://api.kyrazo.com", // defaults to production
});

// Publish an event
const response = await kyrazo.events.single("namespace-id", {
  eventType: "user.created",
  payload: {
    user_id: "u_334",
    email: "user@example.com",
    plan: "pro",
  },
  targets: [{ targetId: "65a1b2c3d4e5f67890123456" }],
});

console.log("Event queued:", response.eventId);
```

## Configuration

| Option       | Type     | Default                  | Description          |
| ------------ | -------- | ------------------------ | -------------------- |
| `apiKey`     | `string` | **required**             | Your Kyrazo API key  |
| `baseURL`    | `string` | `https://api.kyrazo.com` | API base URL         |
| `timeout`    | `number` | `30000`                  | Request timeout (ms) |
| `maxRetries` | `number` | `3`                      | Max retry attempts   |

## API Reference

### Publish Single Event

```typescript
const response = await kyrazo.events.single(namespaceId, {
  eventType: "...",      // Required: Event type (e.g., "user.created")
  payload: { ... },      // Required: Event data
  previous: { ... },     // Optional: Previous state of the resource
  targets: [             // Required: Delivery targets
    { targetId: "..." }
  ],
  meta: {                // Optional
    priority: "high",    // "low" | "normal" | "high" | "urgent"
    maxRetries: 5        // 0-10
  }
});
```

**Response:**

```typescript
{
  status: "queued",
  eventId: "uuid",
  targetsCount: 1,
  unfoundTargets: [],
  queuedAt: "2024-01-01T00:00:00.000Z",
  processingTimeMs: 15
}
```

### Batch Publish (up to 1000 events)

```typescript
const response = await kyrazo.events.batch(namespaceId, [
  { eventType: "user.created", payload: {...}, targets: [{ targetId: "..." }] },
  { eventType: "user.updated", payload: {...}, targets: [{ targetId: "..." }] },
]);

console.log(`Queued ${response.queuedCount} events`);
```

## Error Handling

```typescript
import {
  Kyrazo,
  RateLimitError,
  LimitExceededError,
  ValidationError,
  AuthenticationError,
} from "@kyrazo/sdk";

try {
  await kyrazo.events.single(namespaceId, payload);
} catch (error: any) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry in ${error.retryAfter}s`);
  } else if (error instanceof LimitExceededError) {
    console.log("Monthly limit exceeded. Upgrade your plan.");
  } else if (error instanceof ValidationError) {
    console.log("Invalid payload:", error.message);
  } else if (error instanceof AuthenticationError) {
    console.log("Invalid API key");
  }
}
```

| Error Class           | Code                  | Status | Description             |
| --------------------- | --------------------- | ------ | ----------------------- |
| `AuthenticationError` | `UNAUTHORIZED`        | 401    | Invalid/missing API key |
| `ValidationError`     | `INVALID_PAYLOAD`     | 400    | Invalid request payload |
| `LimitExceededError`  | `LIMIT_EXCEEDED`      | 403    | Monthly limit exceeded  |
| `RateLimitError`      | `RATE_LIMIT_EXCEEDED` | 429    | Too many requests       |
| `ServerError`         | `INTERNAL_ERROR`      | 500    | Server error            |

## TypeScript

Full TypeScript support with all types exported:

```typescript
import type {
  PublishEventPayload,
  PublishEventResponse,
  EventPriority,
} from "@kyrazo/sdk";
```

## Development

```bash
npm install
npm run build
npm run typecheck
```

## License

MIT
