# JavaScript SDK Development Guide

## 📁 Project Structure

```
sdk/javascript/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # User-facing documentation
├── CONTRIBUTING.md       # This file
├── src/
│   ├── index.ts          # Main entry - exports everything
│   ├── client.ts         # Kyrazo client class
│   ├── core/
│   │   ├── config.ts     # Configuration types
│   │   ├── errors.ts     # Error classes
│   │   └── version.ts    # SDK version
│   ├── types/
│   │   ├── index.ts      # Type re-exports
│   │   ├── common.ts     # Shared types (EventTarget, etc.)
│   │   ├── events.ts     # Event types
│   │   ├── sources.ts    # Source types
│   │   ├── endpoints.ts  # Endpoint types
│   │   └── targets.ts    # Target types
│   ├── utils/
│   │   ├── http.ts       # HTTP client with retries
│   │   ├── validation.ts # Input validation
│   │   └── helpers.ts    # Utility functions
│   └── modules/
│       ├── events/       # Events module (Publishing)
│       │   ├── index.ts
│       │   ├── types.ts
│       │   ├── publish-event.ts
│       │   └── publish-events.ts
│       ├── sources/      # Sources module (CRUD)
│       ├── endpoints/    # Endpoints module (CRUD)
│       └── targets/      # Targets module (CRUD)
└── dist/                 # Built output (gitignored)
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Type check without building
npm run typecheck

# Watch mode for development
npm run dev

# Run linting
npm run lint
```

## 🔧 How It Works

### Client Architecture

The SDK uses a modular functional factory pattern.

```
Kyrazo (client.ts)
    │
    ├── config (KyrazoConfig)
    │       └── apiKey, baseURL, timeout, maxRetries
    │
    ├── _httpClient (HttpClient)
    │       └── Handles all HTTP requests with retry logic
    │
    ├── events (EventsModule)
    │       ├── single(projectId, payload) → PublishEventResponse
    │       └── batch(projectId, events[]) → BatchPublishEventResponse[]
    │
    ├── sources (SourcesModule)
    │       └── list, get, create, update, delete
    │
    ├── endpoints (EndpointsModule)
    │       └── list, get, create, update, delete
    │
    └── targets (TargetsModule)
            └── list, get, create, update, delete
```

### Request Flow

1. User calls `kyrazo.events.single(projectId, payload)`
2. Factory function creates the request context
3. Validation runs on `projectId` and `payload`
4. `HttpClient.post()` sends request with:
   - `x-api-key` header
   - JSON body
   - Retry logic on failures
5. Response is parsed and returned
6. Errors are mapped to specific error classes (e.g. `RateLimitError` with retry headers)

### Error Handling

All API errors extend `KyrazoError`:

| Error Class           | HTTP Code | When                                      |
| --------------------- | --------- | ----------------------------------------- |
| `AuthenticationError` | 401       | Invalid API key                           |
| `ValidationError`     | 400       | Invalid payload                           |
| `LimitExceededError`  | 403       | Monthly limit hit                         |
| `RateLimitError`      | 429       | Too many requests (includes `retryAfter`) |
| `ServerError`         | 500       | Backend error                             |
| `NetworkError`        | -         | Connection issues                         |

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Manual Testing

```typescript
import { Kyrazo } from "./src";

const client = new Kyrazo({
  apiKey: "your-api-key",
  baseURL: "http://localhost:4000",
});

// Test single event
const response = await client.events.single("project-id", {
  webhookId: "68c674dd3b96f77d9426a93b",
  eventType: "user.created",
  payload: { userId: "u_123" },
  targets: [{ targetUrl: "https://webhook.site/xxx" }],
});
console.log("Response:", response);
```

## 📝 Adding New Features

### Adding a New Module

1. Create folder: `src/modules/newmodule/`
2. Create types: `src/types/newmodule.ts`
3. Create factory: `src/modules/newmodule/index.ts` (export `createNewModule` and `NewModule` interface)
4. Export from `src/index.ts`
5. Add to client in `src/client.ts`

### Adding a New Method

1. Create file: `src/modules/events/new-method.ts`
2. Export from `src/modules/events/index.ts`
3. Add to `EventsModule` interface

## 🔑 Key Files

| File                                   | Purpose                 |
| -------------------------------------- | ----------------------- |
| `src/index.ts`                         | Main entry, all exports |
| `src/client.ts`                        | `Kyrazo` client class   |
| `src/utils/http.ts`                    | HTTP client             |
| `src/errors.ts`                        | Error classes           |
| `src/modules/events/publish-event.ts`  | `single()` method       |
| `src/modules/events/publish-events.ts` | `batch()` method        |

## 🛠️ Scripts Reference

| Script      | Command                                            | Description      |
| ----------- | -------------------------------------------------- | ---------------- |
| `build`     | `tsup src/index.ts --format cjs,esm --dts --clean` | Production build |
| `dev`       | `tsup src/index.ts --format cjs,esm --dts --watch` | Watch mode       |
| `typecheck` | `tsc --noEmit`                                     | Type checking    |
| `lint`      | `eslint src --ext .ts`                             | Linting          |
| `test`      | `vitest`                                           | Run tests        |
