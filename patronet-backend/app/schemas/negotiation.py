"""
Pydantic schemas for Price Negotiation.
"""
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class NegotiationMessage(BaseModel):
    sender: str = Field(..., description="'customer' or 'seller'")
    offer: Optional[Decimal] = None
    counter_offer: Optional[Decimal] = None
    message: str
    timestamp: str


class NegotiationStartRequest(BaseModel):
    product_id: UUID = Field(..., description="ID of product to negotiate price on")
    initial_offer: Optional[Decimal] = Field(None, description="Optional customer opening offer", gt=0)


class NegotiationOfferRequest(BaseModel):
    offer: Decimal = Field(..., gt=0, description="Customer proposed price in INR")


class NegotiationResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_sku: str
    product_image_url: Optional[str] = None
    original_price: Decimal
    current_offer: Optional[Decimal] = None
    counter_offer: Optional[Decimal] = None
    agreed_price: Optional[Decimal] = None
    status: str  # active, counteroffer, accepted, rejected, expired
    round_number: int
    max_rounds: int
    history: List[NegotiationMessage] = []
    reasoning: Optional[str] = None
    is_ai_powered: bool = False
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
