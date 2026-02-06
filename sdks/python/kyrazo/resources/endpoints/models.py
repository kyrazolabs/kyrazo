from typing import Optional, Dict, Literal
from pydantic import BaseModel, Field, ConfigDict

EndpointStatus = Literal["active", "inactive"]


EndpointMethod = Literal["POST", "PUT", "PATCH"]


class EndpointConfig(BaseModel):
    """Configuration for a webhook endpoint."""
    model_config = ConfigDict(populate_by_name=True)
    timeout: int = Field(..., description="Request timeout in milliseconds.")
    retry_count: int = Field(..., alias="retryCount", description="Number of retry attempts if delivery fails.")
    rate_limit: Optional[int] = Field(None, alias="rateLimit", description="Max requests permitted.")
    rate_limit_duration: int = Field(..., alias="rateLimitDuration", description="Duration for rate limit in seconds.")


class Endpoint(BaseModel):
    """Represents a webhook endpoint."""
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(..., alias="id")
    name: str = Field(..., description="Human-readable name.")
    status: EndpointStatus = Field(..., description="Operational status.")
    url: str = Field(..., description="Destination URL.")
    method: EndpointMethod = Field(..., description="HTTP method for delivery.")
    description: Optional[str] = Field(None, description="Optional description.")
    enabled: bool = Field(..., description="Whether the endpoint is currently enabled.")
    config: EndpointConfig = Field(..., description="Endpoint delivery configuration.")
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders", description="Optional custom headers.")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class CreateEndpointInput(BaseModel):
    """Input for creating a new endpoint."""
    model_config = ConfigDict(populate_by_name=True)
    name: str = Field(..., min_length=3, max_length=100)
    status: EndpointStatus
    url: str
    method: Optional[EndpointMethod] = "POST"
    description: Optional[str] = None
    enabled: Optional[bool] = True
    config: EndpointConfig
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")


class UpdateEndpointInput(BaseModel):
    """Input for updating an existing endpoint."""
    model_config = ConfigDict(populate_by_name=True)
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    status: Optional[EndpointStatus] = None
    url: Optional[str] = None
    method: Optional[EndpointMethod] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    config: Optional[EndpointConfig] = None
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")
