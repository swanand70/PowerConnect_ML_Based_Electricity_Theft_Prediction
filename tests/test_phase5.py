"""
Phase 5 Automated Test Suite: Consumer Portal & Board Communication Portal
Verifies consumer workflows, usage provenance, billing, issue lifecycle,
board post drafts vs publication, aggregate enforcement privacy, and strict role isolation.
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
# 1. CONSUMER AUTHENTICATION & PROFILE TESTS
# ============================================================================
def test_consumer_login_and_credential_validation():
    """Verifies that valid consumer credentials succeed and invalid are rejected."""
    # Valid login
    r_valid = client.post("/api/auth/login", json={"username_or_email": "cons_01", "password": "Utility@2026"})
    assert r_valid.status_code == 200
    data = r_valid.json()
    assert data["role"] == "CONSUMER"
    assert "access_token" in data

    # Invalid password
    r_bad = client.post("/api/auth/login", json={"username_or_email": "cons_01", "password": "WrongPassword"})
    assert r_bad.status_code == 401
    assert "Incorrect" in r_bad.json()["detail"]

    # Nonexistent consumer
    r_none = client.post("/api/auth/login", json={"username_or_email": "nonexistent_consumer_999", "password": "Utility@2026"})
    assert r_none.status_code == 401


def test_consumer_profile_and_anti_theft_isolation():
    """
    Verifies that consumer profile loads correctly and NEVER leaks internal
    theft risk scores, suspect flags, or SHAP factors.
    """
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    r_prof = client.get("/api/consumers/me", headers=headers)
    assert r_prof.status_code == 200
    prof = r_prof.json()

    assert "consumer_no" in prof
    assert "name" in prof
    assert "meter_number" in prof
    assert "tariff_category" in prof
    assert "sanctioned_load_kw" in prof

    # Strict isolation: no model flags
    assert "theft_probability" not in prof
    assert "theft_risk_percentage" not in prof
    assert "risk_category" not in prof
    assert "operational_priority_score" not in prof
    assert "top_contributing_factors" not in prof


# ============================================================================
# 2. CONSUMER USAGE & HISTORICAL READINGS
# ============================================================================
def test_consumer_usage_data_and_provenance():
    """Verifies that consumer usage returns real daily intervals and statistics."""
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    r_usage = client.get("/api/consumers/me/usage", headers=headers)
    assert r_usage.status_code == 200
    usage = r_usage.json()

    assert "cons_no" in usage
    assert "current_month_kwh" in usage
    assert "historical_daily_sample" in usage
    assert isinstance(usage["historical_daily_sample"], list)
    assert len(usage["historical_daily_sample"]) > 0

    # Each daily reading has date and kwh
    reading = usage["historical_daily_sample"][0]
    assert "date" in reading
    assert "kwh" in reading

    # No ML internals
    assert "theft_probability" not in usage
    assert "risk_category" not in usage


# ============================================================================
# 3. CONSUMER BILLING & DUE DATES
# ============================================================================
def test_consumer_bills_and_ownership_enforcement():
    """Verifies that consumers can view their own bills but cannot view another's."""
    token_cons1 = get_auth_token("cons_01")
    token_cons2 = get_auth_token("cons_02")

    headers_cons1 = {"Authorization": f"Bearer {token_cons1}"}
    headers_cons2 = {"Authorization": f"Bearer {token_cons2}"}

    # Cons 1 gets bills
    r_bills1 = client.get("/api/billing/my-bills", headers=headers_cons1)
    assert r_bills1.status_code == 200
    bills1 = r_bills1.json()
    assert len(bills1) > 0
    bill1_id = bills1[0]["id"]

    # Cons 1 gets specific bill
    r_single = client.get(f"/api/billing/{bill1_id}", headers=headers_cons1)
    assert r_single.status_code == 200
    assert r_single.json()["id"] == bill1_id

    # Cons 2 attempts to fetch Cons 1's bill by ID -> MUST return 403 Forbidden
    r_forbidden = client.get(f"/api/billing/{bill1_id}", headers=headers_cons2)
    assert r_forbidden.status_code == 403
    assert "Access denied" in r_forbidden.json()["detail"]


