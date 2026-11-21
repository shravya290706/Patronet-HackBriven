"""
Data access repository for Categories.
"""
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session
from app.models.catalog import Category, Product


class CategoryRepository:
    """Repository handling database operations for Categories."""

    @staticmethod
    def get_all_with_counts(db: Session) -> List[Tuple[Category, int]]:
        """
        Retrieve all categories with their respective active product count,
        ordered alphabetically by category name.
        """
        stmt = (
            select(
                Category,
                func.count(
                    case((Product.is_active == True, Product.id), else_=None)
                ).label("product_count"),
            )
            .outerjoin(Product, Product.category_id == Category.id)
            .group_by(Category.id)
            .order_by(Category.name.asc())
        )
        results = db.execute(stmt).all()
        return [(row[0], row[1]) for row in results]

    @staticmethod
    def get_by_id(db: Session, category_id: UUID) -> Optional[Category]:
        """Retrieve a category by its UUID."""
        stmt = select(Category).where(Category.id == category_id)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Category]:
        """Retrieve a category by name (case-insensitive)."""
        stmt = select(Category).where(Category.name.ilike(name.strip()))
        return db.execute(stmt).scalar_one_or_none()
