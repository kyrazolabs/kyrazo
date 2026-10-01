from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict





class PublishEventBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    event: str = Field(..., min_length=1)
    payload: Dict[str, Any] = Field(..., description="The event data payload.")
    previous: Optional[Any] = None
    targets: List[str] = Field(..., min_length=1)


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
    unfound_targets: List[str] = Field(default_factory=list, alias="unfoundTargets")
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
