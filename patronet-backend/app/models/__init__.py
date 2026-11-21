"""
Database models package (ORM entities).
Imports all models so SQLAlchemy's mapper and metadata registry are fully initialized.
"""
from app.models.customer import Customer
from app.models.catalog import (
    Category,
    Product,
    ProductImage,
    Store,
    Inventory,
    WishlistItem,
)
from app.models.cart import Cart, CartItem

__all__ = [
    "Customer",
    "Category",
    "Product",
    "ProductImage",
    "Store",
    "Inventory",
    "WishlistItem",
    "Cart",
    "CartItem",
]
