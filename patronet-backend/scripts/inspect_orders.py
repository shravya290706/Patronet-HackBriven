import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    orders = conn.execute(text('SELECT * FROM orders')).mappings().all()
    print("Orders:")
    for o in orders:
        print(dict(o))

    order_items = conn.execute(text('SELECT * FROM order_items')).mappings().all()
    print("\nOrder items:")
    for oi in order_items:
        print(dict(oi))
