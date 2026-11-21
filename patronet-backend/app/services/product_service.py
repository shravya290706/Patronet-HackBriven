"""
Business logic service for Products and Inventory.
"""
import logging
import math
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.product_repository import ProductRepository
from app.schemas.category import CategorySimple
from app.schemas.product import (
    InventoryAvailability,
    PaginationMetadata,
    ProductDetailResponse,
    ProductImageResponse,
    ProductListItem,
    ProductListResponse,
)

logger = logging.getLogger("patronet.product_service")


class ProductService:
    """Service handling business logic for Products."""

    @staticmethod
    def get_products(
        db: Session,
        page: int = 1,
        limit: int = 20,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        q: Optional[str] = None,
        sort: Optional[str] = None,
    ) -> ProductListResponse:
        """
        Retrieve a paginated list of active products with optional filters.
        When search query 'q' is provided, attempts full-text search via OpenSearch
        with relevance scoring, and seamlessly falls back to PostgreSQL if unavailable.
        """
        if min_price is not None and max_price is not None and min_price > max_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="min_price cannot be greater than max_price",
            )

        # 1. If search query q is provided, query OpenSearch first
        if q and q.strip():
            try:
                from app.services.search_indexer import SearchIndexerService
                search_res = SearchIndexerService.search_products(
                    query=q.strip(),
                    category=category,
                    brand=brand,
                    min_price=min_price,
                    max_price=max_price,
                    sort=sort,
                    page=page,
                    limit=limit,
                )
                items: List[ProductListItem] = []
                for hit in search_res.hits:
                    item_dt = None
                    if getattr(hit, "created_at", None):
                        try:
                            item_dt = datetime.fromisoformat(hit.created_at)
                        except Exception:
                            item_dt = None
                    if not item_dt:
                        item_dt = datetime.utcnow()

                    items.append(
                        ProductListItem(
                            id=UUID(hit.product_id),
                            name=hit.name,
                            description=hit.description,
                            brand=hit.brand,
                            sku=hit.sku,
                            price=Decimal(str(hit.price)),
                            is_active=True,
                            category=(
                                CategorySimple(
                                    id=UUID(hit.category_id)
                                    if hit.category_id
                                    else UUID("00000000-0000-0000-0000-000000000000"),
                                    name=hit.category_name or "",
                                )
                                if hit.category_name
                                else None
                            ),
                            primary_image_url=hit.primary_image_url,
                            created_at=item_dt,
                        )
                    )
                total = search_res.total_hits
                total_pages = math.ceil(total / limit) if total > 0 else 0
                return ProductListResponse(
                    items=items,
                    pagination=PaginationMetadata(
                        total=total,
                        page=page,
                        limit=limit,
                        total_pages=total_pages,
                        has_next=page < total_pages,
                        has_prev=page > 1 and total > 0,
                    ),
                )
            except Exception as exc:
                logger.warning(
                    "OpenSearch search query failed (%s: %s); gracefully falling back to PostgreSQL search",
                    type(exc).__name__,
                    exc,
                )

        # 2. Catalogue browsing or OpenSearch fallback: Query PostgreSQL directly
        total = ProductRepository.count_products(
            db=db,
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            q=q,
        )

        rows = ProductRepository.get_products(
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

        items = [
            ProductListItem(
                id=prod.id,
                name=prod.name,
                description=prod.description,
                brand=prod.brand,
                sku=prod.sku,
                price=prod.price,
                is_active=prod.is_active,
                category=CategorySimple(id=cat.id, name=cat.name) if cat else None,
                primary_image_url=img_url,
                created_at=prod.created_at,
            )
            for prod, cat, img_url in rows
        ]

        total_pages = math.ceil(total / limit) if total > 0 else 0
        has_next = page < total_pages
        has_prev = page > 1 and total > 0

        pagination = PaginationMetadata(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev,
        )

        return ProductListResponse(items=items, pagination=pagination)

    @staticmethod
    def get_product_by_id(
        db: Session, product_id_raw: str
    ) -> ProductDetailResponse:
        """
        Retrieve complete product details including category, images,
        specifications, and inventory availability across stores.
        """
        try:
            product_uuid = UUID(product_id_raw.strip())
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product ID format. Must be a valid UUID.",
            )

        product = ProductRepository.get_by_id(db, product_uuid)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id_raw}' not found.",
            )

        # Inventory availability across stores
        inv_rows = ProductRepository.get_inventory_by_product_id(
            db, product_uuid
        )
        inventory = [
            InventoryAvailability(
                store_id=store.id,
                store_name=store.name,
                city=store.city,
                state=store.state,
                pincode=store.pincode,
                available_stock=inv.available_stock,
                is_in_stock=inv.available_stock > 0,
            )
            for inv, store in inv_rows
        ]
        total_stock = sum(item.available_stock for item in inventory)

        # Images
        images = [
            ProductImageResponse(
                id=img.id,
                image_url=img.image_url,
                is_primary=img.is_primary,
                display_order=img.display_order,
            )
            for img in product.images
        ]

        # Category
        category = (
            CategorySimple(id=product.category.id, name=product.category.name)
            if product.category
            else None
        )

        return ProductDetailResponse(
            id=product.id,
            name=product.name,
            description=product.description,
            brand=product.brand,
            sku=product.sku,
            price=product.price,
            is_active=product.is_active,
            category=category,
            specifications=product.specifications or {},
            images=images,
            inventory=inventory,
            total_stock=total_stock,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )
