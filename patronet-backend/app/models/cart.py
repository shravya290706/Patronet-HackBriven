"""
SQLAlchemy models for Shopping Cart and Cart Items.
Maps to pre-existing `carts` and `cart_items` tables in PostgreSQL.
"""
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Cart(Base):
    __tablename__ = "carts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True
    )
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    customer = relationship("Customer")
    items = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
        order_by="CartItem.added_at.asc()",
        lazy="selectin",
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(
        UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False, index=True
    )
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True
    )
    quantity = Column(Integer, nullable=False, default=1)
    negotiated_price = Column(Numeric(10, 2), nullable=True)
    negotiation_id = Column(
        UUID(as_uuid=True), ForeignKey("negotiation_sessions.id"), nullable=True
    )
    added_at = Column(
        DateTime(timezone=True), nullable=False, default=func.now()
    )

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", lazy="joined")
    negotiation = relationship("app.models.negotiation.NegotiationSession", lazy="joined")
