from httpx import Response
from kyrazo.resources.events import PublishEventBody


def test_publish_event_success(client, mock_api):
    namespace_id = "proj_123"
    payload = {
        "event": "test.event",
        "payload": {"hello": "world"},
        "targets": ["target_123"],
    }

    response_data = {
        "status": "queued",
        "eventId": "evt_123",
        "targetsCount": 1,
        "unfoundTargets": [],
        "queuedAt": "2024-01-01T00:00:00Z",
        "processingTimeMs": 10,
    }

    mock_api.post(f"/v1/events/{namespace_id}/publish").mock(
        return_value=Response(200, json=response_data)
    )

    event_body = PublishEventBody(**payload)
    response = client.events.publish(namespace_id, event_body)

    assert response.event_id == "evt_123"
    assert response.status == "queued"
    assert response.targets_count == 1


def test_publish_event_idempotency(client, mock_api):
    namespace_id = "proj_123"
    key = "unique_key"
    payload = {
        "event": "test.event",
        "payload": {},
        "targets": ["target_123"],
    }

    route = mock_api.post(f"/v1/events/{namespace_id}/publish").mock(
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
    client.events.publish(namespace_id, event_body, idempotency_key=key)

    assert route.calls.last.request.headers["Idempotency-Key"] == key


def test_publish_event_automatic_idempotency(client, mock_api):
    namespace_id = "proj_123"
    payload = {
        "event": "test.event",
        "payload": {},
        "targets": ["target_123"],
    }

    route = mock_api.post(f"/v1/events/{namespace_id}/publish").mock(
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
    client.events.publish(namespace_id, event_body)

    # Header should be present and be a valid UUID
    idempotency_key = route.calls.last.request.headers.get("Idempotency-Key")
    assert idempotency_key is not None
    import uuid
    try:
        uuid.UUID(idempotency_key)
    except ValueError:
        pytest.fail("Idempotency-Key is not a valid UUID")
