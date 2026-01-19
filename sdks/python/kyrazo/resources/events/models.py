from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class TargetInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    target_url: str = Field(
        ..., alias="targetUrl", description="The URL to send the webhook to."
    )


class EventMeta(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    priority: Optional[str] = Field(None, pattern="^(low|normal|high|urgent)$")
    max_retries: Optional[int] = Field(None, alias="maxRetries", ge=0, le=10)


class PublishEventBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    webhook_id: str = Field(..., alias="webhookId", min_length=1)
    event_type: str = Field(..., alias="eventType", min_length=1)
    payload: Dict[str, Any] = Field(..., description="The event data payload.")
    targets: List[TargetInput] = Field(..., min_length=1)
    meta: Optional[EventMeta] = None


class PublishEventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    status: str
    event_id: str = Field(..., alias="eventId")
    targets_count: int = Field(..., alias="targetsCount")
    unfound_targets: List[str] = Field(default_factory=list, alias="unfoundTargets")
    queued_at: str = Field(..., alias="queuedAt")
    processing_time_ms: int = Field(..., alias="processingTimeMs")


class BatchPublishEventResponseItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    event_id: str = Field(..., alias="eventId")
    status: str
    targets_count: Optional[int] = Field(None, alias="targetsCount")
    error: Optional[str] = None


class BatchPublishEventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    status: str
    batch_size: int = Field(..., alias="batchSize")
    queued_count: int = Field(..., alias="queuedCount")
    skipped_count: int = Field(..., alias="skippedCount")
    failed_count: int = Field(..., alias="failedCount")
    results: List[BatchPublishEventResponseItem]
    queued_at: str = Field(..., alias="queuedAt")
    processing_time_ms: int = Field(..., alias="processingTimeMs")
