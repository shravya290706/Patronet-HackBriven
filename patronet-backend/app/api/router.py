"""
Central API router combining all sub-routers and versioned routes.
"""

from fastapi import APIRouter

from app.api.routes import (
    health,
    auth,
    cart,
    categories,
    products,
    search,
    wishlist,
    negotiation,
    assistant,
    comparor,
)
from app.core.config import settings

api_router = APIRouter()

# Core routes: /api/health
api_router.include_router(health.router)

# Versioned API: /api/v1
v1_router = APIRouter(prefix=settings.API_V1_PREFIX)

# Authentication
v1_router.include_router(auth.router)

# Product catalogue
v1_router.include_router(products.router)

# Categories
v1_router.include_router(categories.router)

# Shopping cart
v1_router.include_router(cart.router)

# Wishlist
v1_router.include_router(wishlist.router)

# Search / OpenSearch
v1_router.include_router(search.router)

# Negotiations / Bargain Studio
v1_router.include_router(negotiation.router)

# Shopping Buddy / AI Assistant
v1_router.include_router(assistant.router)

# Comparor / AI Comparison Studio
v1_router.include_router(comparor.router)

# Attach versioned routes
api_router.include_router(v1_router)