import asyncio
from datetime import datetime, timezone
import sys
from unittest.mock import AsyncMock, patch
from uuid import uuid4

sys.path.insert(0, "patronet-backend")

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
    name="Apple MacBook Pro 16",
    sku="T-1",
    price=200000,
    is_active=True,
    created_at=now,
    specifications={"RAM": "16GB"}
)
p2 = app.models.catalog.Product(
    id=uuid4(),
    category_id=cat.id,
    name="Dell XPS 15",
    sku="T-2",
    price=150000,
    is_active=True,
    created_at=now,
    specifications={"RAM": "32GB"}
)
s.add_all([p, p2])
s.commit()
print("1 - Commit done", flush=True)

from app.services.comparor_service import ComparorService
from app.services.gemini_service import GeminiService
from app.schemas.comparor import ComparorAnalysisRequest

async def run_ai():
    print("2 - Inside run_ai", flush=True)
    req = ComparorAnalysisRequest(product_ids=[p.id, p2.id])
    print("3 - Request created", flush=True)
    res = ComparorService._deterministic_fallback([p, p2], "General")
    print("4 - Fallback worked:", res.verdict, flush=True)

asyncio.run(run_ai())
print("5 - All done", flush=True)
