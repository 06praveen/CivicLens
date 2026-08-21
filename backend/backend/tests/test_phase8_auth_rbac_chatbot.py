"""
test_phase8_auth_rbac_chatbot.py — Comprehensive Verification Suite
Tests:
1. Public vs Protected Endpoints
2. User Registration (Role = "user")
3. Admin Security & Role-Based Access Control (403 Forbidden for normal user)
4. Admin Authorization (200 OK for Admin)
5. Ask CivicLens Chatbot End-to-End with Gemini AI Integration & Sources
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phase8_complete_suite():
    print("==================================================")
    print("VERIFYING PHASE 8 — AUTHENTICATION, RBAC & ASK CIVICLENS")
    print("==================================================\n")

    # TEST 1 — Public Root & Health Access
    r_root = client.get("/")
    assert r_root.status_code == 200
    r_health = client.get("/health")
    assert r_health.status_code == 200
    print("TEST 1 — Public Routes (Home & Health): PASS")

    # TEST 2 — Register Normal Citizen Account (Role = "user")
    reg_payload = {
        "email": "citizen.january@civiclens.gov.in",
        "username": "citizenjanuary",
        "password": "CitizenPassword123!",
        "full_name": "January Citizen User"
    }
    r_reg = client.post("/api/auth/register", json=reg_payload)
    if r_reg.status_code == 400 and "already exists" in r_reg.text:
        print("User citizenjanuary already registered.")
        # Login instead
        r_login = client.post("/api/auth/login", json={"username_or_email": reg_payload["email"], "password": reg_payload["password"]})
        user_token = r_login.json()["access_token"]
        user_info = r_login.json()["user"]
    else:
        assert r_reg.status_code == 201, f"Registration failed: {r_reg.text}"
        user_token = r_reg.json()["access_token"]
        user_info = r_reg.json()["user"]

    assert user_info["role"] == "user", "Normal registration MUST always create role='user'"
    print(f"TEST 2 — User Registration (Role: {user_info['role']}): PASS")

    # TEST 3 — Admin Account Login & Role Verification
    admin_login = {
        "username_or_email": "admin@civiclens.gov.in",
        "password": "CivicLensAdmin2026!"
    }
    r_admin_login = client.post("/api/auth/login", json=admin_login)
    assert r_admin_login.status_code == 200, f"Admin login failed: {r_admin_login.text}"
    admin_data = r_admin_login.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "admin"
    print(f"TEST 3 — Admin Login & Bootstrap (Role: {admin_data['user']['role']}): PASS")

    # TEST 4 — Backend RBAC Security (Normal User accessing Admin Endpoint -> 403 Forbidden)
    headers_user = {"Authorization": f"Bearer {user_token}"}
    r_denied = client.get("/api/admin/dashboard", headers=headers_user)
    assert r_denied.status_code == 403, f"Expected 403 Forbidden, got {r_denied.status_code}"
    print("TEST 4 — Normal User Admin Access Prevention (403 Forbidden): PASS")

    # TEST 5 — Backend RBAC Authorization (Admin accessing Admin Endpoint -> 200 OK)
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    r_admin_dash = client.get("/api/admin/dashboard", headers=headers_admin)
    assert r_admin_dash.status_code == 200
    dash_data = r_admin_dash.json()
    assert dash_data["admin"]["role"] == "admin"
    print("TEST 5 — Admin Endpoint Access Authorization (200 OK): PASS")

    # TEST 6 — Ask CivicLens Chatbot End-to-End with Gemini AI Integration
    chat_payload = {
        "question": "What is the allocation for PM-KISAN in 2024-2025?",
        "financial_year": "2024-2025"
    }
    r_chat = client.post("/api/assistant/ask", json=chat_payload, headers=headers_user)
    assert r_chat.status_code == 200
    chat_res = r_chat.json()
    assert "answer" in chat_res
    assert len(chat_res["answer"]) > 10
    assert "sources" in chat_res
    assert len(chat_res["sources"]) > 0
    print("TEST 6 — Ask CivicLens Chatbot Real Gemini API & Context Retrieval:")
    print(f"  -> Intent: {chat_res['intent']}")
    print(f"  -> Answer: {chat_res['answer'][:120]}...")
    print(f"  -> Sources Count: {len(chat_res['sources'])}")
    print("TEST 6 — Ask CivicLens End-to-End: PASS")

    print("\n>>> ALL AUTHENTICATION, RBAC & ASK CIVICLENS INTEGRATION TESTS PASSED! <<<")

if __name__ == "__main__":
    test_phase8_complete_suite()
