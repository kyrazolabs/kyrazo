from typing import Optional, Dict, Literal
from pydantic import BaseModel, Field, ConfigDict

TargetMethod = Literal["POST", "PUT", "PATCH"]


class TargetConfig(BaseModel):
    """Configuration for a webhook target."""
    model_config = ConfigDict(populate_by_name=True)
    timeout: int = Field(..., description="Request timeout in milliseconds.")
    retry_count: int = Field(..., alias="retryCount", description="Number of retry attempts if delivery fails.")
    rate_limit: Optional[int] = Field(None, alias="rateLimit", description="Max requests permitted.")
    rate_limit_duration: int = Field(..., alias="rateLimitDuration", description="Duration for rate limit in seconds.")


class Target(BaseModel):
    """Represents a webhook delivery target."""
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(..., alias="id")
    name: str = Field(..., description="Human-readable name.")
    url: str = Field(..., description="Destination URL.")
    method: TargetMethod = Field(..., description="HTTP method for delivery.")
    description: Optional[str] = Field(None, description="Optional description.")
    enabled: bool = Field(..., description="Whether the target is active.")
    config: TargetConfig = Field(..., description="Target delivery configuration.")
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders", description="Optional custom headers.")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class CreateTargetInput(BaseModel):
    """Input for creating a new target."""
    model_config = ConfigDict(populate_by_name=True)
    name: str = Field(..., min_length=3, max_length=100)
    url: str
    method: Optional[TargetMethod] = "POST"
    description: Optional[str] = None
    enabled: Optional[bool] = True
    config: TargetConfig
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")


class UpdateTargetInput(BaseModel):
    """Input for updating an existing target."""
    model_config = ConfigDict(populate_by_name=True)
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    url: Optional[str] = None
    method: Optional[TargetMethod] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    config: Optional[TargetConfig] = None
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")
