"""
Business logic service for Cart operations (Get, Add, Update, Remove, Clear).
"""
from decimal import Decimal
import logging
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.cart import Cart
from app.models.customer import Customer
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemResponse,
    CartItemUpdateRequest,
    CartResponse,
)

logger = logging.getLogger(__name__)


class CartService:
    """Service handling business rules, stock validation, and response formatting for Carts."""

    @staticmethod
    def format_cart_response(cart: Cart) -> CartResponse:
        """
        Format a Cart model instance into a standard CartResponse schema.
        Calculates prices, subtotals, item counts, and cart total with Decimal precision.
        """
        item_responses = []
        total_quantity = 0
        cart_total = Decimal("0.00")

        for item in cart.items:
            product = item.product
            # Handle inactive or deleted products gracefully
            if not product:
                continue

            # Determine primary image URL if available
            image_url = None
            if product.images:
                primary = next((img for img in product.images if img.is_primary), None)
                image_url = primary.image_url if primary else product.images[0].image_url

            price = Decimal(str(product.price)).quantize(Decimal("0.01"))
            subtotal = (price * item.quantity).quantize(Decimal("0.01"))
            total_quantity += item.quantity
            cart_total += subtotal

            item_responses.append(
                CartItemResponse(
                    product_id=product.id,
                    name=product.name,
                    sku=product.sku,
                    brand=product.brand,
                    image_url=image_url,
                    price=price,
                    quantity=item.quantity,
                    subtotal=subtotal,
                )
            )

        return CartResponse(
            cart_id=cart.id,
            status=cart.status,
            items=item_responses,
            total_items=len(item_responses),
            total_quantity=total_quantity,
            cart_total=cart_total.quantize(Decimal("0.01")),
        )

    @classmethod
    def get_cart(cls, db: Session, customer: Customer) -> CartResponse:
        """
        Retrieve the authenticated customer's cart.
        """
        cart = CartRepository.get_or_create_active_cart(db, customer.id)
        return cls.format_cart_response(cart)

    @classmethod
    def add_item_to_cart(
        cls, db: Session, customer: Customer, req: CartItemAddRequest
    ) -> CartResponse:
        """
        Add a product to the customer's cart, or increment quantity if already present.
        Validates product existence, active status, and inventory stock.
        """
        product = ProductRepository.get_by_id(db, req.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{req.product_id}' not found.",
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add inactive product to cart.",
            )

        total_stock = CartRepository.get_product_total_stock(db, product.id)
        if total_stock <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is currently out of stock.",
            )

        cart = CartRepository.get_or_create_active_cart(db, customer.id)
        existing_item = CartRepository.get_cart_item(db, cart.id, product.id)

        target_quantity = (existing_item.quantity + req.quantity) if existing_item else req.quantity
        if target_quantity > total_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested total quantity ({target_quantity}) exceeds available stock ({total_stock}).",
            )

        if existing_item:
            CartRepository.increment_item_quantity(db, cart, existing_item, req.quantity)
        else:
            CartRepository.add_item(db, cart, product.id, req.quantity)

        # Refresh cart to reflect new items
        db.expire(cart, ["items"])
        return cls.format_cart_response(cart)

    @classmethod
    def update_item_quantity(
        cls,
        db: Session,
        customer: Customer,
        product_id: UUID,
        req: CartItemUpdateRequest,
    ) -> CartResponse:
        """
        Update the quantity of an existing item in the customer's cart.
        Validates product existence, active status, and inventory stock.
        """
        product = ProductRepository.get_by_id(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' not found.",
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update inactive product in cart.",
            )

        cart = CartRepository.get_or_create_active_cart(db, customer.id)
        item = CartRepository.get_cart_item(db, cart.id, product_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' is not in your cart.",
            )

        total_stock = CartRepository.get_product_total_stock(db, product_id)
        if req.quantity > total_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity ({req.quantity}) exceeds available stock ({total_stock}).",
            )

        CartRepository.update_item_quantity(db, cart, item, req.quantity)
        db.expire(cart, ["items"])
        return cls.format_cart_response(cart)

    @classmethod
    def remove_item(
        cls, db: Session, customer: Customer, product_id: UUID
    ) -> CartResponse:
        """
        Remove a specific product from the customer's cart.
        """
        cart = CartRepository.get_or_create_active_cart(db, customer.id)
        item = CartRepository.get_cart_item(db, cart.id, product_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' is not in your cart.",
            )

        CartRepository.remove_cart_item(db, cart, item)
        db.expire(cart, ["items"])
        return cls.format_cart_response(cart)

    @classmethod
    def clear_cart(cls, db: Session, customer: Customer) -> CartResponse:
        """
        Clear all items from the customer's cart. The cart record remains active.
        """
        cart = CartRepository.get_or_create_active_cart(db, customer.id)
        CartRepository.clear_cart(db, cart)
        db.expire(cart, ["items"])
        return cls.format_cart_response(cart)
