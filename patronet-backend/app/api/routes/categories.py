"""
API route definitions for Categories.
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.category import CategoryWithCount
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get(
    "",
    response_model=List[CategoryWithCount],
    status_code=status.HTTP_200_OK,
    summary="List all categories",
    description="Retrieve all product categories with their respective active product counts.",
)
def list_categories(
    db: Session = Depends(get_db),
) -> List[CategoryWithCount]:
    return CategoryService.get_all_categories(db=db)
