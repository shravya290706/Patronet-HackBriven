"""
API route definitions for Search Indexing and OpenSearch operations.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.search import IndexingResponse, SearchResponse, SearchSuggestionResponse
from app.services.search_indexer import SearchIndexerService

router = APIRouter(prefix="/search", tags=["Search & Indexing"])


@router.post(
    "/index",
    response_model=IndexingResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger product indexing into OpenSearch",
    description="Synchronize and index all active products from PostgreSQL into the dedicated PATRONET OpenSearch index. Operation is idempotent.",
)
def trigger_indexing(
    db: Session = Depends(get_db),
) -> IndexingResponse:
    return SearchIndexerService.index_all_active_products(db=db)


@router.get(
    "/query",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search products in OpenSearch",
    description="Execute a full-text search against the OpenSearch products index with optional filtering, sorting, and pagination.",
)
def query_products(
    q: str = Query(..., min_length=1, description="Search term"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Max results to return"),
    category: Optional[str] = Query(None, description="Filter by Category ID or Category Name"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    sort: Optional[str] = Query(None, description="Sort order (price-asc, price-desc, newest, relevance)"),
    db: Session = Depends(get_db),
) -> SearchResponse:
    return SearchIndexerService.search_products(
        query=q,
        category=category,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        page=page,
        limit=limit,
        fallback_db=db,
    )


@router.get(
    "/suggest",
    response_model=SearchSuggestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get autocomplete search suggestions",
    description="Retrieve proactive product, category, brand, and spelling correction suggestions for a query.",
)
def suggest_products(
    q: str = Query(..., min_length=1, description="Query text"),
    limit: int = Query(5, ge=1, le=10, description="Max product suggestions"),
    db: Session = Depends(get_db),
) -> SearchSuggestionResponse:
    return SearchIndexerService.get_suggestions(query=q, limit=limit, fallback_db=db)
