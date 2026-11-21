"""
Pydantic data schemas for Shopping Cart and Cart Items.
"""
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class CartItemAddRequest(BaseModel):
    product_id: UUID = Field(
        ...,
        description="UUID of the active product to add to cart",
        examples=["747ee0bf-30e3-599b-8843-ddbe61704ea2"],
    )
    quantity: int = Field(
        ...,
        gt=0,
        description="Quantity of product to add (must be at least 1)",
        examples=[1],
    )


class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(
        ...,
        gt=0,
        description="New quantity for the item in cart (must be at least 1)",
        examples=[3],
    )


class CartItemResponse(BaseModel):
    product_id: UUID
    name: str
    sku: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    price: Decimal
    quantity: int
    subtotal: Decimal

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    cart_id: Optional[UUID] = None
    status: str = "active"
    items: List[CartItemResponse] = []
    total_items: int = 0
    total_quantity: int = 0
    cart_total: Decimal = Decimal("0.00")

    class Config:
        from_attributes = True
