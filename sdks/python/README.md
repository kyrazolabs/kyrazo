# Kyrazo Python SDK

Official Python SDK for the Kyrazo API.

## Installation

```bash
pip install kyrazo
# or with poetry
poetry add kyrazo
```

## Usage

```python
from kyrazo import Kyrazo

client = Kyrazo(api_key="your_api_key")

# Publish an event
response = client.events.publish(
    project_id="proj_123",
    payload={
        "webhookId": "wh_123",
        "eventType": "user.created",
        "payload": {"id": 1, "name": "Alice"},
        "targets": [{"targetUrl": "https://example.com/webhook"}]
    }
)
print(response.event_id)
```
