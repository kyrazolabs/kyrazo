from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict

EndpointStatus = Literal["active", "inactive"]


class EndpointConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    timeout: int
    retry_count: int = Field(..., alias="retryCount")
    rate_limit: Optional[int] = Field(None, alias="rateLimit")
    rate_limit_duration: int = Field(..., alias="rateLimitDuration")


class Endpoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(..., alias="_id")
    name: str
    status: EndpointStatus
    url: str
    description: Optional[str] = None
    enabled: bool
    config: EndpointConfig
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class CreateEndpointInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    status: EndpointStatus
    url: str
    description: Optional[str] = None
    enabled: Optional[bool] = True
    config: EndpointConfig
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")


class UpdateEndpointInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: Optional[str] = None
    status: Optional[EndpointStatus] = None
    url: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    config: Optional[EndpointConfig] = None
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")
