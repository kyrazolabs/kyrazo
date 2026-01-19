from typing import List, Optional, Any
from ...core.http_client import HttpClient
from .models import Source, CreateSourceInput, UpdateSourceInput


class SourcesClient:
    def __init__(self, http_client: HttpClient):
        self._http_client = http_client

    def list(self, project_id: str, params: Optional[dict] = None) -> Any:
        # Returns paginated response; simpler to return raw dict or generic model
        return self._http_client.get(f"/v1/sources/{project_id}", params=params)

    def get(self, project_id: str, source_id: str) -> Source:
        response = self._http_client.get(f"/v1/sources/{project_id}/{source_id}")
        return Source(**response.get("data"))

    def create(self, project_id: str, data: CreateSourceInput) -> Source:
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.post(f"/v1/sources/{project_id}", data=payload)
        return Source(**response.get("data"))

    def update(
        self, project_id: str, source_id: str, data: UpdateSourceInput
    ) -> Source:
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.patch(
            f"/v1/sources/{project_id}/{source_id}", data=payload
        )
        return Source(**response.get("data"))

    def delete(self, project_id: str, source_id: str) -> bool:
        response = self._http_client.delete(f"/v1/sources/{project_id}/{source_id}")
        return response.get("success", False)
