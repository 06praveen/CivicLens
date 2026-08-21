"""
test_auth_integration.py — Integration test for User Register, Login, Me, and Logout APIs.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_flow():
    print("==================================================")
    print("TESTING USER AUTHENTICATION MODULE")
    print("==================================================\n")

    # 1. Register User
    reg_payload = {
        "email": "citizen.test@civiclens.gov.in",
        "username": "citizentest",
        "password": "SecurePassword123!",
        "full_name": "Test Citizen User"
    }

    r_reg = client.post("/api/auth/register", json=reg_payload)
    if r_reg.status_code == 400 and "already exists" in r_reg.text:
        print("User already registered, testing login...")
    else:
        assert r_reg.status_code == 201, f"Register failed: {r_reg.text}"
        data_reg = r_reg.json()
        assert "access_token" in data_reg
        assert data_reg["user"]["email"] == reg_payload["email"]
        assert data_reg["user"]["username"] == reg_payload["username"]
        print("1. User Registration: PASS")

    # 2. Duplicate Registration Prevention
    r_dup = client.post("/api/auth/register", json=reg_payload)
    assert r_dup.status_code == 400
    assert "already exists" in r_dup.text
    print("2. Duplicate Registration Prevention: PASS")

    # 3. User Login (via Email)
    login_payload = {
        "username_or_email": "citizen.test@civiclens.gov.in",
        "password": "SecurePassword123!"
    }
    r_login = client.post("/api/auth/login", json=login_payload)
    assert r_login.status_code == 200
    data_login = r_login.json()
    token = data_login["access_token"]
    assert token is not None
    print("3. User Login via Email: PASS")

    # 4. User Login (via Username)
    login_user_payload = {
        "username_or_email": "citizentest",
        "password": "SecurePassword123!"
    }
    r_login2 = client.post("/api/auth/login", json=login_user_payload)
    assert r_login2.status_code == 200
    print("4. User Login via Username: PASS")

    # 5. Invalid Password Prevention
    bad_login = {
        "username_or_email": "citizentest",
        "password": "WrongPassword!"
    }
    r_bad = client.post("/api/auth/login", json=bad_login)
    assert r_bad.status_code == 401
    print("5. Invalid Password Rejection: PASS")

    # 6. Current User Profile (/api/auth/me)
    headers = {"Authorization": f"Bearer {token}"}
    r_me = client.get("/api/auth/me", headers=headers)
    assert r_me.status_code == 200
    me_data = r_me.json()
    assert me_data["email"] == reg_payload["email"]
    assert me_data["username"] == reg_payload["username"]
    print("6. Current User Profile (/api/auth/me): PASS")

    # 7. Logout Endpoint
    r_out = client.post("/api/auth/logout", headers=headers)
    assert r_out.status_code == 200
    print("7. User Logout: PASS")

    print("\n>>> ALL USER AUTHENTICATION TESTS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    test_auth_flow()
