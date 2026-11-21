"""
Automated tests for Authentication API endpoints:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me
"""
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.core.database import SessionLocal
from app.main import app

client = TestClient(app)


def test_auth_full_flow():
    # Generate unique test user credentials
    uid = uuid.uuid4().hex[:8]
    test_email = f"authtest_{uid}@patronet.com"
    test_password = "SecurePassword123!"
    test_name = f"Test User {uid}"
    test_phone = "+19876543210"

    print("\n--- 1. Testing Validation on Registration ---")
    # Empty name
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "   ", "email": test_email, "password": test_password},
    )
    assert res.status_code == 422, f"Expected 422, got {res.status_code}: {res.text}"
    print("✓ Empty name rejected with 422")

    # Invalid email
    res = client.post(
        "/api/v1/auth/register",
        json={"name": test_name, "email": "not-an-email", "password": test_password},
    )
    assert res.status_code == 422, f"Expected 422, got {res.status_code}: {res.text}"
    print("✓ Invalid email rejected with 422")

    # Short password
    res = client.post(
        "/api/v1/auth/register",
        json={"name": test_name, "email": test_email, "password": "123"},
    )
    assert res.status_code == 422, f"Expected 422, got {res.status_code}: {res.text}"
    print("✓ Short password rejected with 422")

    print("\n--- 2. Testing Successful Registration ---")
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": test_name,
            "email": test_email,
            "password": test_password,
            "phone": test_phone,
        },
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["customer"]["email"] == test_email
    assert data["customer"]["name"] == test_name
    assert data["customer"]["phone"] == test_phone
    customer_id = data["customer"]["id"]
    registered_token = data["access_token"]
    print(f"✓ Registration succeeded for {test_email} (ID: {customer_id})")

    print("\n--- 3. Testing Duplicate Email Registration ---")
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Duplicate User",
            "email": test_email.upper(),  # test case-insensitivity
            "password": test_password,
        },
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    assert "already registered" in res.json().get("detail", "").lower()
    print("✓ Duplicate email (case-insensitive) rejected with 400")

    print("\n--- 4. Testing Login ---")
    # Correct login
    res = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": test_password},
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    login_data = res.json()
    assert "access_token" in login_data
    assert login_data["customer"]["email"] == test_email
    login_token = login_data["access_token"]
    print("✓ Login succeeded with valid credentials")

    # Incorrect password
    res = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "WrongPassword123!"},
    )
    assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
    assert "Invalid email or password" in res.json().get("detail", "")
    print("✓ Login with wrong password rejected with 401")

    # Nonexistent user
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@patronet.com", "password": test_password},
    )
    assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
    print("✓ Login with nonexistent user rejected with 401")

    print("\n--- 5. Testing GET /api/v1/auth/me ---")
    # Valid token
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_token}"},
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    me_data = res.json()
    assert me_data["id"] == customer_id
    assert me_data["email"] == test_email
    assert me_data["name"] == test_name
    print(f"✓ /auth/me succeeded for current user: {me_data['name']}")

    # Missing token
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
    assert "WWW-Authenticate" in res.headers
    print("✓ /auth/me without token rejected with 401")

    # Invalid / tampered token
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.payload"},
    )
    assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
    print("✓ /auth/me with invalid token rejected with 401")

    # Clean up test customer
    with SessionLocal() as db:
        db.execute(text("DELETE FROM customers WHERE id = :id"), {"id": customer_id})
        db.commit()
    print(f"✓ Cleaned up test customer {customer_id}")


if __name__ == "__main__":
    test_auth_full_flow()
    print("\nAll Auth API tests passed successfully!")
