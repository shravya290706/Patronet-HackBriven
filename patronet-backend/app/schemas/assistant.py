"""
Pydantic schemas for AI Shopping Buddy Assistant.
"""
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.category import CategorySimple


class ProductRecommendationItem(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    sku: str
    price: Decimal
    is_active: bool
    category: Optional[CategorySimple] = None
    primary_image_url: Optional[str] = None
    match_reason: Optional[str] = None
    key_specs: Optional[Dict[str, Any]] = None


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's natural language shopping query")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Prior messages in this conversation")


class AssistantChatResponse(BaseModel):
    reply: str
    recommendations: List[ProductRecommendationItem] = []
    suggested_queries: List[str] = []
    intent: Optional[str] = None
    detected_category: Optional[str] = None
    detected_budget: Optional[Decimal] = None
    is_ai_powered: bool = False
    model_used: Optional[str] = None
