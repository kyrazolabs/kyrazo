# Kyrazo SDK for JavaScript

Official JavaScript/TypeScript SDK for the Kyrazo webhook delivery platform. High-performance, robust, and idiomatically designed for modern web and Node.js environments.

[![npm version](https://img.shields.io/npm/v/@kyrazo/sdk.svg)](https://www.npmjs.com/package/@kyrazo/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @kyrazo/sdk
# or
yarn add @kyrazo/sdk
# or
pnpm add @kyrazo/sdk
```

## Quick Start

```typescript
import { Kyrazo } from "@kyrazo/sdk";

// Initialize with only your API key
const kyrazo = new Kyrazo("your-api-key");

// Or with advanced configuration
const kyrazo = new Kyrazo("your-api-key", {
  timeout: 45000,
  maxRetries: 5,
});

// Publish an event
try {
  const response = await kyrazo.events.single("namespace-id", {
    event: "user.created",
    payload: {
      user_id: "u_334",
      email: "user@example.com",
    },
    targets: ["target-id"],
  });
  console.log("Event queued:", response.eventId);
} catch (error) {
  console.error("Failed to publish:", error.message);
}
```

## Configuration

The `Kyrazo` constructor takes your API key as the first argument and an optional configuration object as the second.

### Constructor Signature

`new Kyrazo(apiKey: string, config?: KyrazoConfig)`

### KyrazoConfig Options

| Option       | Type                     | Default                  | Description                               |
| ------------ | ------------------------ | ------------------------ | ----------------------------------------- |
| `apiKey`     | `string`                 | **required**             | Your Kyrazo API key (Passed positionally) |
| `baseURL`    | `string`                 | `https://api.kyrazo.com` | API base URL                              |
| `timeout`    | `number`                 | `30000`                  | Request timeout in milliseconds           |
| `maxRetries` | `number`                 | `3`                      | Max retry attempts (exponential backoff)  |
| `headers`    | `Record<string, string>` | `{}`                     | Custom headers to include with requests   |

---

## Core Modules

### 1. Events Module

Used for publishing events to webhook targets. Supports single and batch operations.

#### Publish Single Event

```typescript
const response = await kyrazo.events.single(namespaceId, {
  event: "order.placed",
  payload: { order_id: "ord_1" },
  targets: ["tgt_abc"],
});
```

#### Batch Publish Events

```typescript
const response = await kyrazo.events.batch(namespaceId, [
  { event: "user.signup", payload: { id: "u_1" } },
  { event: "user.signup", payload: { id: "u_2" } },
]);
```

### 2. Targets Module

Used for managing webhook targets (URLs, secrets, configuration).

```typescript
// List targets
const targets = await kyrazo.targets.list(namespaceId, { limit: 10, page: 1 });

// Create a target
const target = await kyrazo.targets.create(namespaceId, {
  name: "Production Webhook",
  url: "https://example.com/webhook",
  method: "POST",
});
```

---

## Error Handling

The SDK provides a rich error hierarchy. Each error includes a `code`, `statusCode`, and `requestId`.

```typescript
import {
  Kyrazo,
  RateLimitError,
  ValidationError,
  AuthenticationError,
} from "@kyrazo/sdk";

try {
  await kyrazo.events.single(namespaceId, payload);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof ValidationError) {
    console.log("Invalid input:", error.details);
  }
}
```

### Error Code Reference

| Error Class           | HTTP Status | Code Example                                | Description                         |
| :-------------------- | :---------- | :------------------------------------------ | :---------------------------------- |
| `AuthenticationError` | 401         | `UNAUTHORIZED`, `INVALID_API_KEY`           | Invalid or missing API key          |
| `ValidationError`     | 400         | `VALIDATION_ERROR`, `INVALID_PAYLOAD`       | Request failed validation           |
| `ForbiddenError`      | 403         | `ACCESS_DENIED`, `INSUFFICIENT_PERMISSIONS` | Insufficient permissions            |
| `LimitExceededError`  | 403         | `LIMIT_EXCEEDED`                            | Monthly event limit exceeded        |
| `RateLimitError`      | 429         | `RATE_LIMIT_EXCEEDED`                       | Too many requests                   |
| `ConflictError`       | 409         | `CONFLICT`, `IDEMPOTENCY_CONFLICT`          | Resource already exists or conflict |
| `NotFoundError`       | 404         | `NOT_FOUND`, `NAMESPACE_NOT_FOUND`          | Resource does not exist             |
| `ServerError`         | 500+        | `INTERNAL_ERROR`, `PUBLISH_EVENT_FAILED`    | Internal server error               |
| `NetworkError`        | -           | `NETWORK_ERROR`                             | Connection timeout or fail          |

---

## Features

- **Isomorphic**: Works in Node.js, Browsers, and Edge workers.
- **Robust Retries**: Automatic exponential backoff for 5xx and 429 errors.
- **Idempotency**: Automatic `Idempotency-Key` generation for all state-changing requests.
- **Type-Safe**: Full TypeScript support with all request/response models exported.
- **Abort Signal**: Support for manual request cancellation via `AbortController`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architectural details and development guides.

## License

MIT
