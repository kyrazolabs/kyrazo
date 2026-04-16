# Kyrazo Python SDK

Official Python SDK for the [Kyrazo API](https://kyrazo.com). Build reliable event-driven systems and manage webhooks with ease. High-performance, robust, and idiomatically designed for modern Python environments.

[![PyPI version](https://img.shields.io/pypi/v/kyrazo.svg)](https://pypi.org/project/kyrazo/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Versions](https://img.shields.io/pypi/pyversions/kyrazo.svg)](https://pypi.org/project/kyrazo/)

## 📦 Installation

```bash
pip install kyrazo
```

Or with [Poetry](https://python-poetry.org/):

```bash
poetry add kyrazo
```

## 🛠️ Quick Start

```python
from kyrazo import Kyrazo, KyrazoError

# Initialize with only your API key (positional)
client = Kyrazo("your_api_key")

# Or with advanced configuration
client = Kyrazo("your_api_key", timeout=45, retries=5)

try:
    # Publish an event
    event = client.events.publish(
        namespace_id="ns_123",
        body={
            "event": "user.signup",
            "payload": {"userId": "user_01", "email": "alice@example.com"},
            "targets": ["tg_987"]
        }
    )
    print(f"Event published! ID: {event.event_id}")

except KyrazoError as e:
    print(f"API Error: {e.message} (Code: {e.code})")
```

## ⚙️ Configuration

The `Kyrazo` constructor takes your API key as the first argument, followed by optional keyword arguments for further configuration.

### Constructor Signature
`Kyrazo(api_key: str, base_url: str = "...", timeout: int = 30, retries: int = 3)`

### Arguments

| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `api_key` | `str` | **Required** | Your Kyrazo API key (Passed positionally) |
| `base_url` | `str` | `https://api.kyrazo.com` | API base URL |
| `timeout` | `int` | `30` | Request timeout in seconds |
| `retries` | `int` | `3` | Max retry attempts with exponential backoff |

## 📖 Core Modules

### 1. Events Module

Used for publishing events to webhook targets. Supports single and batch operations.

#### Publish Single Event
```python
response = client.events.publish(namespace_id, body={
    "event": "order.placed",
    "payload": {"order_id": "ord_1"},
    "targets": ["tgt_abc"]
})
```

#### Batch Publish Events
```python
response = client.events.publish_batch(namespace_id, body=[
    {"event": "user.signup", "payload": {"id": "u_1"}},
    {"event": "user.signup", "payload": {"id": "u_2"}},
])
```

### 2. Targets Module

Used for managing webhook targets (URLs, secrets, configuration).

```python
# List targets
targets = client.targets.list(namespace_id, limit=10, page=1)

# Create a target
target = client.targets.create(namespace_id, body={
    "name": "Production Webhook",
    "url": "https://example.com/webhook",
    "method": "POST",
})
```

---

## 🛡️ Error Handling

The SDK provides a rich exception hierarchy. Each error includes a `code`, `status_code`, and `request_id`.

```python
from kyrazo import RateLimitError, ValidationError, AuthenticationError

try:
    client.events.publish(...)
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except ValidationError as e:
    print(f"Invalid input: {e.details}")
except AuthenticationError:
    print("Please check your API key")
```

### Error Code Reference

| Exception | HTTP Status | Code Example | Description |
| :--- | :--- | :--- | :--- |
| `AuthenticationError` | 401 | `UNAUTHORIZED`, `INVALID_API_KEY` | Invalid or missing API key |
| `ValidationError` | 400 | `VALIDATION_ERROR`, `INVALID_PAYLOAD` | Request failed validation |
| `ForbiddenError` | 403 | `ACCESS_DENIED`, `INSUFFICIENT_PERMISSIONS` | Insufficient permissions |
| `LimitExceededError` | 403 | `LIMIT_EXCEEDED` | Monthly event limit exceeded |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `ConflictError` | 409 | `CONFLICT`, `IDEMPOTENCY_CONFLICT` | Resource already exists or conflict |
| `NotFoundError` | 404 | `NOT_FOUND`, `NAMESPACE_NOT_FOUND` | Resource does not exist |
| `ServerError` | 500+ | `INTERNAL_ERROR`, `PUBLISH_EVENT_FAILED` | Internal server error |
| `NetworkError` | - | `NETWORK_ERROR` | Connection timeout or failure |

---

## ⚡ Features

- **Robust Retries**: Automatic exponential backoff for 5xx and 429 errors.
- **Idempotency**: Automatic `Idempotency-Key` generation for all state-changing requests.
- **Type-Safe**: Full Python type hinting support.
- **Isomorphic**: Works in synchronous and asynchronous (future) environments.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architectural details and development guides.

## 📄 License

MIT © [Kyrazo](https://kyrazo.com)
