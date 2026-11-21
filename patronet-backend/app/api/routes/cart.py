"""
API route definitions for Customer Shopping Cart operations.
All routes require valid JWT bearer authentication.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemUpdateRequest,
    CartResponse,
)
from app.services.auth_service import get_current_user
from app.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Get customer cart",
    description="Retrieve the authenticated customer's shopping cart and its items with live prices and subtotals.",
)
def get_my_cart(
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    return CartService.get_cart(db=db, customer=current_user)


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Add item to cart",
    description="Add a product to the cart, or increment quantity if already in cart. Validates available stock.",
)
def add_item_to_cart(
    req: CartItemAddRequest,
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    return CartService.add_item_to_cart(db=db, customer=current_user, req=req)


@router.patch(
    "/items/{product_id}",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Update cart item quantity",
    description="Update the quantity of an existing item in the customer's cart. Validates available stock.",
)
def update_item_quantity(
    product_id: UUID,
    req: CartItemUpdateRequest,
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    return CartService.update_item_quantity(
        db=db, customer=current_user, product_id=product_id, req=req
    )


@router.delete(
    "/items/{product_id}",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove item from cart",
    description="Remove a specific product from the customer's cart. Returns updated cart.",
)
def remove_item_from_cart(
    product_id: UUID,
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    return CartService.remove_item(
        db=db, customer=current_user, product_id=product_id
    )


@router.delete(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Clear all items from cart",
    description="Clear all items from the customer's cart while keeping the cart record active.",
)
def clear_my_cart(
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartResponse:
    return CartService.clear_cart(db=db, customer=current_user)
