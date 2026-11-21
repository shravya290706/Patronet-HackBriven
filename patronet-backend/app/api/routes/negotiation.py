"""
API route definitions for Price Negotiation operations.
Allows customers to bargain and make offers on products with Gemini conversational bargaining
and deterministic pricing rules.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.negotiation import (
    NegotiationOfferRequest,
    NegotiationResponse,
    NegotiationStartRequest,
)
from app.services.auth_service import get_optional_current_user
from app.services.negotiation_service import NegotiationService

router = APIRouter(prefix="/negotiations", tags=["Negotiations"])


@router.post(
    "/start",
    response_model=NegotiationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start negotiation session",
    description="Initialize a new price negotiation session for a product.",
)
def start_negotiation(
    req: NegotiationStartRequest,
    current_user: Optional[Customer] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> NegotiationResponse:
    return NegotiationService.start_negotiation(db=db, req=req, customer=current_user)


@router.get(
    "/{session_id}",
    response_model=NegotiationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get negotiation session",
    description="Retrieve the current status and message history of a negotiation session.",
)
def get_negotiation(
    session_id: UUID,
    db: Session = Depends(get_db),
) -> NegotiationResponse:
    return NegotiationService.get_session(db=db, session_id=session_id)


@router.post(
    "/{session_id}/offer",
    response_model=NegotiationResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit counter offer",
    description="Submit a proposed price offer. Evaluates against listed price and returns acceptance, counteroffer, or rejection.",
)
def submit_offer(
    session_id: UUID,
    req: NegotiationOfferRequest,
    current_user: Optional[Customer] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> NegotiationResponse:
    return NegotiationService.submit_offer(db=db, session_id=session_id, req=req, customer=current_user)


@router.post(
    "/{session_id}/accept-counter",
    response_model=NegotiationResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept seller counteroffer",
    description="Customer accepts the seller's counteroffer price, finalizing the agreed price.",
)
def accept_counteroffer(
    session_id: UUID,
    current_user: Optional[Customer] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> NegotiationResponse:
    return NegotiationService.accept_counteroffer(db=db, session_id=session_id, customer=current_user)
