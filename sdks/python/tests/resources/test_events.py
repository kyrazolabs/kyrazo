import pytest
from httpx import Response
from kyrazo.resources.events import PublishEventBody, TargetInput


def test_publish_event_success(client, mock_api):
    project_id = "proj_123"
    payload = {
        "webhookId": "wh_123",
        "eventType": "test.event",
        "payload": {"hello": "world"},
        "targets": [{"targetUrl": "https://google.com"}],
    }

    response_data = {
        "status": "queued",
        "eventId": "evt_123",
        "targetsCount": 1,
        "unfoundTargets": [],
        "queuedAt": "2024-01-01T00:00:00Z",
        "processingTimeMs": 10,
    }

    mock_api.post(f"/v1/events/{project_id}/publish").mock(
        return_value=Response(200, json=response_data)
    )

    event_body = PublishEventBody(**payload)
    response = client.events.publish(project_id, event_body)

    assert response.event_id == "evt_123"
    assert response.status == "queued"
    assert response.targets_count == 1


def test_publish_event_idempotency(client, mock_api):
    project_id = "proj_123"
    key = "unique_key"
    payload = {
        "webhookId": "wh_123",
        "eventType": "test.event",
        "payload": {},
        "targets": [{"targetUrl": "https://google.com"}],
    }

    route = mock_api.post(f"/v1/events/{project_id}/publish").mock(
        return_value=Response(
            200,
            json={
                "status": "queued",
                "eventId": "evt_123",
                "targetsCount": 1,
                "unfoundTargets": [],
                "queuedAt": "now",
                "processingTimeMs": 1,
            },
        )
    )

    event_body = PublishEventBody(**payload)
    client.events.publish(project_id, event_body, idempotency_key=key)

    assert route.calls.last.request.headers["Idempotency-Key"] == key
