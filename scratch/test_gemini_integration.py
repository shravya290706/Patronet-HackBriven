"""
Automated Hermetic Verification Suite for Gemini API Integration in PATRONET's 3 USPs:
1. Comparor (Specification analysis, tradeoffs, personas, fallback)
2. Negotiator (Conversational merchant dialogue, deterministic price floors, round limits)
3. Shopping Buddy (Catalogue candidate filtering, strict ID validation, hallucination rejection, fallback)

Runs 100% offline with in-memory SQLite and complete mock test coverage.
"""
import asyncio
from datetime import datetime, timezone
from decimal import Decimal
import os
import sys
from unittest.mock import AsyncMock, patch
from uuid import uuid4

# Setup python path to import patronet-backend app
sys.path.insert(0, os.path.abspath("patronet-backend"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base

# Import all models to ensure complete foreign key metadata resolution
import app.models.customer
import app.models.catalog
import app.models.negotiation
import app.models.cart

from app.models.catalog import Product, Category
from app.models.negotiation import NegotiationSession
from app.services.gemini_service import GeminiService
from app.services.comparor_service import ComparorService
from app.services.negotiation_service import NegotiationService
from app.services.assistant_service import AssistantService
from app.schemas.comparor import ComparorAnalysisRequest
from app.schemas.assistant import AssistantChatRequest
from app.schemas.negotiation import NegotiationStartRequest, NegotiationOfferRequest
from fastapi import HTTPException

# Create hermetic in-memory SQLite DB
engine = create_engine("sqlite:///:memory:", echo=False)
Base.metadata.create_all(bind=engine)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

passed_tests = 0
failed_tests = 0

def check(condition: bool, test_name: str, detail: str = ""):
    global passed_tests, failed_tests
    if condition:
        passed_tests += 1
        print(f"  [PASS] {test_name}", flush=True)
    else:
        failed_tests += 1
        print(f"  [FAIL] {test_name}: {detail}", flush=True)


async def run_tests():
    global passed_tests, failed_tests
    print("\n=======================================================", flush=True)
    print("RUNNING PATRONET GEMINI 3-USP INTEGRATION TEST SUITE", flush=True)
    print("=======================================================\n", flush=True)

    db = TestSessionLocal()
    try:
        now = datetime.now(timezone.utc)
        cat_laptops = Category(id=uuid4(), name="Laptops & Computers", description="Laptops", created_at=now)
        cat_audio = Category(id=uuid4(), name="Audio & Headphones", description="Audio", created_at=now)
        db.add_all([cat_laptops, cat_audio])
        db.commit()

        p1 = Product(
            id=uuid4(),
            name="Apple MacBook Pro 16",
            description="M3 Max powerhouse laptop with 36GB unified memory and Liquid Retina XDR display.",
            brand="Apple",
            sku="MBP-16-M3-001",
            price=Decimal("249900.00"),
            is_active=True,
            created_at=now,
            updated_at=now,
            category_id=cat_laptops.id,
            specifications={
                "Processor": "Apple M3 Max 14-core",
                "RAM": "36GB Unified Memory",
                "Storage": "1TB SSD",
                "Display": "16.2-inch Liquid Retina XDR 120Hz",
                "Battery": "Up to 22 hours",
            }
        )

        p2 = Product(
            id=uuid4(),
            name="Dell XPS 15",
            description="Premium Windows ultrabook with OLED touch display and Intel Core i7.",
            brand="Dell",
            sku="DELL-XPS-15-002",
            price=Decimal("179900.00"),
            is_active=True,
            created_at=now,
            updated_at=now,
            category_id=cat_laptops.id,
            specifications={
                "Processor": "Intel Core i7-13700H",
                "RAM": "16GB DDR5",
                "Storage": "512GB NVMe SSD",
                "Display": "15.6-inch 3.5K OLED Touch",
                "Graphics": "NVIDIA GeForce RTX 4050 6GB",
            }
        )

        p3 = Product(
            id=uuid4(),
            name="Sony WH-1000XM5 Wireless Headphones",
            description="Industry leading noise canceling headphones with dual processor ANC.",
            brand="Sony",
            sku="SONY-WH-XM5-003",
            price=Decimal("29990.00"),
            is_active=True,
            created_at=now,
            updated_at=now,
            category_id=cat_audio.id,
            specifications={
                "Driver": "30mm Precision Driver",
                "ANC": "Integrated Processor V1 + QN1",
                "Battery": "30 hours with ANC",
                "Codec": "LDAC, AAC, SBC",
            }
        )

        db.add_all([p1, p2, p3])
        db.commit()

        prod_ids = [p1.id, p2.id]
        print(f"Test Products Seeded: '{p1.name}' (₹{p1.price}) and '{p2.name}' (₹{p2.price})", flush=True)

        # -----------------------------------------------------------------
        # TEST GROUP 1: COMPAROR AI & FALLBACK
        # -----------------------------------------------------------------
        print("\n--- Test Group 1: COMPAROR (AI Analysis & Integrity) ---", flush=True)

        # 1.1: Missing Gemini Key -> Deterministic Fallback
        with patch.object(GeminiService, "is_available", return_value=False):
            fallback_res = await ComparorService.analyze_comparison(
                db=db,
                req=ComparorAnalysisRequest(product_ids=prod_ids)
            )
            check(fallback_res is not None, "Comparor fallback returns result when Gemini key missing")
            check(fallback_res.is_ai_powered is False, "Comparor flags is_ai_powered=False on fallback")
            check(len(fallback_res.product_analyses) == 2, "Comparor fallback analyzes both products")
            check("optimal value" in fallback_res.verdict.lower(), "Comparor fallback generates reasoned verdict")

        # 1.2: Mock Gemini Successful Response
        mock_comparor_json = {
            "executive_summary": "Comparing Apple MacBook Pro 16 and Dell XPS 15.",
            "key_differences": ["M3 Max vs Intel i7", "MacOS vs Windows"],
            "verdict": f"The {p1.name} offers superior processing power, while {p2.name} is suited for general mobility.",
            "product_analyses": [
                {
                    "product_id": str(p1.id),
                    "name": p1.name,
                    "pros": ["Outstanding compilation speeds", "Vibrant display"],
                    "cons": ["Slightly heavier chassis"],
                    "ideal_for": "Software Engineer",
                    "value_rating": "Best Overall"
                },
                {
                    "product_id": str(p2.id),
                    "name": p2.name,
                    "pros": ["Lightweight design", "Excellent battery life"],
                    "cons": ["Modest GPU throughput"],
                    "ideal_for": "Student / Remote Worker",
                    "value_rating": "Best Value"
                }
            ],
            "persona_recommendations": {
                "Developer": p1.name,
                "Student": p2.name
            },
            "best_overall_id": str(p1.id),
            "best_value_id": str(p2.id),
        }

        with patch.object(GeminiService, "is_available", return_value=True), \
             patch.object(GeminiService, "generate_json", new_callable=AsyncMock) as mock_gen_json:
            mock_gen_json.return_value = mock_comparor_json
            ai_res = await ComparorService.analyze_comparison(
                db=db,
                req=ComparorAnalysisRequest(product_ids=prod_ids, context="developer")
            )
            check(ai_res.is_ai_powered is True, "Comparor flags is_ai_powered=True when Gemini responds")
            check(ai_res.model_used is not None, "Comparor records model_used")
            check(len(ai_res.product_analyses) == 2, "Comparor returns validated product analyses")
            check(ai_res.persona_recommendations.get("Developer") == p1.name, "Comparor preserves persona mapping")

        # 1.3: Hallucination Rejection (Gemini returns a made-up UUID)
        hallucinated_id = str(uuid4())
        mock_hallucinated_json = dict(mock_comparor_json)
        mock_hallucinated_json["product_analyses"] = [
            {
                "product_id": hallucinated_id,
                "name": "Phantom Laptop 9000",
                "pros": ["Magic specs"],
                "cons": ["Does not exist"],
                "ideal_for": "Imaginary",
                "value_rating": "Zero",
            },
            {
                "product_id": str(p1.id),
                "name": p1.name,
                "pros": ["Pro"],
                "cons": ["Con"],
                "ideal_for": "Dev",
                "value_rating": "Best",
            },
            {
                "product_id": str(p2.id),
                "name": p2.name,
                "pros": ["Pro"],
                "cons": ["Con"],
                "ideal_for": "Student",
                "value_rating": "Good",
            }
        ]
        with patch.object(GeminiService, "is_available", return_value=True), \
             patch.object(GeminiService, "generate_json", new_callable=AsyncMock) as mock_gen_json:
            mock_gen_json.return_value = mock_hallucinated_json
            safe_res = await ComparorService.analyze_comparison(
                db=db,
                req=ComparorAnalysisRequest(product_ids=prod_ids)
            )
            check(not any(str(pa.product_id) == hallucinated_id for pa in safe_res.product_analyses),
                  "Comparor rejects hallucinated product IDs not in input set")

        # -----------------------------------------------------------------
        # TEST GROUP 2: NEGOTIATOR DETERMINISTIC BOUNDARIES & AI DIALOGUE
        # -----------------------------------------------------------------
        print("\n--- Test Group 2: NEGOTIATOR (Price Floors & AI Bargaining) ---", flush=True)

        start_req = NegotiationStartRequest(product_id=p1.id)
        session_res = await NegotiationService.start_negotiation(db=db, req=start_req)
        sess_id = session_res.id
        p1_price = Decimal(str(p1.price))

        # 2.1: Price floor enforcement: Customer offers < 70% -> Must be REJECTED
        low_offer = (p1_price * Decimal("0.50")).quantize(Decimal("0.01"))
        offer_req = NegotiationOfferRequest(offer=low_offer)
        with patch.object(GeminiService, "is_available", return_value=True), \
             patch.object(GeminiService, "generate_text", new_callable=AsyncMock) as mock_gen_text:
            mock_gen_text.return_value = f"While we appreciate your enthusiasm, ₹{low_offer:,.2f} is well below our wholesale cost."
            res_rejected = await NegotiationService.submit_offer(db=db, session_id=sess_id, req=offer_req)
            check(res_rejected.status == "rejected", "Offers < 70% are strictly REJECTED by deterministic floor")
            check(res_rejected.agreed_price is None, "Rejected offer does not set agreed_price")
            check(res_rejected.round_number == 1, "Round counter increments to 1")

        # 2.2: Negotiable range: Customer offers 75% -> Generates counteroffer clamped to round formula (~93% on round 1)
        session_res2 = await NegotiationService.start_negotiation(db=db, req=start_req)
        sess_id2 = session_res2.id
        mid_offer = (p1_price * Decimal("0.75")).quantize(Decimal("0.01"))
        with patch.object(GeminiService, "is_available", return_value=True), \
             patch.object(GeminiService, "generate_text", new_callable=AsyncMock) as mock_gen_text:
            mock_gen_text.return_value = "Thank you for the counter. We can offer you our dealer discount."
            res_counter = await NegotiationService.submit_offer(db=db, session_id=sess_id2, req=NegotiationOfferRequest(offer=mid_offer))
            check(res_counter.status == "counteroffer", "Offers in 70-89% trigger counteroffer status")
            check(res_counter.counter_offer is not None, "Counteroffer price is calculated and present")
            check(res_counter.counter_offer > mid_offer, "Counteroffer is above customer offer")
            check(res_counter.counter_offer <= p1_price, "Counteroffer does not exceed original price")
            check(res_counter.is_ai_powered is True, "Negotiation flags is_ai_powered=True when Gemini dialogue used")

        # 2.3: Auto-Accept: Customer offers 92% -> Must be ACCEPTED immediately
        high_offer = (p1_price * Decimal("0.92")).quantize(Decimal("0.01"))
        session_res3 = await NegotiationService.start_negotiation(db=db, req=start_req)
        with patch.object(GeminiService, "is_available", return_value=True), \
             patch.object(GeminiService, "generate_text", new_callable=AsyncMock) as mock_gen_text:
            mock_gen_text.return_value = f"Congratulations! Your offer of ₹{high_offer:,.2f} is accepted."
            res_accepted = await NegotiationService.submit_offer(db=db, session_id=session_res3.id, req=NegotiationOfferRequest(offer=high_offer))
            check(res_accepted.status == "accepted", "Offers >= 90% are automatically ACCEPTED")
            check(res_accepted.agreed_price == high_offer, "Agreed price is locked to customer's accepted offer")

        # 2.4: Round Limit Enforcement: 3 rounds maximum
        session_res4 = await NegotiationService.start_negotiation(db=db, req=start_req)
        sess_id4 = session_res4.id
        # Round 1
        await NegotiationService.submit_offer(db=db, session_id=sess_id4, req=NegotiationOfferRequest(offer=mid_offer))
        # Round 2
        await NegotiationService.submit_offer(db=db, session_id=sess_id4, req=NegotiationOfferRequest(offer=mid_offer))
        # Round 3
        res_r3 = await NegotiationService.submit_offer(db=db, session_id=sess_id4, req=NegotiationOfferRequest(offer=mid_offer))
        check(res_r3.round_number == 3, "Round increments cleanly to max (3)")

        # Round 4 attempt must raise HTTPException 400
        round_blocked = False
        try:
            await NegotiationService.submit_offer(db=db, session_id=sess_id4, req=NegotiationOfferRequest(offer=mid_offer))
        except HTTPException as exc:
            if exc.status_code == 400 and "Maximum negotiation rounds" in exc.detail:
                round_blocked = True
        check(round_blocked, "Round limit (3) is strictly enforced with HTTP 400 rejection")

        # -----------------------------------------------------------------
        # TEST GROUP 3: SHOPPING BUDDY (ASSISTANT) AI & INTEGRITY
        # -----------------------------------------------------------------
        print("\n--- Test Group 3: SHOPPING BUDDY (Strict Catalog Guardrails) ---", flush=True)

        # 3.1: Fallback when Gemini unconfigured
        with patch.object(GeminiService, "is_available", return_value=False):
            sb_fallback = await AssistantService.process_chat(
                db=db,
                req=AssistantChatRequest(message="laptop for programming under 300000")
            )
            check(sb_fallback is not None, "Shopping Buddy fallback produces response")
            check(len(sb_fallback.recommendations) > 0, "Shopping Buddy fallback returns catalogue products")
            check(sb_fallback.is_ai_powered is False, "Shopping Buddy fallback marked is_ai_powered=False")

        # 3.2: Gemini Success with real product ID
        mock_sb_json = {
            "reply": f"For software development within your budget, the **{p1.name}** is an exceptional match.",
            "recommendations": [
                {
                    "id": str(p1.id),
                    "match_reason": "High-performance CPU with generous memory bandwidth.",
                    "key_specs": {"RAM": "36GB", "CPU": "M3 Max"}
                }
            ],
            "suggested_queries": ["Compare with Dell XPS", "Check warranty"]
        }
        with patch.object(GeminiService, "is_available", return_value=True), \
             patch.object(GeminiService, "generate_json", new_callable=AsyncMock) as mock_gen_json:
            mock_gen_json.return_value = mock_sb_json
            sb_ai = await AssistantService.process_chat(
                db=db,
                req=AssistantChatRequest(message="programming machine")
            )
            check(sb_ai.is_ai_powered is True, "Shopping Buddy flagged is_ai_powered=True")
            check(sb_ai.model_used is not None, "Shopping Buddy records model_used")
            check(len(sb_ai.recommendations) == 1, "Shopping Buddy returns recommended product")
            check(sb_ai.recommendations[0].id == p1.id, "Product ID matches database record")
            check(sb_ai.recommendations[0].price == Decimal(str(p1.price)).quantize(Decimal("0.01")),
                  "Product price matches real catalog record")

        # 3.3: Hallucinated product ID dropped and ignored
        fake_uuid = str(uuid4())
        mock_sb_hallucinated = {
            "reply": "Here are products:",
            "recommendations": [
                {
                    "id": fake_uuid,
                    "match_reason": "Fake product hallucinated by AI.",
                    "key_specs": {}
                },
                {
                    "id": str(p1.id),
                    "match_reason": "Real product match.",
                    "key_specs": {}
                }
            ],
            "suggested_queries": ["Show more"]
        }
        with patch.object(GeminiService, "is_available", return_value=True), \
             patch.object(GeminiService, "generate_json", new_callable=AsyncMock) as mock_gen_json:
            mock_gen_json.return_value = mock_sb_hallucinated
            sb_filtered = await AssistantService.process_chat(
                db=db,
                req=AssistantChatRequest(message="best laptop")
            )
            rec_ids = [str(r.id) for r in sb_filtered.recommendations]
            check(fake_uuid not in rec_ids, "Shopping Buddy drops hallucinated product IDs from response")
            check(str(p1.id) in rec_ids, "Shopping Buddy retains valid catalog product ID")

        # -----------------------------------------------------------------
        # TEST GROUP 4: ROUTE REGISTRATION & SCHEMA VERIFICATION
        # -----------------------------------------------------------------
        print("\n--- Test Group 4: ROUTE REGISTRATION IN FASTAPI ---", flush=True)
        from app.main import app
        registered_paths = [route.path for route in app.routes]

        check("/api/v1/comparor/analyze" in registered_paths, "Route POST /api/v1/comparor/analyze is registered")
        check("/api/v1/negotiations/start" in registered_paths, "Route POST /api/v1/negotiations/start is registered")
        check("/api/v1/negotiations/{session_id}/offer" in registered_paths, "Route POST /api/v1/negotiations/{session_id}/offer is registered")
        check("/api/v1/assistant/chat" in registered_paths, "Route POST /api/v1/assistant/chat is registered")

    finally:
        db.close()

    print("\n=======================================================", flush=True)
    print(f"RESULTS: {passed_tests} PASSED, {failed_tests} FAILED", flush=True)
    print("=======================================================\n", flush=True)
    if failed_tests > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_tests())
