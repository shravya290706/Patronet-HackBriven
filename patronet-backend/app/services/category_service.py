"""
Business logic service for Categories.
"""
from typing import List
from sqlalchemy.orm import Session
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryWithCount


class CategoryService:
    """Service handling business logic for Categories."""

    @staticmethod
    def get_all_categories(db: Session) -> List[CategoryWithCount]:
        """
        Retrieve all categories with their active product counts.
        """
        results = CategoryRepository.get_all_with_counts(db)
        return [
            CategoryWithCount(
                id=cat.id,
                name=cat.name,
                description=cat.description,
                product_count=count,
                created_at=cat.created_at,
            )
            for cat, count in results
        ]
