import sys
sys.path.insert(0, "patronet-backend")
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
import app.models.customer, app.models.catalog, app.models.negotiation, app.models.cart

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
s = sessionmaker(bind=engine)()
now = datetime.now(timezone.utc)
cat = app.models.catalog.Category(id=uuid4(), name="Laptops", created_at=now)
s.add(cat)
s.commit()

p = app.models.catalog.Product(
    id=uuid4(),
    category_id=cat.id,
    name="Test",
    sku="T-1",
    price=100,
    is_active=True,
    created_at=now,
    specifications={"RAM": "16GB"}
)
p2 = app.models.catalog.Product(
    id=uuid4(),
    category_id=cat.id,
    name="Test 2",
    sku="T-2",
    price=200,
    is_active=True,
    created_at=now,
    specifications={"RAM": "32GB"}
)
s.add_all([p, p2])
s.commit()
print("Commit done", flush=True)

res = s.query(app.models.catalog.Product).filter(app.models.catalog.Product.id.in_([p.id, p2.id])).all()
print(f"Query returned {len(res)} products", flush=True)

from app.services.comparor_service import ComparorService
res_fallback = ComparorService._deterministic_fallback(res, "General")
print(f"Fallback generated: {res_fallback.verdict}", flush=True)

import asyncio
from unittest.mock import AsyncMock, patch

async def run_ai_test():
    mock_res = {
        "executive_summary": "Summary",
        "key_differences": ["Diff 1"],
        "verdict": "Mock AI Verdict",
        "product_analyses": [
            {"product_id": str(p.id), "name": p.name, "pros": ["Pro"], "cons": ["Con"], "ideal_for": "Dev", "value_rating": "Best"},
            {"product_id": str(p2.id), "name": p2.name, "pros": ["Pro"], "cons": ["Con"], "ideal_for": "Student", "value_rating": "Good"}
        ],
        "persona_recommendations": {"Dev": p.name},
        "best_overall_id": str(p.id),
        "best_value_id": str(p2.id)
    }
    with patch("app.services.comparor_service.GeminiService.is_available", return_value=True), \
         patch("app.services.comparor_service.GeminiService.generate_json", new_callable=AsyncMock) as mock_json:
        mock_json.return_value = mock_res
        from app.schemas.comparor import ComparorAnalysisRequest
        res_ai = await ComparorService.analyze_comparison(s, ComparorAnalysisRequest(product_ids=[p.id, p2.id]))
        print(f"AI Success: is_ai_powered={res_ai.is_ai_powered}, verdict={res_ai.verdict}", flush=True)

asyncio.run(run_ai_test())
