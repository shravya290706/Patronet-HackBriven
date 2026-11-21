import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text, inspect

def audit():
    insp = inspect(engine)
    tables = insp.get_table_names()
    print("=== DATABASE AUDIT ===")
    print("Tables found:", tables)

    with engine.connect() as conn:
        for t in tables:
            try:
                count = conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()
                print(f"Table: {t:<25} | Row count: {count}")
            except Exception as e:
                print(f"Table: {t:<25} | Error reading count: {e}")

        print("\n=== FOREIGN KEYS & CONSTRAINTS ===")
        for t in tables:
            fks = insp.get_foreign_keys(t)
            if fks:
                print(f"Table: {t}")
                for fk in fks:
                    print(f"  constrained: {fk.get('constrained_columns')} -> {fk.get('referred_table')}.{fk.get('referred_columns')}")

    with engine.connect() as conn:
        print("\n=== CATEGORIES CURRENT SUMMARY ===")
        try:
            cats = conn.execute(text('SELECT c.id, c.name, count(p.id) as prod_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id, c.name ORDER BY prod_count DESC')).fetchall()
            print(f"Total categories: {len(cats)}")
            for cat in cats:
                print(f"  Category: {cat[1]:<30} | Products: {cat[2]} | ID: {cat[0]}")
        except Exception as e:
            print("Error querying categories:", e)

    with engine.connect() as conn:
        print("\n=== PRODUCTS & DEPENDENCIES SUMMARY ===")
        try:
            total_prods = conn.execute(text('SELECT count(*) FROM products')).scalar()
            active_prods = conn.execute(text('SELECT count(*) FROM products WHERE is_active = true')).scalar()
            images_count = conn.execute(text('SELECT count(*) FROM product_images')).scalar()
            inventory_count = conn.execute(text('SELECT count(*) FROM inventory')).scalar()
            cart_items_count = conn.execute(text('SELECT count(*) FROM cart_items')).scalar()
            wishlist_count = conn.execute(text('SELECT count(*) FROM wishlist_items')).scalar()
            order_items_count = conn.execute(text('SELECT count(*) FROM order_items')).scalar()
            stores_count = conn.execute(text('SELECT count(*) FROM stores')).scalar()
            customers_count = conn.execute(text('SELECT count(*) FROM customers')).scalar()
            carts_count = conn.execute(text('SELECT count(*) FROM carts')).scalar()
            orders_count = conn.execute(text('SELECT count(*) FROM orders')).scalar()

            print(f"Total products: {total_prods}")
            print(f"Active products: {active_prods}")
            print(f"Product images count: {images_count}")
            print(f"Inventory count: {inventory_count}")
            print(f"Stores count: {stores_count}")
            print(f"Cart items count: {cart_items_count}")
            print(f"Wishlist items count: {wishlist_count}")
            print(f"Order items count: {order_items_count}")
            print(f"Orders count: {orders_count}")
            print(f"Carts count: {carts_count}")
            print(f"Customers count: {customers_count}")

            # Inspect some sample cart items and order items
            print("\n=== CART ITEMS SAMPLES ===")
            cis = conn.execute(text('SELECT * FROM cart_items LIMIT 5')).mappings().all()
            for ci in cis:
                print(dict(ci))

            print("\n=== ORDER ITEMS SAMPLES ===")
            ois = conn.execute(text('SELECT * FROM order_items LIMIT 5')).mappings().all()
            for oi in ois:
                print(dict(oi))

            print("\n=== WISHLIST SAMPLES ===")
            wis = conn.execute(text('SELECT * FROM wishlist_items LIMIT 5')).mappings().all()
            for wi in wis:
                print(dict(wi))

            print("\n=== STORES LIST ===")
            stores = conn.execute(text('SELECT id, name, city FROM stores')).fetchall()
            for s in stores:
                print(f"  Store: {s[1]} ({s[2]}) -> {s[0]}")

        except Exception as e:
            print("Error querying product stats:", e)

if __name__ == "__main__":
    audit()
