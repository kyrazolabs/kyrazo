# Kyrazo Python SDK

[![PyPI version](https://img.shields.io/pypi/v/kyrazo.svg)](https://pypi.org/project/kyrazo/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Versions](https://img.shields.io/pypi/pyversions/kyrazo.svg)](https://pypi.org/project/kyrazo/)

Official Python SDK for the [Kyrazo API](https://kyrazo.com). Build reliable event-driven systems and manage webhooks with ease.

## 🚀 Features

- **Type-Safe**: Full type hinting for a better developer experience.
- **Reliable**: Built-in automatic retries and timeout management.
- **Async/Sync**: Support for synchronous and asynchronous (coming soon) operations.
- **Standardized Errors**: Precise error mapping for granular error handling.
- **Idempotent**: Automatic idempotency key generation for safe retries.

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

# Initialize the client
client = Kyrazo(api_key="your_api_key")

try:
    # Publish an event
    event = client.events.publish(
        namespace_id="ns_123",
        body={
            "eventType": "user.signup",
            "payload": {"userId": "user_01", "email": "alice@example.com"},
            "targets": [{"targetId": "tg_987"}]
        }
    )
    print(f"Event published! ID: {event.event_id}")

except KyrazoError as e:
    print(f"API Error: {e.message} (Code: {e.code})")
```

## 📖 Key Concepts

### Error Handling

Every error raised by the SDK inherits from `KyrazoError`. You can catch specific errors for more granular control:

```python
from kyrazo import ForbiddenError, LimitExceededError

try:
    client.namespaces.create(...)
except ForbiddenError:
    # Handle permission issues
    pass
except LimitExceededError as e:
    # Handle plan limits
    print(f"Limit reached. Retry after {e.retry_after}s")
```

### Automatic Idempotency

All mutation requests (POST, PUT, PATCH, DELETE) automatically include a unique `Idempotency-Key` to ensure that operations can be safely retried without side effects.

## 🔗 Links

- [Official Documentation](https://docs.kyrazo.com)
- [Kyrazo Dashboard](https://app.kyrazo.com)
- [Support](mailto:support@kyrazo.com)

## 📄 License

MIT © [Kyrazo](https://kyrazo.com)
