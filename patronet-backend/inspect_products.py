from dotenv import load_dotenv
import os
import psycopg
from pprint import pprint

load_dotenv("patronet-backend/.env", override=True)

conn = psycopg.connect(os.getenv("DATABASE_URL"), connect_timeout=10)
cur = conn.cursor()

cur.execute("""
    SELECT
        p.id,
        p.name,
        p.brand,
        p.sku,
        p.price,
        p.description,
        c.name AS category,
        p.specifications,
        pi.image_url
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi
        ON pi.product_id = p.id AND pi.is_primary = TRUE
    WHERE p.is_active = TRUE
    LIMIT 5
""")

columns = [desc[0] for desc in cur.description]

for row in cur.fetchall():
    pprint(dict(zip(columns, row)))
    print("-" * 80)

cur.close()
conn.close()
