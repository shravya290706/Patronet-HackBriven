"""
API route definitions for AI-powered Product Comparison (Comparor).
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.comparor import (
    ComparorAnalysisRequest,
    ComparorAnalysisResponse,
)
from app.services.comparor_service import ComparorService

router = APIRouter(prefix="/comparor", tags=["Comparor"])


@router.post(
    "/analyze",
    response_model=ComparorAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Specification & Value Analysis",
    description="Analyze 2 to 4 products using Gemini AI to evaluate technical trade-offs, pros/cons, and persona recommendations.",
)
def analyze_comparison(
    req: ComparorAnalysisRequest,
    db: Session = Depends(get_db),
) -> ComparorAnalysisResponse:
    return ComparorService.analyze_comparison(db=db, req=req)