# ============================================================================
# 4. CONSUMER GRIEVANCES & ISSUE REPORTING
# ============================================================================
def test_consumer_issue_lifecycle_and_ownership():
    """Verifies issue submission, ticket generation, and cross-consumer protection."""
    token_cons1 = get_auth_token("cons_01")
    token_cons2 = get_auth_token("cons_02")

    headers_cons1 = {"Authorization": f"Bearer {token_cons1}"}
    headers_cons2 = {"Authorization": f"Bearer {token_cons2}"}

    # 1. Cons 1 reports valid issue
    r_create = client.post(
        "/api/issues/report",
        json={
            "category": "METER_FAULT",
            "subject": "Erratic LCD flashing code E-04",
            "description": "Smart meter display flickers and shows error code during evening load."
        },
        headers=headers_cons1
    )
    assert r_create.status_code == 200
    created_issue = r_create.json()
    assert "ticket_number" in created_issue
    assert created_issue["ticket_number"].startswith("TKT-")
    assert created_issue["status"] == "SUBMITTED"
    issue_id = created_issue["id"]

    # 2. Cons 1 reviews own issues
    r_my = client.get("/api/issues/my-issues", headers=headers_cons1)
    assert r_my.status_code == 200
    my_issues = r_my.json()
    ticket_numbers = [i["ticket_number"] for i in my_issues]
    assert created_issue["ticket_number"] in ticket_numbers

    # 3. Cons 1 retrieves single issue detail
    r_get = client.get(f"/api/issues/{issue_id}", headers=headers_cons1)
    assert r_get.status_code == 200
    assert r_get.json()["id"] == issue_id

    # 4. Cons 2 tries to access Cons 1's issue -> MUST return 403 Forbidden
    r_other = client.get(f"/api/issues/{issue_id}", headers=headers_cons2)
    assert r_other.status_code == 403
    assert "Access denied" in r_other.json()["detail"]


# ============================================================================
# 5. BOARD COMMUNICATION: DRAFTS VS PUBLISHED ANNOUNCEMENTS
# ============================================================================
def test_board_communication_draft_and_publication_workflow():
    """
    Verifies that:
    - Board Admin can create draft announcements (is_published=False)
    - Drafts are NEVER visible to the public or consumers
    - Board Admin can edit and publish the draft
    - Once published, it appears in public feed
    - Board Admin can delete/withdraw announcements
    """
    token_board = get_auth_token("board_admin")
    headers_board = {"Authorization": f"Bearer {token_board}"}

    # 1. Create a DRAFT announcement (is_published=False)
    r_draft = client.post(
        "/api/posts",
        json={
            "title": "CONFIDENTIAL DRAFT: Substation 33kV Transformer Overhaul",
            "category": "MAINTENANCE",
            "summary": "Internal draft maintenance schedule pending chief engineer approval.",
            "content": "Feeder 4 and Feeder 7 will undergo busbar replacement next Tuesday.",
            "is_published": False
        },
        headers=headers_board
    )
    assert r_draft.status_code == 200
    draft_data = r_draft.json()
    draft_id = draft_data["id"]
    assert draft_data["is_published"] is False

    # 2. Public endpoint MUST NOT include the draft
    r_public = client.get("/api/posts")
    assert r_public.status_code == 200
    public_titles = [p["title"] for p in r_public.json()]
    assert draft_data["title"] not in public_titles

    # 3. Public lookup of draft ID MUST return 404 (drafts never leak)
    r_pub_single = client.get(f"/api/posts/{draft_id}")
    assert r_pub_single.status_code == 404

    # 4. Board Admin admin endpoint lists all posts, including the draft
    r_admin_list = client.get("/api/posts/admin", headers=headers_board)
    assert r_admin_list.status_code == 200
    admin_titles = [p["title"] for p in r_admin_list.json()]
    assert draft_data["title"] in admin_titles

    # 5. Board Admin publishes the draft
    r_update = client.put(
        f"/api/posts/{draft_id}",
        json={
            "title": "APPROVED: Substation 33kV Transformer Overhaul",
            "is_published": True
        },
        headers=headers_board
    )
    assert r_update.status_code == 200
    updated_data = r_update.json()
    assert updated_data["is_published"] is True
    assert updated_data["title"] == "APPROVED: Substation 33kV Transformer Overhaul"

    # 6. Now public endpoint MUST include the published notice
    r_public_after = client.get("/api/posts")
    assert r_public_after.status_code == 200
    public_titles_after = [p["title"] for p in r_public_after.json()]
    assert "APPROVED: Substation 33kV Transformer Overhaul" in public_titles_after

    # 7. Clean up: Board Admin deletes the test announcement
    r_del = client.delete(f"/api/posts/{draft_id}", headers=headers_board)
    assert r_del.status_code == 200


