"""
Comprehensive automated test suite for Gemini AI integration across the 3 USPs:
1. Comparor: POST /api/v1/comparor/analyze (AI specification reasoning, persona tradeoff analysis, fallback)
2. Negotiator: POST /api/v1/negotiations/start & POST /api/v1/negotiations/{id}/offer (AI seller dialogue, deterministic price floors, round limits)
3. Shopping Buddy: POST /api/v1/assistant/chat (Candidate catalogue grounding, strict hallucination dropping, fallback)

Runs hermetically with FastAPI TestClient and mock Gemini service without external network or API key dependencies.
"""
from datetime import datetime, timezone
from decimal import Decimal
import os
import sys
from unittest.mock import MagicMock, patch
import uuid
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath("patronet-backend"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db

# Import models for metadata resolution
import app.models.customer
import app.models.catalog
import app.models.negotiation
import app.models.cart

from app.models.catalog import Product, Category
from app.models.negotiation import NegotiationSession
from app.main import app
from app.services.gemini_service import GeminiService

# Setup hermetic SQLite database
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=engine)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_gemini_suite():
    print("\n=======================================================", flush=True)
    print("PATRONET 3-USP GEMINI API TEST SUITE (FASTAPI TESTCLIENT)", flush=True)
    print("=======================================================\n", flush=True)

    db = TestSessionLocal()
    now = datetime.now(timezone.utc)
    cat = Category(id=uuid.uuid4(), name="Laptops & Computers", description="Laptops", created_at=now)
    db.add(cat)
    db.commit()

    p1 = Product(
        id=uuid.uuid4(),
        category_id=cat.id,
        name="Apple MacBook Pro 16",
        sku="MBP-16-001",
        price=Decimal("249900.00"),
        is_active=True,
        created_at=now,
        updated_at=now,
        specifications={
            "Processor": "Apple M3 Max 14-core",
            "RAM": "36GB Unified Memory",
            "Storage": "1TB SSD",
            "Display": "16.2-inch Liquid Retina XDR",
        },
    )
    p2 = Product(
        id=uuid.uuid4(),
        category_id=cat.id,
        name="Dell XPS 15",
        sku="XPS-15-002",
        price=Decimal("179900.00"),
        is_active=True,
        created_at=now,
        updated_at=now,
        specifications={
            "Processor": "Intel Core i7-13700H",
            "RAM": "16GB DDR5",
            "Storage": "512GB NVMe SSD",
            "Display": "15.6-inch 3.5K OLED Touch",
        },
    )
    p1_id = str(p1.id)
    p2_id = str(p2.id)
    p1_name = p1.name
    p2_name = p2.name
    p1_price = p1.price
    p2_price = p2.price

    print(f"Products under test: '{p1_name}' (₹{p1_price}) and '{p2_name}' (₹{p2_price})", flush=True)

    # -------------------------------------------------------------
    # USP 1: COMPAROR
    # -------------------------------------------------------------
    print("\n--- 1. Testing Comparor (POST /api/v1/comparor/analyze) ---", flush=True)

    # 1.1: Missing key fallback
    with patch.object(GeminiService, "is_available", return_value=False):
        res = client.post(
            "/api/v1/comparor/analyze",
            json={"product_ids": [p1_id, p2_id]},
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["is_ai_powered"] is False, "Fallback must set is_ai_powered=False"
        assert len(data["product_analyses"]) == 2, "Fallback must analyze both products"
        assert "optimal value" in data["verdict"].lower(), "Fallback must generate reasoned verdict"
        print("✓ Comparor deterministic fallback operates seamlessly when Gemini is unconfigured", flush=True)

    # 1.2: Mock Gemini AI Analysis
    mock_comparor_ai = {
        "executive_summary": "In-depth AI specification comparison.",
        "key_differences": ["Processor throughput", "Memory capacity"],
        "verdict": f"{p1.name} delivers maximum performance, while {p2.name} is cost-effective.",
        "product_analyses": [
            {
                "product_id": p1_id,
                "name": p1.name,
                "pros": ["Superior multi-core throughput"],
                "cons": ["Higher price bracket"],
                "ideal_for": "Software Engineering & Data Analysis",
                "value_rating": "Power User Pick"
            },
            {
                "product_id": p2_id,
                "name": p2.name,
                "pros": ["Affordable entry point"],
                "cons": ["Moderate memory bandwidth"],
                "ideal_for": "Students & Everyday Tasks",
                "value_rating": "Best Value Champion"
            }
        ],
        "persona_recommendations": {
            "Developer": p1.name,
            "Student": p2.name
        },
        "best_overall_id": p1_id,
        "best_value_id": p2_id
    }

    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_json", return_value=mock_comparor_ai):
        res = client.post(
            "/api/v1/comparor/analyze",
            json={"product_ids": [p1_id, p2_id], "context": "developer"},
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["is_ai_powered"] is True, "AI response must set is_ai_powered=True"
        assert data["model_used"] is not None, "Model used must be recorded"
        assert len(data["product_analyses"]) == 2, "AI response must contain product analyses"
        assert data["persona_recommendations"]["Developer"] == p1.name
        print("✓ Comparor AI analysis generates structured persona recommendations & trade-offs", flush=True)

    # 1.3: Hallucinated product ID drop
    fake_uuid = str(uuid.uuid4())
    mock_hallucinated = dict(mock_comparor_ai)
    mock_hallucinated["product_analyses"] = [
        {
            "product_id": fake_uuid,
            "name": "Hallucinated Phantom Product",
            "pros": ["Magic"],
            "cons": ["Fake"],
            "ideal_for": "No one",
            "value_rating": "None"
        },
        {
            "product_id": p1_id,
            "name": p1.name,
            "pros": ["Real"],
            "cons": ["Real"],
            "ideal_for": "Real User",
            "value_rating": "Good"
        },
        {
            "product_id": p2_id,
            "name": p2.name,
            "pros": ["Real"],
            "cons": ["Real"],
            "ideal_for": "Real User",
            "value_rating": "Good"
        }
    ]
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_json", return_value=mock_hallucinated):
        res = client.post(
            "/api/v1/comparor/analyze",
            json={"product_ids": [p1_id, p2_id]},
        )
        assert res.status_code == 200
        data = res.json()
        returned_ids = [pa["product_id"] for pa in data["product_analyses"]]
        assert fake_uuid not in returned_ids, "Hallucinated product ID must be rejected by server validation"
        print("✓ Comparor strictly drops hallucinated product IDs not in requested set", flush=True)

    # -------------------------------------------------------------
    # USP 2: NEGOTIATOR
    # -------------------------------------------------------------
    print("\n--- 2. Testing Negotiator (POST /api/v1/negotiations/...) ---", flush=True)

    # 2.1: Start negotiation
    res = client.post("/api/v1/negotiations/start", json={"product_id": p1_id})
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    sess_data = res.json()
    sess_id = sess_data["id"]
    original_price = Decimal(str(p1.price))
    print(f"✓ Negotiation session created successfully (Session ID: {sess_id})", flush=True)

    # 2.2: Price floor enforcement: Customer offers < 70% (50% discount) -> Must be REJECTED
    low_offer = float((original_price * Decimal("0.50")).quantize(Decimal("0.01")))
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_text", return_value="We cannot honor this pricing tier due to distributor floor requirements."):
        res = client.post(f"/api/v1/negotiations/{sess_id}/offer", json={"offer": low_offer})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "rejected", f"Expected rejected, got {data['status']}"
        assert data["round_number"] == 1
        print("✓ Offers < 70% are strictly REJECTED by deterministic pricing floor", flush=True)

    # 2.3: Counteroffer in negotiable range (75% offer) -> Status: counteroffer
    res_start2 = client.post("/api/v1/negotiations/start", json={"product_id": p1_id})
    sess_id2 = res_start2.json()["id"]
    mid_offer = float((original_price * Decimal("0.75")).quantize(Decimal("0.01")))
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_text", return_value="We appreciate your offer! We can meet you with our clearance counteroffer."):
        res = client.post(f"/api/v1/negotiations/{sess_id2}/offer", json={"offer": mid_offer})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "counteroffer"
        assert data["counter_offer"] is not None
        assert data["counter_offer"] > mid_offer
        assert data["counter_offer"] <= float(original_price)
        assert data["is_ai_powered"] is True, "Must flag is_ai_powered=True when Gemini dialogue generated"
        print("✓ Counteroffer generated with AI merchant dialogue and strictly clamped price boundaries", flush=True)

    # 2.4: Auto-Accept for reasonable offers >= 90%
    res_start3 = client.post("/api/v1/negotiations/start", json={"product_id": p1_id})
    sess_id3 = res_start3.json()["id"]
    high_offer = float((original_price * Decimal("0.92")).quantize(Decimal("0.01")))
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_text", return_value="Offer approved! Welcome to the Patronet family."):
        res = client.post(f"/api/v1/negotiations/{sess_id3}/offer", json={"offer": high_offer})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "accepted"
        assert data["agreed_price"] == high_offer
        print("✓ Offers >= 90% are automatically ACCEPTED by backend business logic", flush=True)

    # 2.5: 3-round limit strictly enforced
    res_start4 = client.post("/api/v1/negotiations/start", json={"product_id": p1_id})
    sess_id4 = res_start4.json()["id"]
    for r in range(1, 4):
        res = client.post(f"/api/v1/negotiations/{sess_id4}/offer", json={"offer": mid_offer})
        assert res.status_code == 200
        assert res.json()["round_number"] == r
    # 4th offer must be rejected with 400
    res_r4 = client.post(f"/api/v1/negotiations/{sess_id4}/offer", json={"offer": mid_offer})
    assert res_r4.status_code == 400, f"Expected 400, got {res_r4.status_code}"
    assert "Maximum negotiation rounds" in res_r4.json()["detail"]
    print("✓ Maximum 3 rounds rule is strictly enforced by server", flush=True)

    # -------------------------------------------------------------
    # USP 3: SHOPPING BUDDY
    # -------------------------------------------------------------
    print("\n--- 3. Testing Shopping Buddy (POST /api/v1/assistant/chat) ---", flush=True)

    # 3.1: Fallback when Gemini unconfigured
    with patch.object(GeminiService, "is_available", return_value=False):
        res = client.post(
            "/api/v1/assistant/chat",
            json={"message": "laptop for programming under 200000"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_ai_powered"] is False
        assert len(data["recommendations"]) > 0
        print("✓ Shopping Buddy fallback responds with catalogue products when Gemini is unavailable", flush=True)

    # 3.2: AI-powered recommendations grounded in real catalogue
    mock_assistant_ai = {
        "reply": f"For your programming workload, the **{p1.name}** is an ideal workstation.",
        "recommendations": [
            {
                "id": p1_id,
                "match_reason": "Top-tier specifications for multi-tasking and compilation.",
                "key_specs": {"RAM": "36GB", "CPU": "Apple M3 Max"}
            }
        ],
        "suggested_queries": ["Compare with alternative", "Warranty information"]
    }
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_json", return_value=mock_assistant_ai):
        res = client.post(
            "/api/v1/assistant/chat",
            json={"message": "developer laptop"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_ai_powered"] is True
        assert data["model_used"] is not None
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["id"] == p1_id
        assert data["recommendations"][0]["price"] == float(p1.price)
        print("✓ Shopping Buddy returns verified catalogue items with AI reasoning and model badge", flush=True)

    # 3.3: Rejection of hallucinated product ID
    mock_assistant_hallucinated = {
        "reply": "Picks for you:",
        "recommendations": [
            {
                "id": str(uuid.uuid4()),
                "match_reason": "Phantom product fabricated by LLM.",
                "key_specs": {}
            },
            {
                "id": p1_id,
                "match_reason": "Real catalogue item.",
                "key_specs": {}
            }
        ],
        "suggested_queries": ["More options"]
    }
    with patch.object(GeminiService, "is_available", return_value=True), \
         patch.object(GeminiService, "generate_json", return_value=mock_assistant_hallucinated):
        res = client.post(
            "/api/v1/assistant/chat",
            json={"message": "good hardware"},
        )
        assert res.status_code == 200
        data = res.json()
        rec_ids = [r["id"] for r in data["recommendations"]]
        assert p1_id in rec_ids
        assert len(rec_ids) == 1, "Hallucinated product ID must be discarded"
        print("✓ Shopping Buddy cross-checks database and discards hallucinated product IDs", flush=True)

    print("\n=======================================================", flush=True)
    print("ALL TESTS IN GEMINI 3-USP SUITE PASSED SUCCESSFULLY!")
    print("=======================================================\n", flush=True)


if __name__ == "__main__":
    test_gemini_suite()
