"""
Business logic service for smart price negotiation.
Evaluates customer offers against listed price, margin rules, and round limits.
Leverages Google Gemini API for context-aware, realistic seller bargaining dialogue
while deterministically enforcing price floors, round limits, and server-side validation.
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import logging
from typing import Optional
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.negotiation import NegotiationSession
from app.models.catalog import Product
from app.models.customer import Customer
from app.schemas.negotiation import (
    NegotiationMessage,
    NegotiationOfferRequest,
    NegotiationResponse,
    NegotiationStartRequest,
)
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

# Configurable rules
MAX_ROUNDS = 3
AUTO_ACCEPT_RATIO = Decimal("0.90")  # Offers >= 90% are accepted immediately
MIN_CONSIDER_RATIO = Decimal("0.70")  # Offers < 70% are rejected as too low


class NegotiationService:

    @staticmethod
    def _format_response(
        session: NegotiationSession,
        product: Product,
        reasoning: Optional[str] = None,
        is_ai_powered: bool = False,
    ) -> NegotiationResponse:
        primary_img = None
        if product.images:
            primary = next((i for i in product.images if i.is_primary), None)
            primary_img = primary.image_url if primary else product.images[0].image_url

        history_items = []
        if session.history and isinstance(session.history, list):
            for h in session.history:
                history_items.append(
                    NegotiationMessage(
                        sender=h.get("sender", "system"),
                        offer=Decimal(str(h.get("offer"))) if h.get("offer") is not None else None,
                        counter_offer=Decimal(str(h.get("counter_offer"))) if h.get("counter_offer") is not None else None,
                        message=h.get("message", ""),
                        timestamp=h.get("timestamp", ""),
                    )
                )

        return NegotiationResponse(
            id=session.id,
            product_id=session.product_id,
            product_name=product.name,
            product_sku=product.sku,
            product_image_url=primary_img,
            original_price=Decimal(str(session.original_price)).quantize(Decimal("0.01")),
            current_offer=Decimal(str(session.current_offer)).quantize(Decimal("0.01")) if session.current_offer else None,
            counter_offer=Decimal(str(session.counter_offer)).quantize(Decimal("0.01")) if session.counter_offer else None,
            agreed_price=Decimal(str(session.agreed_price)).quantize(Decimal("0.01")) if session.agreed_price else None,
            status=session.status,
            round_number=session.round_number,
            max_rounds=session.max_rounds,
            history=history_items,
            reasoning=reasoning,
            is_ai_powered=is_ai_powered,
            expires_at=session.expires_at,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )

    @classmethod
    def start_negotiation(
        cls,
        db: Session,
        req: NegotiationStartRequest,
        customer: Optional[Customer] = None,
    ) -> NegotiationResponse:
        product = db.query(Product).filter(Product.id == req.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        if not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot negotiate on inactive products.")

        now = datetime.now(timezone.utc)
        original_price = Decimal(str(product.price)).quantize(Decimal("0.01"))

        session_id = uuid4()
        history = [
            {
                "sender": "seller",
                "message": f"Welcome to Patronet Bargain Studio! The listed price for {product.name} is ₹{original_price:,.2f}. Submit your best offer (up to {MAX_ROUNDS} bargaining rounds).",
                "timestamp": now.isoformat(),
            }
        ]

        session = NegotiationSession(
            id=session_id,
            customer_id=customer.id if customer else None,
            product_id=product.id,
            original_price=original_price,
            current_offer=None,
            counter_offer=None,
            agreed_price=None,
            status="active",
            round_number=0,
            max_rounds=MAX_ROUNDS,
            history=history,
            expires_at=now + timedelta(hours=24),
            created_at=now,
            updated_at=now,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # If opening offer was passed, process it right away
        if req.initial_offer:
            return cls.submit_offer(db, session.id, NegotiationOfferRequest(offer=req.initial_offer), customer=customer)

        return cls._format_response(session, product, reasoning="Session initialized.", is_ai_powered=False)

    @classmethod
    def get_session(cls, db: Session, session_id: UUID) -> NegotiationResponse:
        session = db.query(NegotiationSession).filter(NegotiationSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Negotiation session not found.")
        product = db.query(Product).filter(Product.id == session.product_id).first()
        return cls._format_response(session, product)

    @classmethod
    def submit_offer(
        cls,
        db: Session,
        session_id: UUID,
        req: NegotiationOfferRequest,
        customer: Optional[Customer] = None,
    ) -> NegotiationResponse:
        session = db.query(NegotiationSession).filter(NegotiationSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Negotiation session not found.")

        product = db.query(Product).filter(Product.id == session.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

        if session.status in ["accepted"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Negotiation has already concluded with an accepted price.")

        if session.round_number >= session.max_rounds:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum negotiation rounds ({session.max_rounds}) reached. Please accept the counteroffer or browse other products.",
            )

        now = datetime.now(timezone.utc)
        offer = Decimal(str(req.offer)).quantize(Decimal("0.01"))
        original_price = Decimal(str(session.original_price))
        round_num = session.round_number + 1

        customer_msg = {
            "sender": "customer",
            "offer": float(offer),
            "message": f"Customer offered ₹{offer:,.2f} (Round {round_num}/{session.max_rounds}).",
            "timestamp": now.isoformat(),
        }

        ratio = offer / original_price
        reasoning = ""
        seller_msg = {}
        target_status = "active"
        target_counter: Optional[Decimal] = None
        target_agreed: Optional[Decimal] = None

        # -------------------------------------------------------------
        # STRICT DETERMINISTIC PRICING ENGINE
        # Gemini does NOT have the authority to bypass these price boundaries.
        # -------------------------------------------------------------
        if ratio >= Decimal("1.0"):
            target_status = "accepted"
            target_agreed = original_price
            reasoning = f"Offer of ₹{offer:,.2f} is at or above our catalog price. Standard price applied!"
            seller_msg = {
                "sender": "seller",
                "offer": float(original_price),
                "message": reasoning,
                "timestamp": now.isoformat(),
            }

        elif ratio >= AUTO_ACCEPT_RATIO:
            # Reasonable discount (up to 10%) -> Accept!
            target_status = "accepted"
            target_agreed = offer
            discount_pct = ((original_price - offer) / original_price * 100).quantize(Decimal("0.1"))
            reasoning = f"Deal accepted! Your offer of ₹{offer:,.2f} ({discount_pct}% off) meets our automated wholesale discount approval. You can now add to cart at this price!"
            seller_msg = {
                "sender": "seller",
                "offer": float(offer),
                "message": reasoning,
                "timestamp": now.isoformat(),
            }

        elif ratio >= MIN_CONSIDER_RATIO:
            # Negotiable range (10% to 30% discount) -> Counteroffer
            target_status = "counteroffer"

            # Calculate deterministic counteroffer based on round
            if round_num == 1:
                counter = (original_price * Decimal("0.93")).quantize(Decimal("0.01"))
            elif round_num == 2:
                counter = (original_price * Decimal("0.90")).quantize(Decimal("0.01"))
            else:
                counter = (original_price * Decimal("0.88")).quantize(Decimal("0.01"))

            if counter <= offer:
                target_status = "accepted"
                target_agreed = offer
                reasoning = f"Offer of ₹{offer:,.2f} is within our final clearance margin. Accepted!"
                seller_msg = {
                    "sender": "seller",
                    "offer": float(offer),
                    "message": reasoning,
                    "timestamp": now.isoformat(),
                }
            else:
                target_counter = counter
                diff = original_price - counter
                reasoning = (
                    f"We cannot accept ₹{offer:,.2f} due to minimum distributor margin requirements. "
                    f"However, we can offer you ₹{counter:,.2f} (saving you ₹{diff:,.2f}). "
                    f"This is round {round_num} of {session.max_rounds}."
                )
                seller_msg = {
                    "sender": "seller",
                    "counter_offer": float(counter),
                    "message": reasoning,
                    "timestamp": now.isoformat(),
                }

        else:
            # Below 70% -> Rejected
            target_status = "rejected"
            min_guidance = (original_price * Decimal("0.80")).quantize(Decimal("0.01"))
            reasoning = (
                f"Offer of ₹{offer:,.2f} is too low (over 30% below retail). "
                f"Our vendor agreements require offers closer to ₹{min_guidance:,.2f} to proceed."
            )
            seller_msg = {
                "sender": "seller",
                "offer": float(offer),
                "message": reasoning,
                "timestamp": now.isoformat(),
            }

        # -------------------------------------------------------------
        # GEMINI SELLER DIALOGUE GENERATION (Conversational Enhancement)
        # Generates persuasive, context-aware merchant bargaining responses.
        # -------------------------------------------------------------
        is_ai_powered = False
        if GeminiService.is_available():
            try:
                system_prompt = (
                    "You are the senior sales merchant at PATRONET, a premier electronics and hardware retailer in India. "
                    "Your role is to write a realistic, polite, and persuasive bargaining dialogue to the customer. "
                    "You must strictly abide by the predetermined negotiation outcome provided below. "
                    "Do NOT change the prices or financial terms. "
                    "Return ONLY a conversational markdown message from the seller (2 to 3 sentences maximum)."
                )

                discount_pct = float(((original_price - offer) / original_price * 100))
                user_prompt = (
                    f"Product: {product.name} (Brand: {product.brand or 'PATRONET'}, Category: {product.category.name if product.category else 'Electronics'})\n"
                    f"Original Listed Price: ₹{original_price:,.2f}\n"
                    f"Customer's Offer: ₹{offer:,.2f} ({discount_pct:.1f}% discount requested)\n"
                    f"Round: {round_num} of {session.max_rounds}\n"
                    f"Predetermined Outcome: {target_status}\n"
                )
                if target_status == "accepted":
                    user_prompt += f"Outcome Detail: Offer is approved. Congratulate the customer warmly on securing ₹{target_agreed:,.2f}.\n"
                elif target_status == "counteroffer":
                    user_prompt += f"Outcome Detail: Reject the lower offer politely citing manufacturer margins or authorized warranty, and present the counteroffer of exactly ₹{target_counter:,.2f}.\n"
                elif target_status == "rejected":
                    user_prompt += f"Outcome Detail: Explain respectfully that ₹{offer:,.2f} is below our distributor cost floor and invite them to make a closer offer.\n"

                ai_dialogue = GeminiService.generate_text(
                    prompt=user_prompt,
                    system_instruction=system_prompt,
                    temperature=0.4,
                )

                if ai_dialogue and len(ai_dialogue.strip()) > 10:
                    cleaned_dialogue = ai_dialogue.strip()
                    # Ensure counteroffer price is explicitly mentioned if status is counteroffer
                    if target_status == "counteroffer" and target_counter is not None:
                        target_str = f"₹{target_counter:,.2f}"
                        if target_str not in cleaned_dialogue and f"{target_counter:.0f}" not in cleaned_dialogue:
                            cleaned_dialogue += f" Our best counteroffer for this round is {target_str}."

                    seller_msg["message"] = cleaned_dialogue
                    reasoning = cleaned_dialogue
                    is_ai_powered = True
            except Exception as e:
                logger.warning("Gemini seller dialogue generation encountered error: %s; using deterministic message.", str(e))

        # Update session state deterministically
        session.status = target_status
        session.round_number = round_num
        session.current_offer = offer
        session.counter_offer = target_counter
        session.agreed_price = target_agreed

        # Append messages to history
        current_history = list(session.history) if session.history else []
        current_history.append(customer_msg)
        current_history.append(seller_msg)
        session.history = current_history
        session.updated_at = now

        db.commit()
        db.refresh(session)

        return cls._format_response(session, product, reasoning=reasoning, is_ai_powered=is_ai_powered)

    @classmethod
    def accept_counteroffer(
        cls,
        db: Session,
        session_id: UUID,
        customer: Optional[Customer] = None,
    ) -> NegotiationResponse:
        session = db.query(NegotiationSession).filter(NegotiationSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Negotiation session not found.")

        product = db.query(Product).filter(Product.id == session.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

        if session.status != "counteroffer" or not session.counter_offer:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active counteroffer to accept.")

        now = datetime.now(timezone.utc)
        agreed = Decimal(str(session.counter_offer)).quantize(Decimal("0.01"))
        session.status = "accepted"
        session.agreed_price = agreed
        session.updated_at = now
        session.expires_at = now + timedelta(hours=24)

        accept_msg = {
            "sender": "customer",
            "message": f"Customer accepted the seller's counteroffer of ₹{agreed:,.2f}!",
            "timestamp": now.isoformat(),
        }
        seller_msg = {
            "sender": "seller",
            "offer": float(agreed),
            "message": f"Congratulations! Price locked in at ₹{agreed:,.2f}. You can now add {product.name} to your cart.",
            "timestamp": now.isoformat(),
        }

        current_history = list(session.history) if session.history else []
        current_history.append(accept_msg)
        current_history.append(seller_msg)
        session.history = current_history

        db.commit()
        db.refresh(session)

        return cls._format_response(session, product, reasoning="Counteroffer accepted.", is_ai_powered=False)
