"""
Pydantic schemas for AI-powered Product Comparison (Comparor).
"""
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ComparorProductAnalysis(BaseModel):
    product_id: UUID
    name: str
    pros: List[str] = []
    cons: List[str] = []
    ideal_for: str
    value_rating: str


class ComparorAnalysisRequest(BaseModel):
    product_ids: List[UUID] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="List of 2 to 4 product UUIDs to compare",
    )
    context: Optional[str] = Field(
        None,
        description="Optional usage context e.g. 'Programming', 'Gaming', 'College/Student', 'Content Creation', 'Budget'",
    )


class ComparorAnalysisResponse(BaseModel):
    is_ai_powered: bool = True
    model_used: Optional[str] = None
    executive_summary: str
    key_differences: List[str] = []
    product_analyses: List[ComparorProductAnalysis] = []
    persona_recommendations: Dict[str, str] = {}
    best_overall_id: Optional[UUID] = None
    best_value_id: Optional[UUID] = None
    verdict: str
