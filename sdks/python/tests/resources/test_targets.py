import pytest
from httpx import Response
from kyrazo.resources.targets import CreateTargetInput, Target


def test_create_target_success(client, mock_api):
    project_id = "proj_123"
    payload = {
        "name": "My Target",
        "url": "https://example.com/target",
        "method": "POST",
        "retryCount": 3,
        "rateLimitDuration": 60,
        "config": {"timeout": 5000, "retryCount": 3, "rateLimitDuration": 60},
    }

    response_data = {
        "data": {
            "_id": "tgt_123",
            "name": "My Target",
            "url": "https://example.com/target",
            "method": "POST",
            "description": None,
            "enabled": True,
            "config": {
                "timeout": 5000,
                "retryCount": 3,
                "rateLimit": None,
                "rateLimitDuration": 60,
            },
            "customHeaders": None,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
        }
    }

    mock_api.post(f"/v1/targets/{project_id}").mock(
        return_value=Response(201, json=response_data)
    )

    target_input = CreateTargetInput(**payload)
    target = client.targets.create(project_id, target_input)

    assert target.id == "tgt_123"
    assert target.name == "My Target"
    assert target.method == "POST"


def test_delete_target(client, mock_api):
    project_id = "proj_123"
    target_id = "tgt_123"

    mock_api.delete(f"/v1/targets/{project_id}/{target_id}").mock(
        return_value=Response(200, json={"success": True})
    )

    success = client.targets.delete(project_id, target_id)
    assert success is True


def test_get_target_secret(client, mock_api):
    project_id = "proj_123"
    target_id = "tgt_123"
    secret = "whsec_12345"

    mock_api.get(f"/v1/targets/{project_id}/{target_id}/secret").mock(
        return_value=Response(
            200, json={"success": True, "data": {"secret": secret}}
        )
    )

    result = client.targets.get_secret(project_id, target_id)
    assert result == secret


def test_update_target_status(client, mock_api):
    project_id = "proj_123"
    target_id = "tgt_123"
    enabled = False

    response_data = {
        "success": True,
        "data": {
            "_id": "tgt_123",
            "name": "My Target",
            "url": "https://example.com/target",
            "url": "https://example.com/target",
            "method": "POST",
            "enabled": False,
            "config": {
                "timeout": 5000,
                "retryCount": 3,
                "rateLimit": None,
                "rateLimitDuration": 60,
            },
            "customHeaders": None,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
        },
    }

    mock_api.put(f"/v1/targets/{project_id}/{target_id}").mock(
        return_value=Response(200, json=response_data)
    )

    target = client.targets.update_status(project_id, target_id, enabled)
    assert target.enabled is False
