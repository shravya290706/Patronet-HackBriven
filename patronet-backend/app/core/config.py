import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Base directory for the backend (patronet-backend directory)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file if it exists
load_dotenv(BASE_DIR / ".env")


class Settings:
    """Application settings with environment variable fallbacks."""

    # Project metadata
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "PATRONET API")
    PROJECT_DESCRIPTION: str = os.getenv(
        "PROJECT_DESCRIPTION",
        "E-commerce platform backend API for modern retail operations.",
    )
    VERSION: str = os.getenv("VERSION", "1.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # API Routing
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/v1")

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]
    CORS_ALLOW_CREDENTIALS: bool = os.getenv(
        "CORS_ALLOW_CREDENTIALS", "true"
    ).lower() in ("true", "1", "yes")
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # --- Future Architecture Integrations (Phase 2+) ---

    # Database (PostgreSQL) placeholder
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://patronet:patronet@localhost:5432/patronet_db",
    )

    # Event Streaming (Apache Kafka) placeholder
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv(
        "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"
    )

    # Search Engine (OpenSearch) placeholder
    OPENSEARCH_URL: str = os.getenv("OPENSEARCH_URL", "http://localhost:9200")


settings = Settings()
