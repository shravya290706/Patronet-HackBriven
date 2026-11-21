"""
PATRONET E2E Shopping Cart Integration Test Suite.
Tests all 18 cases required for Phase 6 against the live FastAPI backend & PostgreSQL:
1. Fetch cart while logged in (empty cart)
2. Fetch empty cart response structure
3. Add one product (POST /api/v1/cart/items)
4. Add same product again (increments quantity, no duplicate line)
5. Verify quantity behavior & subtotals
6. Increase quantity (PATCH /api/v1/cart/items/{id})
7. Decrease quantity (PATCH /api/v1/cart/items/{id})
8. Attempt quantity 0 or negative (rejected with 422)
9. Attempt quantity beyond stock (rejected with 400)
10. Remove one product (DELETE /api/v1/cart/items/{id})
11. Clear the entire cart (DELETE /api/v1/cart)
12. Verify persistence after simulated refresh (GET /api/v1/cart persists in DB)
13. Verify unauthenticated cart request is rejected (HTTP 401)
14. Verify customer isolation: Customer B cannot access or modify Customer A's cart
15. Verify account switching does not leak cart data
16. Verify total quantity count calculation
17. Add product from catalogue simulation (with real product ID)
18. Add product from detail page simulation (with custom quantity)
"""
import json
import sys
import urllib.error
import urllib.request
import uuid
from decimal import Decimal
from sqlalchemy import text

sys.path.insert(0, "patronet-backend")
from app.core.database import SessionLocal

BASE_URL = "http://127.0.0.1:8000/api/v1"


