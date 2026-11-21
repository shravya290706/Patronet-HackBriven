import asyncio
from datetime import datetime, timezone
from decimal import Decimal
import os
import sys
from unittest.mock import AsyncMock, patch
from uuid import uuid4

sys.path.insert(0, "patronet-backend")

print("DEBUG: 1 - Starting", flush=True)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.catalog import Product, Category
from app.models.negotiation import NegotiationSession
from app.models.customer import Customer
from app.services.gemini_service import GeminiService
from app.services.comparor_service import ComparorService
from app.services.negotiation_service import NegotiationService
from app.services.assistant_service import AssistantService
from app.schemas.comparor import ComparorAnalysisRequest
from app.schemas.assistant import AssistantChatRequest
from app.schemas.negotiation import NegotiationStartRequest, NegotiationOfferRequest
from fastapi import HTTPException

print("DEBUG: 2 - Imports done", flush=True)

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
TestSession = sessionmaker(bind=engine)
print("DEBUG: 3 - Tables created", flush=True)

async def main():
    db = TestSession()
    now = datetime.now(timezone.utc)
    cat = Category(id=uuid4(), name="Laptops & Computers", description="Laptops", created_at=now)
    db.add(cat)
    db.commit()

    p1 = Product(
        id=uuid4(),
        name="Apple MacBook Pro 16",
        description="M3 Max powerhouse laptop.",
        brand="Apple",
        sku="MBP-16-001",
        price=Decimal("249900.00"),
        is_active=True,
        created_at=now,
        updated_at=now,
        category_id=cat.id,
        specifications={"Processor": "M3 Max", "RAM": "36GB"}
    )
    p2 = Product(
        id=uuid4(),
        name="Dell XPS 15",
        description="OLED Touch Windows ultrabook.",
        brand="Dell",
        sku="XPS-15-002",
        price=Decimal("179900.00"),
        is_active=True,
        created_at=now,
        updated_at=now,
        category_id=cat.id,
        specifications={"Processor": "i7-13700H", "RAM": "16GB"}
    )
    db.add_all([p1, p2])
    db.commit()
    print("DEBUG: 4 - Seeded products", flush=True)

    # 1.1 Comparor Fallback
    with patch.object(GeminiService, "is_available", return_value=False):
        res1 = await ComparorService.analyze_comparison(db=db, req=ComparorAnalysisRequest(product_ids=[p1.id, p2.id]))
        print(f"DEBUG: 5 - Comparor fallback done: {res1.is_ai_powered}", flush=True)

    # 1.2 Comparor Mock
    mock_comparor = {
        "executive_summary": "Summary",
        "key_differences": ["Diff 1"],
        "verdict": "Verdict",
        "product_analyses": [
            {"product_id": str(p1.id), "name": p1.name, "pros": ["Pro"], "cons": ["Con"], "ideal_for": "Dev", "value_rating": "Best"},
            {"product_id": str(p2.id), "name": p2.name, "pros": ["Pro"], "cons": ["Con"], "ideal_for": "Student", "value_rating": "Good"}
        ],
        "persona_recommendations": {"Dev": p1.name},
        "best_overall_id": str(p1.id),
        "best_value_id": str(p2.id)
    }
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_json", new_callable=AsyncMock) as mock_json:
        mock_json.return_value = mock_comparor
        res2 = await ComparorService.analyze_comparison(db=db, req=ComparorAnalysisRequest(product_ids=[p1.id, p2.id]))
        print(f"DEBUG: 6 - Comparor AI done: {res2.is_ai_powered}", flush=True)

    # 2.1 Negotiator Start
    sess = await NegotiationService.start_negotiation(db=db, req=NegotiationStartRequest(product_id=p1.id))
    print(f"DEBUG: 7 - Negotiation start done: {sess.id}", flush=True)

    # 2.2 Negotiator Offer < 70%
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_text", new_callable=AsyncMock) as mock_text:
        mock_text.return_value = "Too low"
        neg_rej = await NegotiationService.submit_offer(db=db, session_id=sess.id, req=NegotiationOfferRequest(offer=Decimal("100000.00")))
        print(f"DEBUG: 8 - Negotiator offer rejected done: {neg_rej.status}", flush=True)

    # 3.1 Assistant Fallback
    with patch.object(GeminiService, "is_available", return_value=False):
        sb_fall = await AssistantService.process_chat(db=db, req=AssistantChatRequest(message="laptop for programming under 300000"))
        print(f"DEBUG: 9 - Shopping buddy fallback done: {len(sb_fall.recommendations)}", flush=True)

    # 3.2 Assistant AI
    mock_sb = {
        "reply": "Top picks",
        "recommendations": [{"id": str(p1.id), "match_reason": "Top", "key_specs": {}}],
        "suggested_queries": ["Q"]
    }
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_json", new_callable=AsyncMock) as mock_json:
        mock_json.return_value = mock_sb
        sb_ai = await AssistantService.process_chat(db=db, req=AssistantChatRequest(message="laptop"))
        print(f"DEBUG: 10 - Shopping buddy AI done: {sb_ai.is_ai_powered}", flush=True)

    print("DEBUG: ALL COMPLETED!", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
