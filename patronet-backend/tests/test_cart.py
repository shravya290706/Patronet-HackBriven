"""
Automated tests for Shopping Cart API:
- GET /api/v1/cart
- POST /api/v1/cart/items
- PATCH /api/v1/cart/items/{product_id}
- DELETE /api/v1/cart/items/{product_id}
- DELETE /api/v1/cart
"""
import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.core.database import SessionLocal
from app.main import app

client = TestClient(app)


def test_cart_full_suite():
    # 1. Fetch active products and an inactive product from DB for testing
    with SessionLocal() as db:
        active_prods = db.execute(
            text(
                "SELECT p.id, p.name, p.price, COALESCE(sum(i.available_stock), 0) as stock "
                "FROM products p "
                "JOIN inventory i ON p.id = i.product_id "
                "WHERE p.is_active = true "
                "GROUP BY p.id, p.name, p.price "
                "HAVING COALESCE(sum(i.available_stock), 0) > 10 "
                "ORDER BY p.name "
                "LIMIT 2"
            )
        ).fetchall()
        assert len(active_prods) >= 2, "Need at least 2 active products with stock"
        prod1_id, prod1_name, prod1_price, prod1_stock = active_prods[0]
        prod2_id, prod2_name, prod2_price, prod2_stock = active_prods[1]

        inactive_row = db.execute(
            text("SELECT id, name FROM products WHERE is_active = false LIMIT 1")
        ).fetchone()
        assert inactive_row is not None, "Need at least 1 inactive product"
        inactive_id, inactive_name = inactive_row

    print(f"Test Product 1: {prod1_name} ({prod1_id}), Price: {prod1_price}, Stock: {prod1_stock}")
    print(f"Test Product 2: {prod2_name} ({prod2_id}), Price: {prod2_price}, Stock: {prod2_stock}")
    print(f"Test Inactive Product: {inactive_name} ({inactive_id})")

    # 2. Register two dedicated test users for isolation testing
    uid_a = uuid.uuid4().hex[:8]
    email_a = f"carttest_a_{uid_a}@patronet.com"
    res_a = client.post(
        "/api/v1/auth/register",
        json={"name": f"User A {uid_a}", "email": email_a, "password": "Password123!"},
    )
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["customer"]["id"]

    uid_b = uuid.uuid4().hex[:8]
    email_b = f"carttest_b_{uid_b}@patronet.com"
    res_b = client.post(
        "/api/v1/auth/register",
        json={"name": f"User B {uid_b}", "email": email_b, "password": "Password123!"},
    )
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    user_b_id = res_b.json()["customer"]["id"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    try:
        print("\n--- 1. Testing Unauthenticated Access ---")
        unauth_res = client.get("/api/v1/cart")
        assert unauth_res.status_code == 401, f"Expected 401, got {unauth_res.status_code}"
        print("✓ Unauthenticated cart access rejected with 401")

        print("\n--- 2. Testing Empty Cart Retrieval ---")
        empty_res = client.get("/api/v1/cart", headers=headers_a)
        assert empty_res.status_code == 200
        empty_data = empty_res.json()
        assert empty_data["items"] == []
        assert empty_data["total_items"] == 0
        assert empty_data["total_quantity"] == 0
        assert Decimal(str(empty_data["cart_total"])) == Decimal("0.00")
        print("✓ Authenticated user with empty cart returns valid empty CartResponse")

        print("\n--- 3. Testing Adding Products Validation ---")
        # Inactive product
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": str(inactive_id), "quantity": 1},
        )
        assert r.status_code == 400
        assert "inactive" in r.json().get("detail", "").lower()
        print("✓ Inactive product rejected with 400")

        # Nonexistent product
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1},
        )
        assert r.status_code == 404
        print("✓ Nonexistent product rejected with 404")

        # Invalid UUID
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": "invalid-uuid-string", "quantity": 1},
        )
        assert r.status_code == 422
        print("✓ Invalid UUID rejected with 422")

        # Quantity 0
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": str(prod1_id), "quantity": 0},
        )
        assert r.status_code == 422
        print("✓ Quantity zero rejected with 422")

        # Negative quantity
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": str(prod1_id), "quantity": -3},
        )
        assert r.status_code == 422
        print("✓ Negative quantity rejected with 422")

        # Quantity exceeding available stock
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": str(prod1_id), "quantity": prod1_stock + 100},
        )
        assert r.status_code == 400
        assert "exceeds available stock" in r.json().get("detail", "").lower()
        print(f"✓ Excess quantity ({prod1_stock + 100} > {prod1_stock}) rejected with 400")

        print("\n--- 4. Testing Adding Valid Products ---")
        # Add Product 1 (quantity 2)
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": str(prod1_id), "quantity": 2},
        )
        assert r.status_code == 200
        cart_data = r.json()
        assert cart_data["total_items"] == 1
        assert cart_data["total_quantity"] == 2
        expected_subtotal = (Decimal(str(prod1_price)) * 2).quantize(Decimal("0.01"))
        assert Decimal(str(cart_data["items"][0]["subtotal"])) == expected_subtotal
        assert Decimal(str(cart_data["cart_total"])) == expected_subtotal
        print("✓ Valid product added successfully to cart")

        # Add Product 1 again (quantity 1) -> should increment quantity to 3, no duplicate row
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": str(prod1_id), "quantity": 1},
        )
        assert r.status_code == 200
        cart_data = r.json()
        assert cart_data["total_items"] == 1
        assert cart_data["total_quantity"] == 3
        assert cart_data["items"][0]["quantity"] == 3
        expected_subtotal = (Decimal(str(prod1_price)) * 3).quantize(Decimal("0.01"))
        assert Decimal(str(cart_data["items"][0]["subtotal"])) == expected_subtotal
        print("✓ Adding same product increments quantity without duplicate row")

        # Add Product 2 (quantity 1) -> 2 distinct items, total_quantity 4
        r = client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": str(prod2_id), "quantity": 1},
        )
        assert r.status_code == 200
        cart_data = r.json()
        assert cart_data["total_items"] == 2
        assert cart_data["total_quantity"] == 4
        expected_total = (expected_subtotal + Decimal(str(prod2_price))).quantize(Decimal("0.01"))
        assert Decimal(str(cart_data["cart_total"])) == expected_total
        print("✓ Adding second product updates total_items, total_quantity, and cart_total")

        print("\n--- 5. Testing Updating Item Quantity ---")
        # Valid update of product 1 to quantity 5
        r = client.patch(
            f"/api/v1/cart/items/{prod1_id}",
            headers=headers_a,
            json={"quantity": 5},
        )
        assert r.status_code == 200
        cart_data = r.json()
        prod1_item = next(it for it in cart_data["items"] if it["product_id"] == str(prod1_id))
        assert prod1_item["quantity"] == 5
        assert cart_data["total_quantity"] == 6  # 5 + 1
        print("✓ Item quantity updated to 5")

        # Update to 0 quantity (rejected with 422)
        r = client.patch(
            f"/api/v1/cart/items/{prod1_id}",
            headers=headers_a,
            json={"quantity": 0},
        )
        assert r.status_code == 422
        print("✓ Update to 0 rejected with 422")

        # Update beyond available stock
        r = client.patch(
            f"/api/v1/cart/items/{prod1_id}",
            headers=headers_a,
            json={"quantity": prod1_stock + 50},
        )
        assert r.status_code == 400
        print("✓ Update beyond stock rejected with 400")

        # Update item not in cart
        r = client.patch(
            "f0000000-0000-0000-0000-000000000000",
            headers=headers_a,
            json={"quantity": 1},
        )
        # Should be 404 (or 404 path not found)
        r = client.patch(
            "/api/v1/cart/items/00000000-0000-0000-0000-000000000000",
            headers=headers_a,
            json={"quantity": 1},
        )
        assert r.status_code == 404
        print("✓ Update nonexistent item rejected with 404")

        print("\n--- 6. Testing Cart Isolation Across Customers ---")
        # User B gets cart: must be empty
        r_b = client.get("/api/v1/cart", headers=headers_b)
        assert r_b.status_code == 200
        assert r_b.json()["items"] == []
        assert r_b.json()["total_items"] == 0

        # User B attempts to update User A's item: must fail with 404 (not in User B's cart)
        r_b_patch = client.patch(
            f"/api/v1/cart/items/{prod1_id}",
            headers=headers_b,
            json={"quantity": 1},
        )
        assert r_b_patch.status_code == 404
        assert "not in your cart" in r_b_patch.json().get("detail", "").lower()
        print("✓ Customer cart isolation verified: User B cannot view or modify User A's cart")

        print("\n--- 7. Testing Removing Items ---")
        # Remove product 2
        r = client.delete(f"/api/v1/cart/items/{prod2_id}", headers=headers_a)
        assert r.status_code == 200
        cart_data = r.json()
        assert cart_data["total_items"] == 1
        assert all(it["product_id"] != str(prod2_id) for it in cart_data["items"])
        print("✓ Product 2 removed from cart")

        # Remove nonexistent item
        r = client.delete(
            "/api/v1/cart/items/00000000-0000-0000-0000-000000000000",
            headers=headers_a,
        )
        assert r.status_code == 404
        print("✓ Removing nonexistent item returns 404")

        print("\n--- 8. Testing Clear Cart ---")
        # Clear populated cart
        r = client.delete("/api/v1/cart", headers=headers_a)
        assert r.status_code == 200
        cart_data = r.json()
        assert cart_data["items"] == []
        assert cart_data["total_items"] == 0
        assert cart_data["total_quantity"] == 0
        assert Decimal(str(cart_data["cart_total"])) == Decimal("0.00")
        print("✓ Cart cleared successfully, items array empty, total is 0.00")

        # Verify persistent cart still exists in DB
        with SessionLocal() as db:
            cart_row = db.execute(
                text("SELECT id, status FROM carts WHERE customer_id = :cid AND status = 'active'"),
                {"cid": user_a_id},
            ).fetchone()
            assert cart_row is not None, "Cart record must persist in DB after clearing items"
            items_count = db.execute(
                text("SELECT count(*) FROM cart_items WHERE cart_id = :cart_id"),
                {"cart_id": cart_row[0]},
            ).scalar()
            assert items_count == 0, "Cart items in DB must be 0"
        print("✓ Persistent cart record preserved in DB with 0 items")

        # Clear already-empty cart
        r = client.delete("/api/v1/cart", headers=headers_a)
        assert r.status_code == 200
        assert r.json()["items"] == []
        print("✓ Clearing already-empty cart returns 200 with empty cart")

    finally:
        # Clean up test accounts and their carts
        print("\n--- Cleaning up test accounts ---")
        with SessionLocal() as db:
            for cid in [user_a_id, user_b_id]:
                # find carts
                carts = db.execute(
                    text("SELECT id FROM carts WHERE customer_id = :cid"), {"cid": cid}
                ).fetchall()
                for c in carts:
                    db.execute(text("DELETE FROM cart_items WHERE cart_id = :cart_id"), {"cart_id": c[0]})
                    db.execute(text("DELETE FROM carts WHERE id = :cart_id"), {"cart_id": c[0]})
                db.execute(text("DELETE FROM customers WHERE id = :cid"), {"cid": cid})
            db.commit()
        print("✓ Cleaned up test customers and their cart rows")


if __name__ == "__main__":
    test_cart_full_suite()
    print("\nAll Cart tests passed successfully!")
