"""
Central API router combining all sub-routers and versioned routes.
"""
from fastapi import APIRouter
from app.api.routes import health
from app.core.config import settings

api_router = APIRouter()

# Core service routes (e.g. /api/health)
api_router.include_router(health.router)

# Versioned API routes (e.g. /api/v1/...)
# Future domain routes (auth, products, cart, checkout, orders, search)
# will be mounted to v1_router.
v1_router = APIRouter(prefix=settings.API_V1_PREFIX)

# Attach versioned router under API prefix
api_router.include_router(v1_router)
