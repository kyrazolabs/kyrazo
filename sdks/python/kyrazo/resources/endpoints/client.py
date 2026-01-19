from typing import List, Optional, Any
from ...core.http_client import HttpClient
from .models import Endpoint, CreateEndpointInput, UpdateEndpointInput


class EndpointsClient:
    def __init__(self, http_client: HttpClient):
        self._http_client = http_client

    def list(self, project_id: str, params: Optional[dict] = None) -> Any:
        return self._http_client.get(f"/v1/endpoints/{project_id}", params=params)

    def get(self, project_id: str, endpoint_id: str) -> Endpoint:
        response = self._http_client.get(f"/v1/endpoints/{project_id}/{endpoint_id}")
        return Endpoint(**response.get("data"))

    def create(self, project_id: str, data: CreateEndpointInput) -> Endpoint:
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.post(f"/v1/endpoints/{project_id}", data=payload)
        return Endpoint(**response.get("data"))

    def update(
        self, project_id: str, endpoint_id: str, data: UpdateEndpointInput
    ) -> Endpoint:
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.patch(
            f"/v1/endpoints/{project_id}/{endpoint_id}", data=payload
        )
        return Endpoint(**response.get("data"))

    def delete(self, project_id: str, endpoint_id: str) -> bool:
        response = self._http_client.delete(f"/v1/endpoints/{project_id}/{endpoint_id}")
        return response.get("success", False)
