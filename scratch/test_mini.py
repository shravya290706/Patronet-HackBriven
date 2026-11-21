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
print("Committed category successfully", flush=True)

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
s.add(p)
s.commit()
print("Committed product with specs successfully", flush=True)

import asyncio
from unittest.mock import patch
from app.services.gemini_service import GeminiService
from app.services.comparor_service import ComparorService
from app.schemas.comparor import ComparorAnalysisRequest

async def test_comp():
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
    s.add(p2)
    s.commit()
    with patch.object(GeminiService, "is_available", return_value=False):
        res = await ComparorService.analyze_comparison(db=s, req=ComparorAnalysisRequest(product_ids=[p.id, p2.id]))
        print(f"Comparor fallback success: {res.is_ai_powered}", flush=True)

asyncio.run(test_comp())
