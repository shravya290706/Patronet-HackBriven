import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api():
    print("=" * 60)
    print("        TESTING LIVE BACKEND CATALOGUE ENDPOINTS")
    print("=" * 60)

    # 1. GET /api/v1/categories
    req = urllib.request.Request(f"{BASE_URL}/categories")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        data = json.loads(resp.read().decode())
        print(f"\n[1] GET /api/v1/categories -> Status: {resp.status}")
        cats = data if isinstance(data, list) else data.get("items", [])
        print(f"    Returned {len(cats)} categories:")
        for c in cats:
            print(f"      - {c.get('name')} (Product count: {c.get('product_count') or c.get('productCount')})")
        assert len(cats) == 6, f"Expected 6 categories, got {len(cats)}"

    # 2. GET /api/v1/products
    req = urllib.request.Request(f"{BASE_URL}/products?limit=50")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        data = json.loads(resp.read().decode())
        print(f"\n[2] GET /api/v1/products?limit=50 -> Status: {resp.status}")
        total = data.get("pagination", {}).get("total", len(data.get("items", [])))
        items = data.get("items", [])
        print(f"    Total products reported in pagination: {total}")
        print(f"    Items in this page: {len(items)}")
        assert total == 48, f"Expected total 48, got {total}"
        sample_prod = items[0]
        sample_id = sample_prod["id"]
        sample_name = sample_prod["name"]
        print(f"    Sample product: '{sample_name}' (ID: {sample_id})")

    # 3. GET /api/v1/products/{id}
    req = urllib.request.Request(f"{BASE_URL}/products/{sample_id}")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        prod_data = json.loads(resp.read().decode())
        print(f"\n[3] GET /api/v1/products/{sample_id} -> Status: {resp.status}")
        print(f"    Name:  {prod_data.get('name')}")
        print(f"    Brand: {prod_data.get('brand')}")
        print(f"    Price: Rs.{prod_data.get('price')}")
        print(f"    SKU:   {prod_data.get('sku')}")
        print(f"    Images: {len(prod_data.get('images', []))} image(s)")
        if prod_data.get('images'):
            print(f"      Primary image URL: {prod_data['images'][0].get('image_url')}")

    # 4. GET /api/v1/products with category filter
    req = urllib.request.Request(f"{BASE_URL}/products?category=Electronics")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        cat_data = json.loads(resp.read().decode())
        cat_items = cat_data.get("items", [])
        print(f"\n[4] GET /api/v1/products?category=Electronics -> Status: {resp.status}")
        print(f"    Returned {len(cat_items)} products in Electronics category (Target: 8):")
        for item in cat_items:
            print(f"      - [{item.get('sku')}] {item.get('name')} (Rs.{item.get('price')})")
        assert len(cat_items) == 8, f"Expected 8 items, got {len(cat_items)}"

    # 5. Search test
    req = urllib.request.Request(f"{BASE_URL}/products?search=Sony")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        search_data = json.loads(resp.read().decode())
        search_items = search_data.get("items", [])
        print(f"\n[5] GET /api/v1/products?search=Sony -> Status: {resp.status}")
        print(f"    Found {len(search_items)} matches for 'Sony':")
        for item in search_items:
            print(f"      - {item.get('name')} by {item.get('brand')}")
        assert len(search_items) >= 1, "Expected at least 1 match for Sony"

    print("\n" + "=" * 60)
    print("ALL API ENDPOINT TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
