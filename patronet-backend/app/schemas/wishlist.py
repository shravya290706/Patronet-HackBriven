"""
Pydantic data schemas for Customer Wishlist operations.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class WishlistItemAddRequest(BaseModel):
    product_id: UUID = Field(
        ...,
        description="UUID of the active product to add to wishlist",
        examples=["747ee0bf-30e3-599b-8843-ddbe61704ea2"],
    )


class WishlistItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    name: str
    sku: str
    brand: Optional[str] = None
    price: Decimal
    image_url: Optional[str] = None
    added_at: datetime

    class Config:
        from_attributes = True


class WishlistResponse(BaseModel):
    items: List[WishlistItemResponse] = []
    total_items: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
