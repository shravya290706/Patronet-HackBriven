"""
Data access repository for Products, Images, and Inventory.
"""
from decimal import Decimal
from typing import Any, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.catalog import Category, Inventory, Product, ProductImage, Store


class ProductRepository:
    """Repository handling database operations for Products and Inventory."""

    @staticmethod
    def _build_filters(
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        q: Optional[str] = None,
    ) -> List[Any]:
        """Build SQLAlchemy filter criteria for active products."""
        filters = [Product.is_active == True]

        if category:
            cat_str = category.strip()
            try:
                cat_uuid = UUID(cat_str)
                filters.append(Product.category_id == cat_uuid)
            except ValueError:
                filters.append(Category.name.ilike(cat_str))

        if brand:
            brand_str = brand.strip()
            filters.append(Product.brand.ilike(brand_str))

        if min_price is not None:
            filters.append(Product.price >= min_price)

        if max_price is not None:
            filters.append(Product.price <= max_price)

        if q:
            search_term = f"%{q.strip()}%"
            filters.append(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.brand.ilike(search_term),
                    Product.sku.ilike(search_term),
                )
            )

        return filters

    @classmethod
    def get_products(
        cls,
        db: Session,
        page: int,
        limit: int,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        q: Optional[str] = None,
        sort: Optional[str] = None,
    ) -> List[Tuple[Product, Category, Optional[str]]]:
        """
        Query active products with category and primary image,
        with optional filters, sorting, and pagination.
        """
        filters = cls._build_filters(
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            q=q,
        )

        offset = (page - 1) * limit

        order_by_clause = [Product.name.asc(), Product.id.asc()]
        if sort in ("price-asc", "price_asc"):
            order_by_clause = [Product.price.asc(), Product.name.asc()]
        elif sort in ("price-desc", "price_desc"):
            order_by_clause = [Product.price.desc(), Product.name.asc()]
        elif sort in ("newest", "created_at_desc"):
            order_by_clause = [Product.created_at.desc(), Product.name.asc()]

        stmt = (
            select(
                Product,
                Category,
                ProductImage.image_url.label("primary_image_url"),
            )
            .join(Category, Product.category_id == Category.id)
            .outerjoin(
                ProductImage,
                and_(
                    ProductImage.product_id == Product.id,
                    ProductImage.is_primary == True,
                ),
            )
            .where(*filters)
            .order_by(*order_by_clause)
            .offset(offset)
            .limit(limit)
        )

        results = db.execute(stmt).all()
        return [(row[0], row[1], row[2]) for row in results]

    @classmethod
    def count_products(
        cls,
        db: Session,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        q: Optional[str] = None,
    ) -> int:
        """Count total active products matching the filter criteria."""
        filters = cls._build_filters(
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            q=q,
        )

        stmt = (
            select(func.count(Product.id))
            .join(Category, Product.category_id == Category.id)
            .where(*filters)
        )

        total = db.execute(stmt).scalar()
        return total or 0

    @staticmethod
    def get_by_id(db: Session, product_id: UUID) -> Optional[Product]:
        """
        Retrieve a single product by UUID with category and all images eagerly loaded.
        """
        stmt = (
            select(Product)
            .options(
                joinedload(Product.category),
                selectinload(Product.images),
            )
            .where(Product.id == product_id)
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_inventory_by_product_id(
        db: Session, product_id: UUID
    ) -> List[Tuple[Inventory, Store]]:
        """
        Retrieve inventory availability joined with store details for a product.
        """
        stmt = (
            select(Inventory, Store)
            .join(Store, Store.id == Inventory.store_id)
            .where(Inventory.product_id == product_id)
            .order_by(Store.name.asc())
        )
        results = db.execute(stmt).all()
        return [(row[0], row[1]) for row in results]
