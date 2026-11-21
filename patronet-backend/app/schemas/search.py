"""
Pydantic schemas for OpenSearch indexing and search verification.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IndexingResponse(BaseModel):
    status: str = Field(..., description="Status of the indexing operation")
    index_name: str = Field(..., description="Name of the OpenSearch index")
    total_active_in_db: int = Field(
        ..., description="Total active products queried from PostgreSQL"
    )
    indexed: int = Field(..., description="Number of documents successfully indexed")
    failed: int = Field(..., description="Number of failed documents")
    duration_seconds: float = Field(
        ..., description="Total execution duration in seconds"
    )


class SearchHitItem(BaseModel):
    product_id: str
    name: str
    brand: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    sku: str
    price: float
    primary_image_url: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    score: float


class SearchResponse(BaseModel):
    query: str
    total_hits: int
    hits: List[SearchHitItem]
    page: Optional[int] = 1
    limit: Optional[int] = 10
    total_pages: Optional[int] = 1
    fallback_used: Optional[bool] = False


class SuggestProductItem(BaseModel):
    id: str
    name: str
    brand: Optional[str] = None
    category_name: Optional[str] = None
    sku: Optional[str] = None
    price: float
    primary_image_url: Optional[str] = None


class SuggestCategoryItem(BaseModel):
    id: Optional[str] = None
    name: str


class SearchSuggestionResponse(BaseModel):
    query: str
    products: List[SuggestProductItem] = Field(default_factory=list)
    categories: List[SuggestCategoryItem] = Field(default_factory=list)
    brands: List[str] = Field(default_factory=list)
    corrections: List[str] = Field(default_factory=list)
    fallback_used: bool = False
