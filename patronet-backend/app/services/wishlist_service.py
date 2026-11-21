"""
Business logic service for Customer Wishlist operations (Get, Add, Remove, Clear).
"""
from decimal import Decimal
import logging
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.catalog import WishlistItem
from app.models.customer import Customer
from app.repositories.product_repository import ProductRepository
from app.repositories.wishlist_repository import WishlistRepository
from app.schemas.wishlist import (
    WishlistItemAddRequest,
    WishlistItemResponse,
    WishlistResponse,
)

logger = logging.getLogger(__name__)


class WishlistService:
    """Service handling business rules, validation, and response formatting for Wishlists."""

    @staticmethod
    def format_wishlist_response(items: list[WishlistItem]) -> WishlistResponse:
        """
        Format a list of WishlistItem model instances into a standard WishlistResponse schema.
        Includes product specifications, brand, price, and image.
        """
        item_responses = []
        for item in items:
            product = item.product
            if not product or not product.is_active:
                continue

            image_url = None
            if product.images:
                primary = next((img for img in product.images if img.is_primary), None)
                image_url = primary.image_url if primary else product.images[0].image_url

            price = Decimal(str(product.price)).quantize(Decimal("0.01"))

            item_responses.append(
                WishlistItemResponse(
                    id=item.id,
                    product_id=product.id,
                    name=product.name,
                    sku=product.sku,
                    brand=product.brand,
                    price=price,
                    image_url=image_url,
                    added_at=item.added_at,
                )
            )

        return WishlistResponse(
            items=item_responses,
            total_items=len(item_responses),
        )

    @classmethod
    def get_wishlist(cls, db: Session, customer: Customer) -> WishlistResponse:
        """
        Retrieve the authenticated customer's wishlist.
        """
        items = WishlistRepository.get_customer_wishlist(db, customer.id)
        return cls.format_wishlist_response(items)

    @classmethod
    def add_item_to_wishlist(
        cls, db: Session, customer: Customer, req: WishlistItemAddRequest
    ) -> WishlistResponse:
        """
        Add a product to the customer's wishlist.
        Validates product existence and active status.
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
                detail=f"Product '{product.name}' is inactive and cannot be wishlisted.",
            )

        WishlistRepository.add_item(db, customer.id, req.product_id)
        return cls.get_wishlist(db, customer)

    @classmethod
    def remove_item(
        cls, db: Session, customer: Customer, product_id: UUID
    ) -> WishlistResponse:
        """
        Remove a product from the customer's wishlist.
        Raises 404 if item is not found in customer's wishlist.
        """
        deleted = WishlistRepository.remove_item(db, customer.id, product_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' is not in your wishlist.",
            )

        return cls.get_wishlist(db, customer)

    @classmethod
    def clear_wishlist(cls, db: Session, customer: Customer) -> WishlistResponse:
        """
        Clear all products from the authenticated customer's wishlist.
        """
        WishlistRepository.clear_wishlist(db, customer.id)
        return WishlistResponse(items=[], total_items=0)
