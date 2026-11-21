"""
SQLAlchemy models for Product Catalogue, Categories, Stores, and Inventory.
Maps to pre-existing database tables in PostgreSQL.
"""
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.customer import Customer


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False
    )
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    brand = Column(String, nullable=True)
    sku = Column(String, nullable=False, unique=True)
    price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    specifications = Column(JSONB, nullable=False, default=dict)

    # Relationships
    category = relationship("Category", back_populates="products")
    images = relationship(
        "ProductImage",
        back_populates="product",
        order_by="ProductImage.display_order",
        lazy="selectin",
    )
    inventory_items = relationship("Inventory", back_populates="product")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    image_url = Column(Text, nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False)
    display_order = Column(Integer, nullable=False, default=0)

    # Relationships
    product = relationship("Product", back_populates="images")


class Store(Base):
    __tablename__ = "stores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    inventory_items = relationship("Inventory", back_populates="store")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    store_id = Column(
        UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False
    )
    available_stock = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    product = relationship("Product", back_populates="inventory_items")
    store = relationship("Store", back_populates="inventory_items")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    added_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
    )

    # Relationships
    customer = relationship("Customer")
    product = relationship("Product", lazy="joined")
