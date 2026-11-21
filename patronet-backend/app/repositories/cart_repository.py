"""
Data access repository for Cart, Cart Items, and Inventory stock checks.
"""
from datetime import datetime, timezone
from typing import Optional
import uuid
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.cart import Cart, CartItem
from app.models.catalog import Inventory


class CartRepository:
    """Repository handling database operations for Carts and Cart Items."""

    @staticmethod
    def get_active_cart_by_customer_id(
        db: Session, customer_id: UUID
    ) -> Optional[Cart]:
        """
        Retrieve customer's active cart with its items.
        """
        stmt = select(Cart).where(
            Cart.customer_id == customer_id,
            Cart.status == "active",
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def create_active_cart(db: Session, customer_id: UUID) -> Cart:
        """
        Create a new persistent active cart for the customer.
        """
        now = datetime.now(timezone.utc)
        cart = Cart(
            id=uuid.uuid4(),
            customer_id=customer_id,
            status="active",
            created_at=now,
            updated_at=now,
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
        return cart

    @classmethod
    def get_or_create_active_cart(cls, db: Session, customer_id: UUID) -> Cart:
        """
        Fetch existing active cart or initialize a new one.
        """
        cart = cls.get_active_cart_by_customer_id(db, customer_id)
        if not cart:
            cart = cls.create_active_cart(db, customer_id)
        return cart

    @staticmethod
    def get_cart_item(
        db: Session, cart_id: UUID, product_id: UUID
    ) -> Optional[CartItem]:
        """
        Retrieve a specific cart item by cart_id and product_id.
        """
        stmt = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id,
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def add_item(
        db: Session,
        cart: Cart,
        product_id: UUID,
        quantity: int,
        negotiated_price: Optional[object] = None,
        negotiation_id: Optional[UUID] = None,
    ) -> CartItem:
        """
        Insert a new item row into the customer's cart.
        """
        now = datetime.now(timezone.utc)
        item = CartItem(
            id=uuid.uuid4(),
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
            negotiated_price=negotiated_price,
            negotiation_id=negotiation_id,
            added_at=now,
        )
        cart.updated_at = now
        db.add(item)
        db.commit()
        db.refresh(item)
        db.refresh(cart)
        return item

    @staticmethod
    def increment_item_quantity(
        db: Session, cart: Cart, item: CartItem, additional_quantity: int
    ) -> CartItem:
        """
        Increment the quantity of an existing item in the cart.
        """
        now = datetime.now(timezone.utc)
        item.quantity += additional_quantity
        cart.updated_at = now
        db.commit()
        db.refresh(item)
        db.refresh(cart)
        return item

    @staticmethod
    def update_item_quantity(
        db: Session, cart: Cart, item: CartItem, new_quantity: int
    ) -> CartItem:
        """
        Set a new quantity for an existing item in the cart.
        """
        now = datetime.now(timezone.utc)
        item.quantity = new_quantity
        cart.updated_at = now
        db.commit()
        db.refresh(item)
        db.refresh(cart)
        return item

    @staticmethod
    def remove_cart_item(db: Session, cart: Cart, item: CartItem) -> None:
        """
        Delete a single item from the cart.
        """
        now = datetime.now(timezone.utc)
        cart.updated_at = now
        db.delete(item)
        db.commit()
        db.refresh(cart)

    @staticmethod
    def clear_cart(db: Session, cart: Cart) -> int:
        """
        Remove all items from the cart without deleting the cart record itself.
        """
        now = datetime.now(timezone.utc)
        cart.updated_at = now
        deleted = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id)
            .delete(synchronize_session="fetch")
        )
        db.commit()
        db.refresh(cart)
        return deleted

    @staticmethod
    def get_product_total_stock(db: Session, product_id: UUID) -> int:
        """
        Calculate total available stock across all stores for a product.
        """
        stmt = select(
            func.coalesce(func.sum(Inventory.available_stock), 0)
        ).where(Inventory.product_id == product_id)
        result = db.execute(stmt).scalar()
        return int(result or 0)
