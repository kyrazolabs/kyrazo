# Kyrazo SDK for Go

Official Go SDK for the Kyrazo webhook delivery platform. High-performance, robust, and idiomatically designed for the Go ecosystem.

[![Go Reference](https://pkg.go.dev/badge/github.com/kyrazolabs/sdks/go.svg)](https://pkg.go.dev/github.com/kyrazolabs/sdks/go)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
go get github.com/kyrazolabs/sdks/go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/kyrazolabs/sdks/go"
    "github.com/kyrazolabs/sdks/go/models"
)

func main() {
    // Initialize the client
    client := kyrazo.New("your-api-key")

    // Publish an event
    ctx := context.Background()
    resp, err := client.Events.Single(ctx, "namespace-id", models.PublishEvent{
        EventType: "user.created",
        Payload: map[string]interface{}{
            "user_id": "u_334",
            "email":   "user@example.com",
            "plan":    "pro",
        },
        Targets: []models.EventTarget{
            {TargetId: "65a1b2c3d4e5f67890123456"},
        },
    })
    if err != nil {
        log.Fatalf("Failed to publish event: %v", err)
    }

    fmt.Printf("Event successfully queued: %s\n", resp.EventId)
}
```

## Configuration

The SDK uses the functional options pattern for configuration during initialization.

```go
client := kyrazo.New("your-api-key",
    kyrazo.WithBaseURL("https://api.custom.com"),
    kyrazo.WithTimeout(60 * time.Second),
    kyrazo.WithMaxRetries(5),
)
```

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `WithBaseURL` | `string` | `https://api.kyrazo.com` | API base URL |
| `WithTimeout` | `time.Duration` | `30s` | Request timeout |
| `WithMaxRetries` | `int` | `3` | Max retry attempts (exponential backoff) |
| `WithUserAgent` | `string` | `kyrazo-sdk-go/v1.2.0` | Custom User-Agent header |

---

## Core Modules

### 1. Events Module

Used for publishing events to webhook targets. Supports single and batch operations.

#### Publish Single Event
```go
resp, err := client.Events.Single(ctx, "ns_123", models.PublishEvent{
    EventType: "order.placed",
    Payload:   map[string]interface{}{"order_id": "ord_1"},
})
```

#### Batch Publish Events
```go
resp, err := client.Events.Batch(ctx, "ns_123", []models.PublishEvent{
    {EventType: "user.signup", Payload: map[string]interface{}{"id": "u_1"}},
    {EventType: "user.signup", Payload: map[string]interface{}{"id": "u_2"}},
})
```

### 2. Targets Module

Used for managing webhook targets (URLs, secrets, configuration).

```go
// List targets
targets, err := client.Targets.List(ctx, "ns_123", "search_query", 10, 1)

// Create a target
target, err := client.Targets.Create(ctx, "ns_123", models.CreateTargetInput{
    Name: "Production Webhook",
    Url:  "https://example.com/webhook",
    Method: "POST",
})
```

---

## Error Handling

The SDK provides a rich error hierarchy. Use `errors.As` to handle specific conditions.

```go
import (
    "errors"
    "github.com/kyrazolabs/sdks/go/models/apierrors"
)

resp, err := client.Events.Single(ctx, namespaceId, payload)
if err != nil {
    var rateLimitErr *apierrors.RateLimitError
    if errors.As(err, &rateLimitErr) {
        fmt.Printf("Rate limited. Retry after %ds\n", *rateLimitErr.RetryAfter)
    }
}
```

### Error Code Reference

| Error Type | HTTP Status | API Code | Description |
| :--- | :--- | :--- | :--- |
| `AuthenticationError` | 401 | `UNAUTHORIZED` | Invalid or missing API key |
| `AuthenticationError` | 401 | `INVALID_API_KEY` | Explicitly invalid API key |
| `AuthenticationError` | 401 | `API_KEY_MISSING` | API key omitted from request |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Request failed schema validation |
| `ValidationError` | 400 | `INVALID_INPUT` | Invalid parameter values |
| `ValidationError` | 400 | `INVALID_PAYLOAD` | malformed JSON or illegal fields |
| `ValidationError` | 400 | `BATCH_TOO_LARGE` | More than 100 events in batch |
| `ForbiddenError` | 403 | `ACCESS_DENIED` | Insufficient permissions |
| `ForbiddenError` | 403 | `INSUFFICIENT_PERMISSIONS` | Role does not allow this action |
| `ForbiddenError` | 403 | `WORKSPACE_ACCESS_DENIED` | No access to this workspace |
| `LimitExceededError` | 403 | `LIMIT_EXCEEDED` | Monthly usage quota reached |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | Per-second rate limit hit |
| `ConflictError` | 409 | `CONFLICT` | Resource already exists |
| `ConflictError` | 409 | `IDEMPOTENCY_CONFLICT` | Idempotency key reused with diff body |
| `ConflictError` | 409 | `TARGET_ALREADY_EXISTS` | Duplicate target URL in namespace |
| `KyrazoError` | 404 | `NOT_FOUND` | Resource not found |
| `KyrazoError` | 404 | `NAMESPACE_NOT_FOUND` | Target namespace does not exist |
| `KyrazoError` | 404 | `TARGET_NOT_FOUND` | Target ID does not exist |
| `KyrazoError` | 404 | `ENDPOINT_NOT_FOUND` | Endpoint ID does not exist |
| `ServerError` | 500+ | `INTERNAL_ERROR` | An unexpected service error occurred |

---

## Features

- **Robust HTTPS**: Automatic retries with exponential backoff on 5xx and 429 errors.
- **Idempotency**: Automatic `Idempotency-Key` generation for all state-changing requests.
- **Context Support**: Deep integration with Go's `context` package.
- **Clean Architecture**: Decoupled package structure for easy testing and maintenance.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architectural details and development guides.

## License

MIT
