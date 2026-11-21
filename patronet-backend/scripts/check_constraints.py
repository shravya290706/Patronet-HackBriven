import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    constrs = conn.execute(text("""
        SELECT conname, confrelid::regclass, confdeltype
        FROM pg_constraint
        WHERE conrelid = 'order_items'::regclass
    """)).fetchall()
    print("Order items constraints:")
    for c in constrs:
        print(f"  {c[0]}: ref={c[1]}, on_delete={c[2]} (a=no action, r=restrict, c=cascade, n=set null, d=set default)")
