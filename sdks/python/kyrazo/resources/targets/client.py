from typing import List, Optional, Any
from ...core.http_client import HttpClient
from .models import Target, CreateTargetInput, UpdateTargetInput


class TargetsClient:
    def __init__(self, http_client: HttpClient):
        self._http_client = http_client

    def list(self, project_id: str, params: Optional[dict] = None) -> Any:
        return self._http_client.get(f"/v1/targets/{project_id}", params=params)

    def get(self, project_id: str, target_id: str) -> Target:
        # Note: Targets usually fetched via list or created, but assuming GET exists via ID
        response = self._http_client.get(f"/v1/targets/{project_id}/{target_id}")
        return Target(**response.get("data"))

    def create(self, project_id: str, data: CreateTargetInput) -> Target:
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.post(f"/v1/targets/{project_id}", data=payload)
        return Target(**response.get("data"))

    def update(
        self, project_id: str, target_id: str, data: UpdateTargetInput
    ) -> Target:
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.patch(
            f"/v1/targets/{project_id}/{target_id}", data=payload
        )
        return Target(**response.get("data"))

    def delete(self, project_id: str, target_id: str) -> bool:
        response = self._http_client.delete(f"/v1/targets/{project_id}/{target_id}")
        return response.get("success", False)
