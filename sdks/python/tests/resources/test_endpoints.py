import pytest
from httpx import Response
from kyrazo.resources.endpoints import CreateEndpointInput, Endpoint


def test_create_endpoint_success(client, mock_api):
    project_id = "proj_123"
    payload = {
        "name": "My Endpoint",
        "url": "https://example.com/webhook",
        "status": "active",
        "retryCount": 3,
        "rateLimitDuration": 60,
        "config": {"timeout": 5000, "retryCount": 3, "rateLimitDuration": 60},
    }

    response_data = {
        "data": {
            "_id": "end_123",
            "name": "My Endpoint",
            "status": "active",
            "url": "https://example.com/webhook",
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

    mock_api.post(f"/v1/endpoints/{project_id}").mock(
        return_value=Response(201, json=response_data)
    )

    endpoint_input = CreateEndpointInput(**payload)
    endpoint = client.endpoints.create(project_id, endpoint_input)

    assert endpoint.id == "end_123"
    assert endpoint.name == "My Endpoint"
    assert endpoint.url == "https://example.com/webhook"


def test_list_endpoints(client, mock_api):
    project_id = "proj_123"

    mock_api.get(f"/v1/endpoints/{project_id}").mock(
        return_value=Response(
            200,
            json={
                "data": [
                    {
                        "_id": "end_1",
                        "name": "E1",
                        "status": "active",
                        "url": "https://test.com",
                        "enabled": True,
                        "config": {
                            "timeout": 1000,
                            "retryCount": 1,
                            "rateLimitDuration": 60,
                        },
                        "createdAt": "now",
                        "updatedAt": "now",
                    }
                ]
            },
        )
    )

    response = client.endpoints.list(project_id)
    assert len(response["data"]) == 1
    assert response["data"][0]["name"] == "E1"
