from typing import Optional, Any
from ...core.http_client import HttpClient
from .models import Endpoint, CreateEndpointInput, UpdateEndpointInput


class EndpointsClient:
    """Client for managing webhook endpoints."""

    def __init__(self, http_client: HttpClient):
        self._http_client = http_client

    def list(self, namespace_id: str, params: Optional[dict] = None) -> Any:
        """
        List all endpoints for a namespace.

        Args:
            namespace_id: The ID of the namespace.
            params: Optional filter and pagination parameters.
        """
        return self._http_client.get(f"/v1/endpoints/{namespace_id}", params=params)

    def get(self, namespace_id: str, endpoint_id: str) -> Endpoint:
        """
        Get a single endpoint by ID.

        Args:
            namespace_id: The ID of the namespace.
            endpoint_id: The ID of the endpoint.
        """
        response = self._http_client.get(f"/v1/endpoints/{namespace_id}/{endpoint_id}")
        return Endpoint(**response.get("data"))

    def create(self, namespace_id: str, data: CreateEndpointInput) -> Endpoint:
        """
        Create a new webhook endpoint.

        Args:
            namespace_id: The ID of the namespace.
            data: Endpoint configuration data.
        """
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.post(f"/v1/endpoints/{namespace_id}", data=payload)
        # Backend returns { "data": { "endpoint": { ... } } }
        endpoint_data = response.get("data", {}).get("endpoint")
        return Endpoint(**endpoint_data)

    def update(
        self, namespace_id: str, endpoint_id: str, data: UpdateEndpointInput
    ) -> Endpoint:
        """
        Update an existing webhook endpoint.

        Args:
            namespace_id: The ID of the namespace.
            endpoint_id: The ID of the endpoint.
            data: Updated endpoint configuration.
        """
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.patch(
            f"/v1/endpoints/{namespace_id}/{endpoint_id}", data=payload
        )
        return Endpoint(**response.get("data"))

    def delete(self, namespace_id: str, endpoint_id: str) -> bool:
        """
        Delete a webhook endpoint.

        Args:
            namespace_id: The ID of the namespace.
            endpoint_id: The ID of the endpoint.
        """
        response = self._http_client.delete(f"/v1/endpoints/{namespace_id}/{endpoint_id}")
        return response.get("success", False)

    def get_secret(self, namespace_id: str, endpoint_id: str) -> str:
        """
        Get the signing secret for an endpoint.

        Args:
            namespace_id: The ID of the namespace.
            endpoint_id: The ID of the endpoint.
        """
        response = self._http_client.get(
            f"/v1/endpoints/{namespace_id}/{endpoint_id}/secret"
        )
        return response.get("data")
