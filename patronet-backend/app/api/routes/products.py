"""
API route definitions for Products.
"""
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.product import ProductDetailResponse, ProductListResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "",
    response_model=ProductListResponse,
    status_code=status.HTTP_200_OK,
    summary="List active products",
    description="Retrieve a paginated list of active products with optional filtering by category, brand, price range, and search keyword.",
)
def list_products(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(
        20, ge=1, le=100, description="Items per page (max 100)"
    ),
    category: Optional[str] = Query(
        None, description="Filter by Category ID or Category Name"
    ),
    brand: Optional[str] = Query(
        None, description="Filter by brand (case-insensitive)"
    ),
    min_price: Optional[Decimal] = Query(
        None, ge=0, description="Minimum price filter"
    ),
    max_price: Optional[Decimal] = Query(
        None, ge=0, description="Maximum price filter"
    ),
    q: Optional[str] = Query(
        None,
        description="Search query across product name, description, and brand",
    ),
    sort: Optional[str] = Query(
        None,
        description="Sort order (price-asc, price-desc, newest, featured)",
    ),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    return ProductService.get_products(
        db=db,
        page=page,
        limit=limit,
        category=category,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        q=q,
        sort=sort,
    )


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product details",
    description="Retrieve complete product details including category, images, specifications, and store inventory availability.",
)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
) -> ProductDetailResponse:
    return ProductService.get_product_by_id(db=db, product_id_raw=product_id)
