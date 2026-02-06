from typing import Optional, Any
from ...core.http_client import HttpClient
from .models import Target, CreateTargetInput, UpdateTargetInput


class TargetsClient:
    """Client for managing webhook delivery targets."""

    def __init__(self, http_client: HttpClient):
        self._http_client = http_client

    def list(self, project_id: str, params: Optional[dict] = None) -> Any:
        """
        List all targets for a project.

        Args:
            project_id: The ID of the project.
            params: Optional filter and pagination parameters.
        """
        return self._http_client.get(f"/v1/targets/{project_id}", params=params)

    def get(self, project_id: str, target_id: str) -> Target:
        """
        Get a single target by ID.

        Args:
            project_id: The ID of the project.
            target_id: The ID of the target.
        """
        response = self._http_client.get(f"/v1/targets/{project_id}/{target_id}")
        return Target(**response.get("data"))

    def create(self, project_id: str, data: CreateTargetInput) -> Target:
        """
        Create a new delivery target.

        Args:
            project_id: The ID of the project.
            data: Target configuration data.
        """
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.post(f"/v1/targets/{project_id}", data=payload)
        return Target(**response.get("data"))

    def update(
        self, project_id: str, target_id: str, data: UpdateTargetInput
    ) -> Target:
        """
        Update an existing delivery target.

        Args:
            project_id: The ID of the project.
            target_id: The ID of the target.
            data: Updated target configuration.
        """
        payload = data.model_dump(by_alias=True, exclude_none=True)
        response = self._http_client.patch(
            f"/v1/targets/{project_id}/{target_id}", data=payload
        )
        return Target(**response.get("data"))

    def delete(self, project_id: str, target_id: str) -> bool:
        """
        Delete a delivery target.

        Args:
            project_id: The ID of the project.
            target_id: The ID of the target.
        """
        response = self._http_client.delete(f"/v1/targets/{project_id}/{target_id}")
        return response.get("success", False)

    def get_secret(self, project_id: str, target_id: str) -> str:
        """
        Get the signing secret for a target.

        Args:
            project_id: The ID of the project.
            target_id: The ID of the target.
        """
        response = self._http_client.get(f"/v1/targets/{project_id}/{target_id}/secret")
        return response.get("data")

    def update_status(self, project_id: str, target_id: str, enabled: bool) -> Target:
        """
        Enable or disable a target.

        Args:
            project_id: The ID of the project.
            target_id: The ID of the target.
            enabled: Whether the target should be enabled.
        """
        response = self._http_client.put(
            f"/v1/targets/{project_id}/{target_id}",
            data={"targetId": target_id, "enabled": enabled},
        )
        return Target(**response.get("data"))
