"""
Data access repository for Wishlist Items in PostgreSQL.
Maps to pre-existing `wishlist_items` table.
"""
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import and_, delete, select
from sqlalchemy.orm import Session
from app.models.catalog import WishlistItem


class WishlistRepository:
    """Repository handling database operations for Customer Wishlists."""

    @staticmethod
    def get_customer_wishlist(db: Session, customer_id: UUID) -> List[WishlistItem]:
        """
        Query all wishlist items for a customer ordered by added_at descending.
        """
        stmt = (
            select(WishlistItem)
            .where(WishlistItem.customer_id == customer_id)
            .order_by(WishlistItem.added_at.desc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_item(
        db: Session, customer_id: UUID, product_id: UUID
    ) -> Optional[WishlistItem]:
        """
        Query a single wishlist item by customer_id and product_id.
        """
        stmt = select(WishlistItem).where(
            and_(
                WishlistItem.customer_id == customer_id,
                WishlistItem.product_id == product_id,
            )
        )
        return db.scalars(stmt).first()

    @staticmethod
    def add_item(db: Session, customer_id: UUID, product_id: UUID) -> WishlistItem:
        """
        Add a product to the customer's wishlist idempotently.
        If already present, returns existing item without duplicate violation.
        """
        existing = WishlistRepository.get_item(db, customer_id, product_id)
        if existing:
            return existing

        item = WishlistItem(
            id=uuid4(),
            customer_id=customer_id,
            product_id=product_id,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def remove_item(db: Session, customer_id: UUID, product_id: UUID) -> bool:
        """
        Remove a product from the customer's wishlist.
        Returns True if item existed and was deleted, False otherwise.
        """
        item = WishlistRepository.get_item(db, customer_id, product_id)
        if not item:
            return False

        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def clear_wishlist(db: Session, customer_id: UUID) -> int:
        """
        Remove all wishlist items belonging to the customer.
        Returns the number of removed items.
        """
        stmt = delete(WishlistItem).where(WishlistItem.customer_id == customer_id)
        result = db.execute(stmt)
        db.commit()
        return result.rowcount or 0
