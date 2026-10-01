from typing import List, TypeVar, Generic, Optional
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")


class PaginationMeta(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    total: int
    page: int
    limit: int
    total_pages: int = Field(..., alias="totalPages")


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(populate_by_name=True)
    data: List[T]
    meta: Optional[PaginationMeta] = None
