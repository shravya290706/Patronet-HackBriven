"""
Pydantic schemas for Products, Images, Inventory, and Pagination.
"""
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.category import CategorySimple


class ProductImageResponse(BaseModel):
    id: UUID
    image_url: str
    is_primary: bool
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class InventoryAvailability(BaseModel):
    store_id: UUID
    store_name: str
    city: str
    state: str
    pincode: str
    available_stock: int
    is_in_stock: bool

    model_config = ConfigDict(from_attributes=True)


class ProductListItem(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    sku: str
    price: Decimal
    is_active: bool
    category: Optional[CategorySimple] = None
    primary_image_url: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaginationMetadata(BaseModel):
    total: int = Field(..., description="Total number of matching active products")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether a next page exists")
    has_prev: bool = Field(..., description="Whether a previous page exists")


class ProductListResponse(BaseModel):
    items: List[ProductListItem]
    pagination: PaginationMetadata


class ProductDetailResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    sku: str
    price: Decimal
    is_active: bool
    category: Optional[CategorySimple] = None
    specifications: Dict[str, Any]
    images: List[ProductImageResponse]
    inventory: List[InventoryAvailability]
    total_stock: int = Field(
        ..., description="Total stock aggregated across all stores"
    )
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
