"""
PATRONET FastAPI Application Entrypoint.
"""
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings


def create_application() -> FastAPI:
    """Application factory for FastAPI."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

    # Root endpoint returning basic API info
    @application.get(
        "/",
        status_code=status.HTTP_200_OK,
        summary="API Root",
        tags=["Root"],
    )
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "message": "Welcome to PATRONET API 🚀",
            "docs": "/docs",
            "health": f"{settings.API_PREFIX}/health",
        }

    # Register centralized API router under /api
    application.include_router(api_router, prefix=settings.API_PREFIX)

    return application


app = create_application()
