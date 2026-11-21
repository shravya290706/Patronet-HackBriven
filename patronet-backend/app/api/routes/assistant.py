"""
API route definitions for AI Shopping Buddy Assistant.
Conversational hardware search, budget filtering, and intelligent recommendations.
Powered by Google Gemini with strict catalog integrity validation and deterministic fallback.
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
)
from app.services.assistant_service import AssistantService

router = APIRouter(prefix="/assistant", tags=["Assistant"])


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with Shopping Buddy",
    description="Conversational shopping assistant that parses intent, budget, and features, and recommends verified products.",
)
def chat_with_assistant(
    req: AssistantChatRequest,
    db: Session = Depends(get_db),
) -> AssistantChatResponse:
    return AssistantService.process_chat(db=db, req=req)


@router.get(
    "/suggestions",
    response_model=List[str],
    status_code=status.HTTP_200_OK,
    summary="Get sample shopping assistant prompts",
    description="Retrieve prompt suggestions for the assistant UI.",
)
def get_assistant_suggestions() -> List[str]:
    return AssistantService.get_quick_suggestions()
