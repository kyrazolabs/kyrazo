from httpx import Response
from kyrazo.resources.sources import CreateSourceInput


def test_create_source_success(client, mock_api):
    namespace_id = "proj_123"
    payload = {
        "name": "My Source",
        "service": "stripe",
        "eventTypes": ["charge.succeeded"],
    }

    response_data = {
        "data": {
            "_id": "src_123",
            "name": "My Source",
            "description": None,
            "service": "stripe",
            "status": "active",
            "forwarding": False,
            "endpoints": [],
            "eventTypes": ["charge.succeeded"],
            "retryPolicy": None,
            "authentication": None,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
        }
    }

    mock_api.post(f"/v1/sources/{namespace_id}").mock(
        return_value=Response(201, json=response_data)
    )

    source_input = CreateSourceInput(**payload)
    source = client.sources.create(namespace_id, source_input)

    assert source.id == "src_123"
    assert source.name == "My Source"
    assert source.service == "stripe"


def test_list_sources(client, mock_api):
    namespace_id = "proj_123"

    mock_api.get(f"/v1/sources/{namespace_id}").mock(
        return_value=Response(
            200,
            json={
                "data": [
                    {
                        "_id": "src_1",
                        "name": "S1",
                        "service": "stripe",
                        "status": "active",
                        "forwarding": False,
                        "eventTypes": ["*"],
                        "createdAt": "2024-01-01T00:00:00Z",
                        "updatedAt": "2024-01-01T00:00:00Z",
                    },
                    {
                        "_id": "src_2",
                        "name": "S2",
                        "service": "paypal",
                        "status": "inactive",
                        "forwarding": True,
                        "eventTypes": ["payment.created"],
                        "createdAt": "2024-01-01T00:00:00Z",
                        "updatedAt": "2024-01-01T00:00:00Z",
                    },
                ]
            },
        )
    )

    # Returns PaginatedResponse[Source]
    response = client.sources.list(namespace_id)
    assert len(response.data) == 2
    assert response.data[0].id == "src_1"


def test_create_source_with_auth(client, mock_api):
    namespace_id = "proj_123"
    payload = {
        "name": "Auth Source",
        "service": "stripe",
        "authentication": {
            "enabled": True,
            "type": "service",
            "service": {"secret": "secret_123"},
        },
        "eventTypes": ["*"],
    }

    response_data = {
        "data": {
            "_id": "src_auth",
            "name": "Auth Source",
            "service": "stripe",
            "status": "active",
            "forwarding": False,
            "eventTypes": ["*"],
            "authentication": {
                "enabled": True,
                "type": "service",
                "service": {"secret": "secret_123"},
            },
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
        }
    }

    mock_api.post(f"/v1/sources/{namespace_id}").mock(
        return_value=Response(201, json=response_data)
    )

    source_input = CreateSourceInput(**payload)
    source = client.sources.create(namespace_id, source_input)

    assert source.id == "src_auth"
    assert source.name == "Auth Source"
