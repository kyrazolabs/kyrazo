from typing import List, Optional
from ...core.http_client import HttpClient
from .models import PublishEventBody, PublishEventResponse, BatchPublishEventResponse


class EventsClient:
    def __init__(self, http_client: HttpClient):
        self._http_client = http_client

    def publish(
        self,
        namespace_id: str,
        body: PublishEventBody,
        idempotency_key: Optional[str] = None,
    ) -> PublishEventResponse:
        """
        Publish a single event.

        Args:
            namespace_id: The namespace ID.
            body: The event data (validated by Pydantic model).
            idempotency_key: Optional key for idempotency.
        """
        headers = {}
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        # Dump model to dict, using aliases (camelCase) for the API
        data = body.model_dump(by_alias=True, exclude_none=True)

        response_data = self._http_client.post(
            f"/v1/events/{namespace_id}/publish", data=data, headers=headers
        )
        return PublishEventResponse(**response_data)

    def batch(
        self,
        namespace_id: str,
        events: List[PublishEventBody],
        idempotency_key: Optional[str] = None,
    ) -> BatchPublishEventResponse:
        """
        Publish a batch of events.
        """
        headers = {}
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        data = [evt.model_dump(by_alias=True, exclude_none=True) for evt in events]

        response_data = self._http_client.post(
            f"/v1/events/{namespace_id}/publish/batch", data=data, headers=headers
        )
        return BatchPublishEventResponse(**response_data)
