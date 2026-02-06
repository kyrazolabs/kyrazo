from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

SourceService = Literal["stripe", "paypal"]
SourceStatus = Literal["active", "inactive"]
SourceAuthType = Literal["service"]


class SourceRetryPolicy(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    max_attempts: int = Field(..., alias="maxAttempts", ge=1, le=10)


class SourceAuthService(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    secret: str


class SourceAuthentication(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    enabled: bool
    type: Optional[SourceAuthType] = None
    service: Optional[SourceAuthService] = None


class Source(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str] = None
    service: SourceService
    status: SourceStatus
    forwarding: bool
    endpoints: Optional[List[str]] = None
    event_types: List[str] = Field(..., alias="eventTypes")
    retry_policy: Optional[SourceRetryPolicy] = Field(None, alias="retryPolicy")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class CreateSourceInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    description: Optional[str] = None
    service: SourceService
    status: Optional[SourceStatus] = "active"
    forwarding: Optional[bool] = False
    endpoints: Optional[List[str]] = None
    event_types: Optional[List[str]] = Field(None, alias="eventTypes")
    retry_policy: Optional[SourceRetryPolicy] = Field(None, alias="retryPolicy")
    authentication: Optional[SourceAuthentication] = None


class UpdateSourceInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[SourceStatus] = None
    forwarding: Optional[bool] = None
    endpoints: Optional[List[str]] = None
    event_types: Optional[List[str]] = Field(None, alias="eventTypes")
    retry_policy: Optional[SourceRetryPolicy] = Field(None, alias="retryPolicy")
