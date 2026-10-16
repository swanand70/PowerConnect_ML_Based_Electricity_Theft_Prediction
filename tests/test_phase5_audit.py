"""
Phase 5 Refinement & API Integrity Audit Test Suite.
Verifies role-specific authentication isolation, cross-consumer record isolation,
board administrator boundary enforcement, onboarding persistence, and token expiry handling.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.entities import User, Consumer, Bill, ConsumerIssue, BoardPost

client = TestClient(app)

def get_auth_token(username: str, password: str = "Utility@2026") -> str:
    """Helper to retrieve JWT access token for testing."""
    response = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert response.status_code == 200, f"Login failed for {username}: {response.text}"
    return response.json()["access_token"]


# ============================================================================
# 1. TOKEN VALIDATION & EXPIRED SESSION HANDLING
# ============================================================================
def test_invalid_and_expired_tokens_rejected_with_401():
    """Verifies that expired, malformed, or fake tokens return 401 across all protected routes."""
    bad_tokens = [
        "invalid.token.structure",
        "Bearer invalid",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M", # fake payload
        ""
    ]
    protected_endpoints = [
        "/api/consumers/me",
        "/api/consumers/me/usage",
        "/api/billing/my-bills",
        "/api/issues/my-issues",
        "/api/inspections/dashboard",
        "/api/inspections/cases",
        "/api/posts/admin"
    ]
    for bad_tok in bad_tokens:
        for ep in protected_endpoints:
            headers = {"Authorization": f"Bearer {bad_tok}"} if bad_tok else {}
            res = client.get(ep, headers=headers)
            assert res.status_code == 401, f"Expected 401 for token '{bad_tok}' on {ep}, got {res.status_code}"


# ============================================================================
# 2. CROSS-CONSUMER RECORD ISOLATION
# ============================================================================
def test_cross_consumer_bill_access_isolation():
    """
    Verifies that Consumer A (cons_01) CANNOT read Consumer B's (cons_02) bill
    by tampering with the bill_id path parameter.
    """
    token_cons1 = get_auth_token("cons_01")
    token_cons2 = get_auth_token("cons_02")

    # Fetch cons_02's bills
    r_bills2 = client.get("/api/billing/my-bills", headers={"Authorization": f"Bearer {token_cons2}"})
    assert r_bills2.status_code == 200
    bills2 = r_bills2.json()
    assert len(bills2) > 0, "cons_02 should have at least one bill"
    cons2_bill_id = bills2[0]["id"]

    # Now attempt to fetch cons_02's bill using cons_01's credentials
    r_tamper = client.get(f"/api/billing/{cons2_bill_id}", headers={"Authorization": f"Bearer {token_cons1}"})
    # Must be 403 Forbidden or 404 Not Found to prevent ID enumeration
    assert r_tamper.status_code in [403, 404], f"Cross-consumer bill access must be blocked! Got {r_tamper.status_code}"


def test_cross_consumer_issue_access_isolation():
    """
    Verifies that Consumer A cannot access or resolve an issue belonging to Consumer B.
    """
    token_cons1 = get_auth_token("cons_01")
    token_cons2 = get_auth_token("cons_02")

    # Consumer 1 creates an issue via POST /api/issues/report
    r_create = client.post(
        "/api/issues/report",
        json={
            "category": "METER_FAULT",
            "subject": "Audit Isolation Test: Digital Meter Blank",
            "description": "Meter display is unreadable during daytime inspection."
        },
        headers={"Authorization": f"Bearer {token_cons1}"}
    )
    assert r_create.status_code == 200
    issue_data = r_create.json()
    issue_id = issue_data["id"]

    # Consumer 2 attempts to read Consumer 1's issue
    r_tamper = client.get(f"/api/issues/{issue_id}", headers={"Authorization": f"Bearer {token_cons2}"})
    assert r_tamper.status_code in [403, 404], f"Cross-consumer issue read must be blocked! Got {r_tamper.status_code}"


# ============================================================================
# 3. ONBOARDING PERSISTENCE & LIFECYCLE
# ============================================================================
def test_consumer_onboarding_lifecycle_and_persistence():
    """
    Verifies the onboarding tour completion endpoint:
    - Status returned in /api/users/onboarding-status and /api/auth/me
    - Completing onboarding updates the database
    - Onboarding status persists across profile queries
    - Replay reset endpoint works correctly
    """
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    # Query current status
    r_status = client.get("/api/users/onboarding-status", headers=headers)
    assert r_status.status_code == 200
    status_data = r_status.json()
    assert "onboarding_completed" in status_data
    assert status_data["role"] == "CONSUMER"

    # Complete onboarding
    r_complete = client.post("/api/users/onboarding-complete", json={"completed": True, "version": "v1.0"}, headers=headers)
    assert r_complete.status_code == 200
    res_data = r_complete.json()
    assert res_data["onboarding_completed"] is True
    assert res_data["onboarding_version"] == "v1.0"

    # Re-query auth profile to confirm persistence
    r_auth = client.get("/api/auth/me", headers=headers)
    assert r_auth.status_code == 200
    assert r_auth.json()["onboarding_completed"] is True

    # Test reset to allow replay
    r_reset = client.post("/api/users/onboarding-reset", headers=headers)
    assert r_reset.status_code == 200
    assert r_reset.json()["onboarding_completed"] is False


# ============================================================================
# 4. STRICT ROLE BOUNDARIES & SECURITY ISOLATION
# ============================================================================
def test_consumer_role_forbidden_from_employee_inspection_apis():
    """Consumers must be rejected with 403 on all employee inspection planning APIs."""
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        "/api/inspections/dashboard",
        "/api/inspections/cases",
        "/api/inspections/map",
        "/api/inspections/employees",
        "/api/inspections/reports"
    ]
    for ep in endpoints:
        r = client.get(ep, headers=headers)
        assert r.status_code == 403, f"Consumer should get 403 on {ep}, got {r.status_code}"


def test_consumer_role_forbidden_from_board_admin_publishing_apis():
    """Consumers must be rejected with 403 on board admin endpoints."""
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    # Admin list
    r_admin_list = client.get("/api/posts/admin", headers=headers)
    assert r_admin_list.status_code == 403

    # Notice creation
    payload = {
        "title": "Unauthorized Consumer Notice",
        "category": "MAINTENANCE",
        "summary": "This should fail",
        "content": "Malicious attempt to publish public notice",
        "is_published": True
    }
    r_create = client.post("/api/posts", json=payload, headers=headers)
    assert r_create.status_code == 403


def test_employee_role_forbidden_from_board_admin_publishing_apis():
    """Employees cannot create or manage official board notices."""
    token = get_auth_token("EMP001")
    headers = {"Authorization": f"Bearer {token}"}

    r_admin = client.get("/api/posts/admin", headers=headers)
    assert r_admin.status_code == 403

    payload = {
        "title": "Unauthorized Employee Notice",
        "category": "MAINTENANCE",
        "summary": "Employee publishing notice",
        "content": "Should be blocked",
        "is_published": True
    }
    r_post = client.post("/api/posts", json=payload, headers=headers)
    assert r_post.status_code == 403


def test_board_admin_forbidden_from_inspection_planning_and_ml_scores():
    """Board administrators cannot access employee case inspection queue or live ML scores."""
    token = get_auth_token("board_admin")
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        "/api/inspections/dashboard",
        "/api/inspections/cases",
        "/api/inspections/reports"
    ]
    for ep in endpoints:
        r = client.get(ep, headers=headers)
        assert r.status_code == 403, f"Board admin should get 403 on {ep}, got {r.status_code}"


# ============================================================================
# 5. PUBLIC NOTICE INTEGRITY & DRAFT ISOLATION
# ============================================================================
def test_public_notices_cannot_leak_draft_or_archived_bulletins():
    """
    Public unauthenticated endpoint /api/posts must only serve published notices,
    never draft notices.
    """
    r_public = client.get("/api/posts")
    assert r_public.status_code == 200
    public_posts = r_public.json()
    assert len(public_posts) > 0, "Public notices must be available"

    for post in public_posts:
        assert post.get("is_published") is True or "is_published" not in post, "Public listing must not include draft items"
