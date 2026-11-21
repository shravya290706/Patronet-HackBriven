import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text

def verify():
    print("=" * 70)
    print("         PATRONET DATABASE VALIDATION & VERIFICATION REPORT")
    print("=" * 70)

    with engine.connect() as conn:
        # 1. Categories verification
        cats = conn.execute(text("""
            SELECT c.name, count(p.id) as product_count, c.id
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY c.name
        """)).fetchall()

        print("\n[1] CATEGORIES & PRODUCT COUNTS:")
        print(f"{'Category':<26} | {'Product Count':<14} | {'Category ID'}")
        print("-" * 70)
        total_prods_across_cats = 0
        for cat in cats:
            print(f"{cat[0]:<26} | {cat[1]:<14} | {cat[2]}")
            total_prods_across_cats += cat[1]
        print("-" * 70)
        print(f"{'Total Categories: ' + str(len(cats)):<26} | {'Total: ' + str(total_prods_across_cats):<14}")

        # 2. Products table metrics
        total_p = conn.execute(text("SELECT count(*) FROM products")).scalar()
        active_p = conn.execute(text("SELECT count(*) FROM products WHERE is_active = true")).scalar()
        inactive_p = conn.execute(text("SELECT count(*) FROM products WHERE is_active = false")).scalar()
        distinct_skus = conn.execute(text("SELECT count(DISTINCT sku) FROM products")).scalar()
        invalid_prices = conn.execute(text("SELECT count(*) FROM products WHERE price <= 0 OR price IS NULL")).scalar()
        null_names = conn.execute(text("SELECT count(*) FROM products WHERE name IS NULL OR trim(name) = ''")).scalar()
        null_cats = conn.execute(text("SELECT count(*) FROM products WHERE category_id IS NULL")).scalar()

        print("\n[2] PRODUCT INTEGRITY METRICS:")
        print(f"  Total Products in DB:       {total_p} (Target: 48)")
        print(f"  Active Products:            {active_p} (Target: 48)")
        print(f"  Inactive Products:          {inactive_p} (Target: 0)")
        print(f"  Distinct SKUs:              {distinct_skus} (Target: 48, No Duplicates)")
        print(f"  Invalid / Non-positive:     {invalid_prices} (Target: 0)")
        print(f"  Null / Empty Names:         {null_names} (Target: 0)")
        print(f"  Orphaned (No Category):     {null_cats} (Target: 0)")

        # 3. Product images verification
        total_imgs = conn.execute(text("SELECT count(*) FROM product_images")).scalar()
        primary_imgs = conn.execute(text("SELECT count(*) FROM product_images WHERE is_primary = true")).scalar()
        prods_with_primary = conn.execute(text("SELECT count(DISTINCT product_id) FROM product_images WHERE is_primary = true")).scalar()
        placeholder_imgs = conn.execute(text("""
            SELECT count(*) FROM product_images
            WHERE image_url LIKE '%placehold.co%'
               OR image_url LIKE '%via.placeholder.com%'
               OR image_url LIKE '%.svg'
        """)).scalar()

        print("\n[3] PRODUCT IMAGES METRICS:")
        print(f"  Total Images in DB:         {total_imgs}")
        print(f"  Primary Images Count:       {primary_imgs} (Target: 48)")
        print(f"  Products with Primary Img:  {prods_with_primary} (Target: 48)")
        print(f"  Placeholder / SVG Images:   {placeholder_imgs} (Target: 0)")

        # 4. Inventory verification
        total_inv = conn.execute(text("SELECT count(*) FROM inventory")).scalar()
        zero_inv = conn.execute(text("SELECT count(*) FROM inventory WHERE available_stock <= 0")).scalar()
        prods_with_inv = conn.execute(text("SELECT count(DISTINCT product_id) FROM inventory")).scalar()
        stores_count = conn.execute(text("SELECT count(*) FROM stores WHERE is_active = true")).scalar()

        print("\n[4] INVENTORY & STORES METRICS:")
        print(f"  Active Stores:              {stores_count} (Target: 12)")
        print(f"  Total Inventory Records:    {total_inv} (Target: 48 * 12 = 576)")
        print(f"  Products Stocked:           {prods_with_inv} (Target: 48)")
        print(f"  Zero / Negative Stock:      {zero_inv} (Target: 0)")

        # 5. Non-catalog tables preservation
        customers_cnt = conn.execute(text("SELECT count(*) FROM customers")).scalar()
        carts_cnt = conn.execute(text("SELECT count(*) FROM carts")).scalar()
        addresses_cnt = conn.execute(text("SELECT count(*) FROM addresses")).scalar()

        print("\n[5] UNRELATED APPLICATION TABLES PRESERVATION:")
        print(f"  Customers table count:      {customers_cnt} (Preserved: 2)")
        print(f"  Carts table count:          {carts_cnt} (Preserved: 2)")
        print(f"  Addresses table count:      {addresses_cnt} (Preserved: 2)")

        # 6. Detailed 48 Products Listing
        print("\n[6] COMPLETE 48-PRODUCT CURATED CATALOGUE:")
        prods = conn.execute(text("""
            SELECT c.name as category, p.sku, p.brand, p.name, p.price, pi.image_url
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
            ORDER BY c.name, p.sku
        """)).fetchall()

        print(f"{'Category':<22} | {'SKU':<11} | {'Brand':<15} | {'Price (INR)':<11} | {'Product Name':<50} | {'Primary Image'}")
        print("-" * 140)
        for p in prods:
            print(f"{p[0]:<22} | {p[1]:<11} | {p[2]:<15} | Rs.{p[4]:<8} | {p[3]:<50} | {p[5][:40]}...")

    print("=" * 70)

if __name__ == "__main__":
    verify()
