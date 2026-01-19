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
  baseURL: "http://localhost:4000", // defaults to production
});

// Publish an event
const response = await kyrazo.dispatch.single("project-id", {
  webhookId: "68c674dd3b96f77d9426a93b",
  eventType: "user.created",
  payload: {
    user_id: "u_334",
    email: "user@example.com",
    plan: "pro",
  },
  targets: [
    { targetUrl: "https://your-endpoint.com/webhook" },
  ],
});

console.log("Event queued:", response.eventId);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **required** | Your Kyrazo API key |
| `baseURL` | `string` | `https://api.kyrazo.com` | API base URL |
| `timeout` | `number` | `30000` | Request timeout (ms) |
| `maxRetries` | `number` | `3` | Max retry attempts |

## API Reference

### Publish Single Event

```typescript
const response = await kyrazo.dispatch.single(projectId, {
  webhookId: "...",      // Required: Webhook config ID
  eventType: "...",      // Required: Event type (e.g., "user.created")
  payload: { ... },      // Required: Event data
  targets: [             // Required: Delivery targets
    { targetUrl: "https://..." }
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
  subject: "events.project-id",
  stream: "EVENTS",
  sequence: 12345,
  targetsCount: 1,
  queued_at: "2024-01-01T00:00:00.000Z",
  processing_time_ms: 15
}
```

### Batch Publish (up to 100 events)

```typescript
const responses = await kyrazo.dispatch.batch(projectId, [
  { webhookId: "...", eventType: "user.created", payload: {...}, targets: [...] },
  { webhookId: "...", eventType: "user.updated", payload: {...}, targets: [...] },
]);
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
  await kyrazo.dispatch.single(projectId, payload);
} catch (error) {
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

| Error Class | Code | Status | Description |
|-------------|------|--------|-------------|
| `AuthenticationError` | `UNAUTHORIZED` | 401 | Invalid/missing API key |
| `ValidationError` | `INVALID_PAYLOAD` | 400 | Invalid request payload |
| `LimitExceededError` | `LIMIT_EXCEEDED` | 403 | Monthly limit exceeded |
| `RateLimitError` | `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ServerError` | `INTERNAL_ERROR` | 500 | Server error |

## TypeScript

Full TypeScript support with all types exported:

```typescript
import type { 
  PublishEventPayload,
  PublishEventResponse,
  EventPriority 
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
