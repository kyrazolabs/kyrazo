import pytest
from httpx import Response
from kyrazo.resources.sources import CreateSourceInput, Source


def test_create_source_success(client, mock_api):
    project_id = "proj_123"
    payload = {
        "name": "My Source",
        "service": "stripe",
        "type": "receive",
        "eventTypes": ["charge.succeeded"],
    }

    response_data = {
        "data": {
            "_id": "src_123",
            "name": "My Source",
            "description": None,
            "type": "receive",
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

    mock_api.post(f"/v1/sources/{project_id}").mock(
        return_value=Response(201, json=response_data)
    )

    source_input = CreateSourceInput(**payload)
    source = client.sources.create(project_id, source_input)

    assert source.id == "src_123"
    assert source.name == "My Source"
    assert source.service == "stripe"


def test_list_sources(client, mock_api):
    project_id = "proj_123"

    mock_api.get(f"/v1/sources/{project_id}").mock(
        return_value=Response(
            200,
            json={
                "data": [{"_id": "src_1", "name": "S1"}, {"_id": "src_2", "name": "S2"}]
            },
        )
    )

    # Note: List returns raw response in current impl, maybe should change?
    # But for now testing what is implemented.
    response = client.sources.list(project_id)
    assert len(response["data"]) == 2
