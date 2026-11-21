"""
Pydantic schemas for Categories.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CategorySimple(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class CategoryWithCount(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    product_count: int = Field(
        ..., description="Count of active products in this category"
    )
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
