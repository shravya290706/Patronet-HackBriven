import sys
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text
from scripts.test_catalog_images import curated_products

# Target 6 Categories definitions
TARGET_CATEGORIES = [
    {
        "name": "Electronics",
        "description": "Computing hardware, smartphones, audio wearables and digital accessories",
    },
    {
        "name": "Fashion",
        "description": "Men's and women's apparel, footwear, and contemporary casual wear",
    },
    {
        "name": "Grocery",
        "description": "Pantry essentials, staples, premium grains, beverages, and daily cooking needs",
    },
    {
        "name": "Home & Kitchen",
        "description": "Cookware, kitchen appliances, dining essentials, and home furnishings",
    },
    {
        "name": "Beauty & Personal Care",
        "description": "Skincare, haircare, personal grooming essentials, and wellness products",
    },
    {
        "name": "Accessories",
        "description": "Travel gear, leather goods, luxury timepieces, and lifestyle accessories",
    },
]

def reseed():
    print("=== PATRONET DATABASE CLEANUP & CURATED RESEED ===")
    now = datetime.now(timezone.utc)

    with engine.begin() as conn:
        # 1. Inspect existing stores
        stores = conn.execute(text("SELECT id, name, city FROM stores WHERE is_active = true")).fetchall()
        store_ids = [s[0] for s in stores]
        print(f"Loaded {len(store_ids)} active stores for pan-India inventory generation.")

        # 2. Clean dependent catalogue demo data
        print("Cleaning old product dependencies...")
        conn.execute(text("DELETE FROM cart_items"))
        conn.execute(text("DELETE FROM wishlist_items"))
        conn.execute(text("DELETE FROM order_items"))
        conn.execute(text("DELETE FROM orders"))
        conn.execute(text("DELETE FROM product_images"))
        conn.execute(text("DELETE FROM inventory"))
        conn.execute(text("DELETE FROM products"))
        conn.execute(text("DELETE FROM categories"))
        print("Old catalogue tables truncated cleanly.")

        # 3. Seed the 6 Target Categories
        category_map = {}
        for cat in TARGET_CATEGORIES:
            cat_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"category:{cat['name']}")
            conn.execute(
                text("""
                    INSERT INTO categories (id, name, description, created_at)
                    VALUES (:id, :name, :description, :created_at)
                """),
                {
                    "id": cat_id,
                    "name": cat["name"],
                    "description": cat["description"],
                    "created_at": now,
                }
            )
            category_map[cat["name"]] = cat_id
            print(f"Created category: '{cat['name']}' -> ID: {cat_id}")

        # 4. Seed the 48 Curated Products
        product_count = 0
        image_count = 0
        inventory_count = 0

        for p in curated_products:
            cat_id = category_map[p["category"]]
            prod_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"product:{p['sku']}")

            import json
            specs_json = json.dumps(p.get("specifications", {}))

            conn.execute(
                text("""
                    INSERT INTO products (
                        id, category_id, name, description, brand, sku, price, is_active, created_at, updated_at, specifications
                    ) VALUES (
                        :id, :category_id, :name, :description, :brand, :sku, :price, :is_active, :created_at, :updated_at, CAST(:specifications AS jsonb)
                    )
                """),
                {
                    "id": prod_id,
                    "category_id": cat_id,
                    "name": p["name"],
                    "description": p["description"],
                    "brand": p["brand"],
                    "sku": p["sku"],
                    "price": Decimal(str(p["price"])),
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                    "specifications": specs_json,
                }
            )
            product_count += 1

            # Seed Primary Image
            img_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"image:{p['sku']}:primary")
            conn.execute(
                text("""
                    INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
                    VALUES (:id, :product_id, :image_url, :is_primary, :display_order)
                """),
                {
                    "id": img_id,
                    "product_id": prod_id,
                    "image_url": p["primary_image"],
                    "is_primary": True,
                    "display_order": 0,
                }
            )
            image_count += 1

            # Seed Additional Images
            for idx, add_url in enumerate(p.get("additional_images", []), start=1):
                add_img_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"image:{p['sku']}:{idx}")
                conn.execute(
                    text("""
                        INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
                        VALUES (:id, :product_id, :image_url, :is_primary, :display_order)
                    """),
                    {
                        "id": add_img_id,
                        "product_id": prod_id,
                        "image_url": add_url,
                        "is_primary": False,
                        "display_order": idx,
                    }
                )
                image_count += 1

            # Seed Inventory for all 12 Stores
            # Stock between 15 and 45 units based on deterministic formula
            for store_idx, store_id in enumerate(store_ids, start=1):
                inv_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"inv:{p['sku']}:{store_id}")
                stock_qty = 15 + ((hash(p["sku"]) + store_idx * 7) % 31)
                conn.execute(
                    text("""
                        INSERT INTO inventory (id, product_id, store_id, available_stock, updated_at)
                        VALUES (:id, :product_id, :store_id, :available_stock, :updated_at)
                    """),
                    {
                        "id": inv_id,
                        "product_id": prod_id,
                        "store_id": store_id,
                        "available_stock": stock_qty,
                        "updated_at": now,
                    }
                )
                inventory_count += 1

        print(f"\nSuccessfully seeded:")
        print(f"  Categories: {len(category_map)}")
        print(f"  Products:   {product_count}")
        print(f"  Images:     {image_count}")
        print(f"  Inventory:  {inventory_count} (across {len(store_ids)} stores)")
        print("\nDatabase commit successful!")

if __name__ == "__main__":
    reseed()
