"""
SQLAlchemy model for Price Negotiation Sessions.
"""
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class NegotiationSession(Base):
    __tablename__ = "negotiation_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    original_price = Column(Numeric(10, 2), nullable=False)
    current_offer = Column(Numeric(10, 2), nullable=True)
    counter_offer = Column(Numeric(10, 2), nullable=True)
    agreed_price = Column(Numeric(10, 2), nullable=True)
    status = Column(String(30), nullable=False, default="active")  # active, counteroffer, accepted, rejected, expired
    round_number = Column(Integer, nullable=False, default=0)
    max_rounds = Column(Integer, nullable=False, default=3)
    history = Column(JSONB, nullable=False, default=list)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer")
    product = relationship("Product")
