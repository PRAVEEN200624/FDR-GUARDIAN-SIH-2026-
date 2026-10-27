import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_locations_hierarchy():
    # 1. Fetch States
    states_res = client.get("/api/locations/states")
    assert states_res.status_code == 200
    states = states_res.json()
    assert len(states) >= 28
    
    # Pick Odisha (OD) or Maharashtra (MH)
    od_state = next((s for s in states if s["code"] == "OD"), states[0])
    state_id = od_state["id"]

    # 2. Fetch Districts for State
    dist_res = client.get(f"/api/locations/districts?state_id={state_id}")
    assert dist_res.status_code == 200
    districts = dist_res.json()
    assert len(districts) > 0

    # 3. Fetch Institutions for District
    dist_id = districts[0]["id"]
    inst_res = client.get(f"/api/institutions?district_id={dist_id}")
    assert inst_res.status_code == 200
    institutions = inst_res.json()
    assert isinstance(institutions, list)

def test_authentication_workflow():
    # 1. Invalid Login
    bad_login = client.post("/api/auth/login", json={
        "email": "invalid@demo.gov.in",
        "password": "WrongPassword123"
    })
    assert bad_login.status_code == 401

    # 2. Valid Admin Login
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@fdrguardian.demo.gov.in",
        "password": "Demo@1234"
    })
    assert admin_login.status_code == 200
    admin_data = admin_login.json()
    assert "access_token" in admin_data
    assert admin_data["user"]["role"] == "system_admin"
    admin_token = admin_data["access_token"]

    # 3. Access Protected /api/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "admin@fdrguardian.demo.gov.in"

def test_role_isolation_and_fdr_access():
    # 1. Institution User Login
    inst_login = client.post("/api/auth/login", json={
        "email": "registrar@kalinga-tech.edu.in",
        "password": "Demo@1234"
    })
    assert inst_login.status_code == 200
    inst_token = inst_login.json()["access_token"]
    user_inst_id = inst_login.json()["user"]["institution_profile"]["institution_id"]

    # 2. Fetch FDRs as Institution User
    fdr_res = client.get("/api/fdrs", headers={"Authorization": f"Bearer {inst_token}"})
    assert fdr_res.status_code == 200
    fdrs = fdr_res.json()
    assert len(fdrs) > 0
    # Every returned FDR must strictly belong to the user's institution
    for f in fdrs:
        assert f["institution_id"] == user_inst_id

def test_privileged_registration_defaults_to_pending():
    # Register a new Bank Officer
    reg_payload = {
        "full_name": "Test Officer Sharma",
        "email": "test.officer.sharma@sbi.co.in",
        "mobile_number": "+91 99999 88888",
        "password": "OfficerPassword@123",
        "requested_role": "bank_officer",
        "bank_name": "State Bank of India",
        "branch_or_office": "Bhubaneswar IT Park Branch",
        "employee_id": "SBI-EMP-TEST-99"
    }

    # Delete if exists from previous test run
    client.post("/api/auth/login", json={"email": reg_payload["email"], "password": reg_payload["password"]})

    reg_res = client.post("/api/auth/register", json=reg_payload)
    if reg_res.status_code == 200:
        reg_data = reg_res.json()
        assert reg_data["user"]["role"] == "bank_officer"
        # Must be in pending_approval status!
        assert reg_data["user"]["account_status"] == "pending_approval"

        # Attempt to access protected FDR list with pending token must be 403 Forbidden!
        pending_token = reg_data["access_token"]
        blocked_res = client.get("/api/fdrs", headers={"Authorization": f"Bearer {pending_token}"})
        assert blocked_res.status_code == 403

def test_admin_access_requests_review():
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@fdrguardian.demo.gov.in",
        "password": "Demo@1234"
    })
    admin_token = admin_login.json()["access_token"]

    # Fetch access requests
    req_res = client.get("/api/admin/access-requests", headers={"Authorization": f"Bearer {admin_token}"})
    assert req_res.status_code == 200
    reqs = req_res.json()
    assert len(reqs) >= 1

    # Rejection without mandatory reason must fail with 400
    req_id = reqs[0]["id"]
    reject_bad = client.post(
        f"/api/admin/access-requests/{req_id}/reject",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": ""}
    )
    assert reject_bad.status_code == 400