# ============================================================================
# 6. BOARD ADMIN ISSUE RESOLUTION & ENFORCEMENT SUMMARY
# ============================================================================
def test_board_admin_issue_resolution_and_aggregate_stats():
    """
    Verifies that:
    - Board Admin can review all issues and record official response notes
    - Aggregate enforcement summary provides valid totals without leaking consumer PII
    """
    token_board = get_auth_token("board_admin")
    token_cons = get_auth_token("cons_01")
    headers_board = {"Authorization": f"Bearer {token_board}"}
    headers_cons = {"Authorization": f"Bearer {token_cons}"}

    # Create issue from consumer
    r_issue = client.post(
        "/api/issues/report",
        json={
            "category": "BILLING_DISPUTE",
            "subject": "Tariff slab discrepancy query",
            "description": "Please verify commercial vs domestic tariff applied to meters."
        },
        headers=headers_cons
    )
    assert r_issue.status_code == 200
    issue_id = r_issue.json()["id"]

    # Board Admin lists all issues
    r_all_issues = client.get("/api/issues", headers=headers_board)
    assert r_all_issues.status_code == 200
    assert len(r_all_issues.json()) > 0

    # Board Admin responds to issue
    r_resp = client.post(
        f"/api/issues/{issue_id}/respond",
        json={
            "status": "RESOLVED",
            "response_notes": "Tariff verified per TNERC schedule. Applicable slab confirmed as domestic LT-1A."
        },
        headers=headers_board
    )
    assert r_resp.status_code == 200

    # Check verified aggregate stats endpoint
    r_stats = client.get("/api/posts/enforcement-summary")
    assert r_stats.status_code == 200
    stats = r_stats.json()
    assert "total_inspections_completed" in stats
    assert "theft_confirmed_count" in stats
    assert "clean_inspections_count" in stats
    assert "total_penalty_assessed_inr" in stats
    # Confirm NO consumer identifiers or PII in stats
    assert "consumer_no" not in stats
    assert "theft_risk_scores" not in stats


# ============================================================================
# 7. STRICT SERVER-SIDE ROLE BOUNDARY MATRIX
# ============================================================================
def test_strict_server_role_authorization_boundaries():
    """
    Validates cross-role boundary enforcement:
    - Consumers cannot access employee inspection cases or predictions
    - Consumers cannot post board announcements
    - Employees cannot publish board announcements
    - Board Admin cannot access inspection cases or individual predictions
    - Unauthenticated requests are rejected
    """
    token_cons = get_auth_token("cons_01")
    token_emp = get_auth_token("emp001")
    token_board = get_auth_token("board_admin")

    h_cons = {"Authorization": f"Bearer {token_cons}"}
    h_emp = {"Authorization": f"Bearer {token_emp}"}
    h_board = {"Authorization": f"Bearer {token_board}"}

    # 1. Consumer blocked from employee inspection cases
    r1 = client.get("/api/inspections/cases", headers=h_cons)
    assert r1.status_code == 403

    # 2. Consumer blocked from ML model metadata
    r2 = client.get("/api/predictions/active-model", headers=h_cons)
    assert r2.status_code == 403

    # 3. Consumer blocked from posting board updates
    r3 = client.post("/api/posts", json={"title": "Hacked", "category": "POLICY", "summary": "X", "content": "Y"}, headers=h_cons)
    assert r3.status_code == 403

    # 4. Employee blocked from posting board updates
    r4 = client.post("/api/posts", json={"title": "Unauthorized", "category": "POLICY", "summary": "X", "content": "Y"}, headers=h_emp)
    assert r4.status_code == 403

    # 5. Board Admin blocked from employee inspection cases
    r5 = client.get("/api/inspections/cases", headers=h_board)
    assert r5.status_code == 403

    # 6. Board Admin blocked from ML model metadata
    r6 = client.get("/api/predictions/active-model", headers=h_board)
    assert r6.status_code == 403

    # 7. Unauthenticated requests blocked
    r7 = client.get("/api/consumers/me")
    assert r7.status_code == 401
    r8 = client.get("/api/issues/my-issues")
    assert r8.status_code == 401
    r9 = client.get("/api/posts/admin")
    assert r9.status_code == 401
