# Contributing to Kyrazo Go SDK

This SDK is part of the private Kyrazo repository, owned by Kyrazo LLC. Do not change it, and do not use it for a commercial or a non-commercial purpose, unless Kyrazo LLC has given you written permission. The repository [license](../../LICENSE) and [contributing guide](../../CONTRIBUTING.md) apply. Write to [legal@kyrazo.com](mailto:legal@kyrazo.com). A pull request is not permission.

The notes below describe the architecture of the Go SDK for people who already have that permission.

## Architecture

The SDK is designed with a layered, modular architecture to ensure testability and robustness.

### High-Level Design

```mermaid
graph TD
    UserCode[User Application] --> Client[Kyrazo Client]
    Client --> Events[Events Service]
    Client --> Targets[Targets Service]
    Client --> Endpoints[Endpoints Service]
    Client --> Sources[Sources Service]

    Events --> Internal[Internal Request Client]
    Targets --> Internal
    Endpoints --> Internal
    Sources --> Internal

    Internal --> ErrorMapping[Error Transformation]
    Internal --> Retry[Retry Logic/Backoff]
    Internal --> NetHTTP[net/http]
```

### Components

1.  **Kyrazo Client (`client.go`)**: The main entry point. It orchestrates the initialization of service modules and the internal HTTP client.
2.  **Internal Request Client (`internal/request/client.go`)**: A low-level wrapper around `net/http`. This is the "brain" of the SDK, handling:
    - **Retries**: Exponential backoff on 5xx and 429 status codes.
    - **Idempotency**: Automatic `Idempotency-Key` generation.
    - **Global Headers**: Injection of `User-Agent` and `x-api-key`.
3.  **Service Modules**: Domain-specific logic (`events.go`, `targets.go`, etc.) that translate method calls into HTTP requests.
4.  **Error System (`models/apierrors/`)**: A rich hierarchy of errors that map to Kyrazo API codes.

## Project Structure

```text
sdks/go/
├── internal/
│   └── request/        # Robust HTTP client core & tests
├── models/
│   ├── apierrors/      # Rich error hierarchy & tests
│   └── schemas.go      # Request/Response structs
├── client.go           # Main SDK entry point
├── config.go           # Options pattern & defaults
├── events.go           # Events service module
├── targets.go          # Targets service module
├── endpoints.go        # Endpoints service module
├── sources.go          # Sources service module
├── README.md           # Full usage guide
└── CONTRIBUTING.md     # Architectural overview
```

## Development Workflow

### Prerequisites

- Go 1.22+
- `golangci-lint` (recommended)

### Testing

We maintain a high bar for testing. All logic in `internal/request` and the service modules must be covered by `httptest`-based unit tests.

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -v -cover ./...

# If using mise, use exec to ensure correct GOROOT
mise exec -- go test -v -cover ./...
```

### Code Style

- Follow idiomatic Go conventions (`effective go`).
- Use the functional options pattern for initialization.
- All exported methods must have a `context.Context` parameter as the first argument.
- Avoid external dependencies unless absolutely necessary.

## Pull Request Process

1.  **Open an Issue**: Discuss the proposed change before implementing it.
2.  **Add Tests**: Every fix or feature must include unit tests.
3.  **Documentation**: Update the `README.md` if the API surface changes.
4.  **Verify**: Ensure `go mod tidy` and `go build ./...` pass.

## License

Code in this folder is covered by the repository [LICENSE](../../LICENSE). A contribution is not licensed to you under MIT or any other open-source license. Commercial use and non-commercial use both require prior written permission from Kyrazo LLC.
