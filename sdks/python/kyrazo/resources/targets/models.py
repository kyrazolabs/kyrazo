from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict

TargetMethod = Literal["POST", "PUT", "PATCH", "GET", "DELETE"]


class TargetConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    timeout: int
    retry_count: int = Field(..., alias="retryCount")
    rate_limit: Optional[int] = Field(None, alias="rateLimit")
    rate_limit_duration: int = Field(..., alias="rateLimitDuration")


class Target(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(..., alias="_id")
    name: str
    url: str
    method: TargetMethod
    description: Optional[str] = None
    enabled: bool
    config: TargetConfig
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class CreateTargetInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    url: str
    method: Optional[TargetMethod] = "POST"
    description: Optional[str] = None
    enabled: Optional[bool] = True
    config: TargetConfig
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")


class UpdateTargetInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: Optional[str] = None
    url: Optional[str] = None
    method: Optional[TargetMethod] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    config: Optional[TargetConfig] = None
    custom_headers: Optional[Dict[str, str]] = Field(None, alias="customHeaders")
