"""
API route definitions for Customer Wishlist operations.
All routes require valid JWT bearer authentication.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.wishlist import (
    WishlistItemAddRequest,
    WishlistResponse,
)
from app.services.auth_service import get_current_user
from app.services.wishlist_service import WishlistService

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get(
    "",
    response_model=WishlistResponse,
    status_code=status.HTTP_200_OK,
    summary="Get customer wishlist",
    description="Retrieve the authenticated customer's wishlist items with product details and prices.",
)
def get_my_wishlist(
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistResponse:
    return WishlistService.get_wishlist(db=db, customer=current_user)


@router.post(
    "/items",
    response_model=WishlistResponse,
    status_code=status.HTTP_200_OK,
    summary="Add item to wishlist",
    description="Add a product to the authenticated customer's wishlist. Operation is idempotent.",
)
def add_item_to_wishlist(
    req: WishlistItemAddRequest,
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistResponse:
    return WishlistService.add_item_to_wishlist(
        db=db, customer=current_user, req=req
    )


@router.delete(
    "/items/{product_id}",
    response_model=WishlistResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove item from wishlist",
    description="Remove a specific product from the customer's wishlist. Returns updated wishlist.",
)
def remove_item_from_wishlist(
    product_id: UUID,
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistResponse:
    return WishlistService.remove_item(
        db=db, customer=current_user, product_id=product_id
    )


@router.delete(
    "",
    response_model=WishlistResponse,
    status_code=status.HTTP_200_OK,
    summary="Clear all items from wishlist",
    description="Clear all items from the customer's wishlist.",
)
def clear_my_wishlist(
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistResponse:
    return WishlistService.clear_wishlist(db=db, customer=current_user)