def api_call(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    try:
        with urllib.request.urlopen(req, data=payload) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = err_body
        return e.code, parsed


def run_test_suite():
    print("==================================================================")
    print("      PATRONET E2E SHOPPING CART INTEGRATION TEST SUITE           ")
    print("==================================================================")

    # Pick 2 active products from our curated demo catalogue
    with SessionLocal() as db:
        products = db.execute(
            text(
                "SELECT p.id, p.name, p.price, COALESCE(sum(i.available_stock), 0) as stock "
                "FROM products p "
                "JOIN inventory i ON p.id = i.product_id "
                "WHERE p.is_active = true "
                "GROUP BY p.id, p.name, p.price "
                "ORDER BY p.name "
                "LIMIT 2"
            )
        ).fetchall()
        assert len(products) >= 2, "Need at least 2 active products with inventory"
        prod1_id, prod1_name, prod1_price, prod1_stock = products[0]
        prod2_id, prod2_name, prod2_price, prod2_stock = products[1]

    print(f"Product 1: {prod1_name} ({prod1_id}) | Price: Rs.{prod1_price} | Stock: {prod1_stock}")
    print(f"Product 2: {prod2_name} ({prod2_id}) | Price: Rs.{prod2_price} | Stock: {prod2_stock}")

    # Register Customer A
    uid_a = uuid.uuid4().hex[:8]
    email_a = f"cart_e2e_a_{uid_a}@patronet.com"
    pwd_a = "SecurePass123!"
    st, reg_a = api_call("/auth/register", method="POST", data={
        "name": f"Cart User A {uid_a}",
        "email": email_a,
        "password": pwd_a
    })
    assert st == 201, f"Failed to register User A: {reg_a}"
    token_a = reg_a["access_token"]
    user_a_id = reg_a["customer"]["id"]

    # Register Customer B
    uid_b = uuid.uuid4().hex[:8]
    email_b = f"cart_e2e_b_{uid_b}@patronet.com"
    pwd_b = "SecurePass123!"
    st, reg_b = api_call("/auth/register", method="POST", data={
        "name": f"Cart User B {uid_b}",
        "email": email_b,
        "password": pwd_b
    })
    assert st == 201, f"Failed to register User B: {reg_b}"
    token_b = reg_b["access_token"]
    user_b_id = reg_b["customer"]["id"]

    try:
        # 1. Fetch cart while logged in (empty cart)
        print("\n[Test 1 & 2] Fetching initial empty cart for Customer A...")
        st, cart_res = api_call("/cart", token=token_a)
        assert st == 200, f"Expected 200, got {st}"
        assert cart_res["items"] == []
        assert cart_res["total_items"] == 0
        assert cart_res["total_quantity"] == 0
        assert Decimal(str(cart_res["cart_total"])) == Decimal("0.00")
        print("✓ Verified Customer A initial cart is empty (total: 0.00, items: 0)")

        # 3. Add one product
        print(f"\n[Test 3] Adding Product 1 (quantity 1) to cart...")
        st, cart_res = api_call("/cart/items", method="POST", token=token_a, data={
            "product_id": str(prod1_id),
            "quantity": 1
        })
        assert st == 200
        assert cart_res["total_items"] == 1
        assert cart_res["total_quantity"] == 1
        assert len(cart_res["items"]) == 1
        item0 = cart_res["items"][0]
        assert item0["product_id"] == str(prod1_id)
        assert item0["quantity"] == 1
        assert Decimal(str(item0["subtotal"])) == Decimal(str(prod1_price))
        print("✓ Successfully added 1 × Product 1 to cart")

        # 4 & 5. Add same product again (increments quantity, no duplicate line)
        print(f"\n[Test 4 & 5] Adding Product 1 again (quantity 2)...")
        st, cart_res = api_call("/cart/items", method="POST", token=token_a, data={
            "product_id": str(prod1_id),
            "quantity": 2
        })
        assert st == 200
        assert cart_res["total_items"] == 1, "Must NOT create duplicate line for same product"
        assert cart_res["total_quantity"] == 3
        item0 = cart_res["items"][0]
        assert item0["quantity"] == 3
        expected_subtotal = (Decimal(str(prod1_price)) * 3).quantize(Decimal("0.01"))
        assert Decimal(str(item0["subtotal"])) == expected_subtotal
        print(f"✓ Quantity incremented to 3 without duplicate rows. Subtotal: Rs.{expected_subtotal}")

        # 6. Increase quantity (PATCH /cart/items/{id})
        print(f"\n[Test 6] Updating Product 1 quantity to 4 via PATCH...")
        st, cart_res = api_call(f"/cart/items/{prod1_id}", method="PATCH", token=token_a, data={
            "quantity": 4
        })
        assert st == 200
        item0 = next(it for it in cart_res["items"] if it["product_id"] == str(prod1_id))
        assert item0["quantity"] == 4
        assert cart_res["total_quantity"] == 4
        print("✓ Successfully updated Product 1 quantity to 4")

        # 7. Decrease quantity (PATCH /cart/items/{id})
        print(f"\n[Test 7] Decreasing Product 1 quantity to 2 via PATCH...")
        st, cart_res = api_call(f"/cart/items/{prod1_id}", method="PATCH", token=token_a, data={
            "quantity": 2
        })
        assert st == 200
        item0 = next(it for it in cart_res["items"] if it["product_id"] == str(prod1_id))
        assert item0["quantity"] == 2
        assert cart_res["total_quantity"] == 2
        print("✓ Successfully decreased Product 1 quantity to 2")

        # 8. Attempt quantity 0 or negative
        print("\n[Test 8] Attempting invalid quantities (0 and -1)...")
        st_zero, err_zero = api_call(f"/cart/items/{prod1_id}", method="PATCH", token=token_a, data={"quantity": 0})
        assert st_zero == 422, f"Expected 422 for qty 0, got {st_zero}"
        st_neg, err_neg = api_call(f"/cart/items/{prod1_id}", method="PATCH", token=token_a, data={"quantity": -2})
        assert st_neg == 422, f"Expected 422 for negative qty, got {st_neg}"
        print("✓ Rejected quantity 0 and negative quantities with HTTP 422")

        # 9. Attempt quantity beyond stock
        print(f"\n[Test 9] Attempting quantity ({prod1_stock + 100}) exceeding stock ({prod1_stock})...")
        st_excess, err_excess = api_call(f"/cart/items/{prod1_id}", method="PATCH", token=token_a, data={
            "quantity": prod1_stock + 100
        })
        assert st_excess == 400, f"Expected 400 for excess stock, got {st_excess}"
        print(f"✓ Excess quantity rejected with HTTP 400: {err_excess.get('detail')}")

        # Add Product 2 as well
        print(f"\n[Test 10 & 16] Adding Product 2 (quantity 3) to test multi-item totals...")
        st, cart_res = api_call("/cart/items", method="POST", token=token_a, data={
            "product_id": str(prod2_id),
            "quantity": 3
        })
        assert st == 200
        assert cart_res["total_items"] == 2
        assert cart_res["total_quantity"] == 5  # 2 + 3
        print(f"✓ Multi-item cart verified: total_items = 2, total_quantity = 5")

        # 10. Remove one product
        print(f"\n[Test 10] Removing Product 2 from cart (DELETE /cart/items/{prod2_id})...")
        st, cart_res = api_call(f"/cart/items/{prod2_id}", method="DELETE", token=token_a)
        assert st == 200
        assert cart_res["total_items"] == 1
        assert cart_res["total_quantity"] == 2
        assert all(it["product_id"] != str(prod2_id) for it in cart_res["items"])
        print("✓ Product 2 successfully removed from cart")

        # 11. Clear the entire cart
        print("\n[Test 11] Clearing the entire cart (DELETE /cart)...")
        st, cart_res = api_call("/cart", method="DELETE", token=token_a)
        assert st == 200
        assert cart_res["items"] == []
        assert cart_res["total_items"] == 0
        assert cart_res["total_quantity"] == 0
        assert Decimal(str(cart_res["cart_total"])) == Decimal("0.00")
        print("✓ Cart cleared: 0 items, total Rs.0.00")

        # 12. Verify persistence after simulated refresh
        print("\n[Test 12] Re-adding Product 1 and verifying database persistence on reload...")
        api_call("/cart/items", method="POST", token=token_a, data={"product_id": str(prod1_id), "quantity": 2})
        st_re, cart_re = api_call("/cart", token=token_a)
        assert st_re == 200
        assert cart_re["total_items"] == 1
        assert cart_re["total_quantity"] == 2
        with SessionLocal() as db:
            db_count = db.execute(
                text("SELECT count(*) FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.customer_id = :cid"),
                {"cid": user_a_id}
            ).scalar()
            assert db_count == 1, f"Expected 1 item in PostgreSQL, found {db_count}"
        print("✓ Verified cart items persist accurately in PostgreSQL across reloads")

        # 13. Verify unauthenticated cart request is rejected
        print("\n[Test 13] Verifying unauthenticated cart access is rejected...")
        st_unauth, _ = api_call("/cart", token=None)
        assert st_unauth == 401
        print("✓ Unauthenticated cart access rejected with HTTP 401 Unauthorized")

        # 14 & 15. Verify customer isolation: Customer B sees empty cart and cannot touch Customer A items
        print("\n[Test 14 & 15] Verifying customer isolation between Customer A and Customer B...")
        st_b, cart_b = api_call("/cart", token=token_b)
        assert st_b == 200
        assert cart_b["items"] == []
        assert cart_b["total_items"] == 0
        print("✓ Customer B cart is completely empty (no leakage from Customer A)")

        st_b_mod, err_b_mod = api_call(f"/cart/items/{prod1_id}", method="PATCH", token=token_b, data={"quantity": 1})
        assert st_b_mod == 404
        print(f"✓ Customer B cannot modify Customer A's item (rejected with HTTP 404: {err_b_mod.get('detail')})")

        # 17. Add product from catalogue simulation (with real product ID)
        print("\n[Test 17] Testing catalogue Quick Add simulation...")
        st_cat, cart_cat = api_call("/cart/items", method="POST", token=token_a, data={
            "product_id": str(prod2_id),
            "quantity": 1
        })
        assert st_cat == 200
        assert any(it["product_id"] == str(prod2_id) for it in cart_cat["items"])
        print("✓ Quick Add from catalogue simulation succeeded")

        # 18. Add product from detail page simulation (with quantity 3)
        print("\n[Test 18] Testing Product Detail Page Add with quantity = 3...")
        st_det, cart_det = api_call("/cart/items", method="POST", token=token_a, data={
            "product_id": str(prod2_id),
            "quantity": 3
        })
        assert st_det == 200
        prod2_item = next(it for it in cart_det["items"] if it["product_id"] == str(prod2_id))
        assert prod2_item["quantity"] == 4  # 1 earlier + 3 = 4
        print(f"✓ Detail page add with quantity 3 succeeded. Current quantity: {prod2_item['quantity']}")

    finally:
        # Cleanup
        print("\n[Cleanup] Cleaning up test customer records and cart items...")
        with SessionLocal() as db:
            for cid in [user_a_id, user_b_id]:
                carts = db.execute(text("SELECT id FROM carts WHERE customer_id = :cid"), {"cid": cid}).fetchall()
                for c in carts:
                    db.execute(text("DELETE FROM cart_items WHERE cart_id = :cart_id"), {"cart_id": c[0]})
                    db.execute(text("DELETE FROM carts WHERE id = :cart_id"), {"cart_id": c[0]})
                db.execute(text("DELETE FROM customers WHERE id = :cid"), {"cid": cid})
            db.commit()
        print("✓ Safely cleaned up test accounts and cart items from PostgreSQL.")

    print("\n==================================================================")
    print("      ALL 18 CART INTEGRATION TEST CASES PASSED WITH 100%! ✅     ")
    print("==================================================================")


if __name__ == "__main__":
    run_test_suite()
