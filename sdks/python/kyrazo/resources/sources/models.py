from typing import List, Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field, ConfigDict

SourceService = Literal["stripe", "paypal"]
SourceStatus = Literal["active", "inactive"]
SourceType = Literal["receive", "publish", "forward"]
SourceAuthType = Literal["service", "api_key", "basic_auth"]


class SourceRetryPolicy(BaseModel):
    max_attempts: int = Field(..., alias="maxAttempts", ge=1, le=10)


class SourceAuthentication(BaseModel):
    enabled: bool
    type: Optional[SourceAuthType] = None
    service: Optional[Dict[str, str]] = None
    basic_auth: Optional[Dict[str, str]] = Field(None, alias="basicAuth")
    api_key: Optional[Dict[str, str]] = Field(None, alias="apiKey")


class Source(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str] = None
    type: SourceType
    service: SourceService
    status: SourceStatus
    forwarding: bool
    endpoints: Optional[List[str]] = None
    event_types: List[str] = Field(..., alias="eventTypes")
    retry_policy: Optional[SourceRetryPolicy] = Field(None, alias="retryPolicy")
    authentication: Optional[SourceAuthentication] = None
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class CreateSourceInput(BaseModel):
    name: str
    description: Optional[str] = None
    type: Optional[SourceType] = "receive"
    service: SourceService
    status: Optional[SourceStatus] = "active"
    forwarding: Optional[bool] = False
    endpoints: Optional[List[str]] = None
    event_types: Optional[List[str]] = Field(None, alias="eventTypes")
    retry_policy: Optional[SourceRetryPolicy] = Field(None, alias="retryPolicy")
    authentication: Optional[SourceAuthentication] = None


class UpdateSourceInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[SourceStatus] = None
    forwarding: Optional[bool] = None
    endpoints: Optional[List[str]] = None
    event_types: Optional[List[str]] = Field(None, alias="eventTypes")
    retry_policy: Optional[SourceRetryPolicy] = Field(None, alias="retryPolicy")
