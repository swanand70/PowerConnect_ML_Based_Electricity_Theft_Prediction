"""
Phase 3 Automated Test Suite: MySQL, Backend, Authentication, Authorization,
Inspection Lifecycle, Human-in-the-Loop Feedback, and Onboarding.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app
from backend.app.core.database import SessionLocal, engine
from backend.app.core.config import settings
from backend.app.models.entities import User, Employee, Consumer, InspectionCase, ModelFeedback

client = TestClient(app)

# Helper function to get auth headers for a role
def get_auth_token(username: str = "emp001", password: str = "Utility@2026") -> str:
    response = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert response.status_code == 200, f"Login failed for {username}: {response.text}"
    return response.json()["access_token"]

# ============================================================================
# 1. DATABASE TESTS
# ============================================================================
def test_database_connection_and_user():
    """Verifies MySQL connection uses dedicated theft_admin user and NOT root."""
    assert "theft_admin" in settings.DATABASE_URL
    assert "root" not in settings.DATABASE_URL
    
    with engine.connect() as conn:
        res = conn.execute(text("SELECT CURRENT_USER();")).scalar()
        assert "theft_admin" in res

def test_database_schema_and_seed_data():
    """Verifies all normalized entities are populated with valid seed data."""
    db = SessionLocal()
    try:
        # Check users count
        user_count = db.query(User).count()
        assert user_count >= 30, f"Expected at least 30 users, got {user_count}"

        # Check employees: exactly 20 seeded utility officers
        emp_count = db.query(Employee).count()
        assert emp_count == 20, f"Expected 20 employees, got {emp_count}"

        # Verify EMP001 through EMP020 IDs
        emp_ids = [e.employee_id for e in db.query(Employee).all()]
        for i in range(1, 21):
            expected_id = f"EMP{i:03d}"
            assert expected_id in emp_ids, f"Missing employee ID: {expected_id}"

        # Check Board Admin
        board_user = db.query(User).filter(User.role == "BOARD_COMMUNICATION_ADMIN").first()
        assert board_user is not None
        assert board_user.username == "board_admin"

        # Check Consumers
        cons_count = db.query(Consumer).count()
        assert cons_count >= 10, f"Expected >= 10 demo consumers, got {cons_count}"
    finally:
        db.close()

# ============================================================================
# 2. AUTHENTICATION TESTS
# ============================================================================
def test_successful_logins_all_roles():
    """Tests successful login and JWT generation for all 3 distinct user roles."""
    # Employee
    r_emp = client.post("/api/auth/login", json={"username_or_email": "emp001", "password": "Utility@2026"})
    assert r_emp.status_code == 200
    assert r_emp.json()["role"] == "INSPECTION_EMPLOYEE"

    # Consumer
    r_cons = client.post("/api/auth/login", json={"username_or_email": "cons_01", "password": "Utility@2026"})
    assert r_cons.status_code == 200
    assert r_cons.json()["role"] == "CONSUMER"

    # Board Admin
    r_board = client.post("/api/auth/login", json={"username_or_email": "board_admin", "password": "Utility@2026"})
    assert r_board.status_code == 200
    assert r_board.json()["role"] == "BOARD_COMMUNICATION_ADMIN"

def test_failed_login_handling():
    """Verifies invalid passwords and nonexistent users are properly rejected."""
    # Bad password
    r_bad = client.post("/api/auth/login", json={"username_or_email": "emp001", "password": "WrongPassword!"})
    assert r_bad.status_code == 401

    # Nonexistent user
    r_none = client.post("/api/auth/login", json={"username_or_email": "fake_user_404", "password": "Password123"})
    assert r_none.status_code == 401

# ============================================================================
# 3. AUTHORIZATION & STRICT ROLE ISOLATION TESTS
# ============================================================================
def test_role_authorization_boundaries():
    """
    Verifies server-side authorization boundaries:
    - Consumer cannot access inspection cases
    - Consumer cannot access predictions
    - Board Admin cannot access inspection cases or individual predictions
    - Employee cannot post official board announcements
    - Unauthenticated requests are rejected with 401
    """
    token_consumer = get_auth_token("cons_01", "Utility@2026")
    token_employee = get_auth_token("emp001", "Utility@2026")
    token_board = get_auth_token("board_admin", "Utility@2026")

    # 1. Consumer attempting employee endpoint -> 403
    r1 = client.get("/api/inspections/cases", headers={"Authorization": f"Bearer {token_consumer}"})
    assert r1.status_code == 403, f"Expected 403, got {r1.status_code}"

    # 2. Consumer attempting prediction endpoint -> 403
    r2 = client.get("/api/predictions/active-model", headers={"Authorization": f"Bearer {token_consumer}"})
    assert r2.status_code == 403, f"Expected 403, got {r2.status_code}"

    # 3. Board Admin attempting inspection endpoint -> 403
    r3 = client.get("/api/inspections/cases", headers={"Authorization": f"Bearer {token_board}"})
    assert r3.status_code == 403, f"Expected 403, got {r3.status_code}"

    # 4. Employee attempting to publish board post -> 403
    r4 = client.post(
        "/api/posts",
        json={"title": "Unauthorized", "category": "POLICY", "summary": "Test", "content": "Test"},
        headers={"Authorization": f"Bearer {token_employee}"}
    )
    assert r4.status_code == 403, f"Expected 403, got {r4.status_code}"

    # 5. Unauthenticated request -> 401
    r5 = client.get("/api/inspections/cases")
    assert r5.status_code == 401

# ============================================================================
# 4. ONBOARDING & GUIDED TOUR PERSISTENCE TESTS
# ============================================================================
def test_onboarding_lifecycle_and_replay():
    """Verifies onboarding status tracking, tour completion, and replay capability."""
    token = get_auth_token("emp003", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Reset initial state
    client.post("/api/users/onboarding-reset", headers=headers)

    # Check status -> should be false
    r_stat = client.get("/api/users/onboarding-status", headers=headers)
    assert r_stat.status_code == 200
    assert r_stat.json()["onboarding_completed"] is False

    # Complete onboarding
    r_comp = client.post("/api/users/onboarding-complete", json={"completed": True, "version": "v1.0"}, headers=headers)
    assert r_comp.status_code == 200
    assert r_comp.json()["onboarding_completed"] is True

    # Check persistence
    r_check = client.get("/api/users/onboarding-status", headers=headers)
    assert r_check.json()["onboarding_completed"] is True

    # Replay tour (reset)
    r_reset = client.post("/api/users/onboarding-reset", headers=headers)
    assert r_reset.status_code == 200
    assert r_reset.json()["onboarding_completed"] is False

# ============================================================================
# 5. INSPECTION WORKFLOW & HUMAN-IN-THE-LOOP FEEDBACK TESTS
# ============================================================================
def test_inspection_lifecycle_and_feedback():
    """
    Tests end-to-end operational flow:
    List cases -> View case details (SHAP factors) -> Assign -> Schedule -> Record Outcome -> Verify Feedback loop.
    """
    token_emp = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token_emp}"}

    # 1. List cases
    r_cases = client.get("/api/inspections/cases", headers=headers)
    assert r_cases.status_code == 200
    cases_data = r_cases.json()
    assert len(cases_data) > 0
    target_case = cases_data[0]
    case_id = target_case["id"]

    # 2. Get case details (including SHAP factors and data quality)
    r_det = client.get(f"/api/inspections/cases/{case_id}", headers=headers)
    assert r_det.status_code == 200
    detail = r_det.json()
    assert "top_contributing_factors" in detail
    assert "theft_probability" in detail
    assert "data_quality_score" in detail

    # 3. Assign case (dynamically fetch real employee ID)
    db = SessionLocal()
    emp = db.query(Employee).first()
    assigned_emp_id = emp.id
    db.close()

    r_assign = client.post(
        f"/api/inspections/cases/{case_id}/assign",
        json={"employee_id": assigned_emp_id, "scheduled_date": "2026-10-15", "instructions": "Execute surprise meter audit"},
        headers=headers
    )
    assert r_assign.status_code == 200

    # 4. Schedule case
    r_sched = client.post(
        f"/api/inspections/cases/{case_id}/schedule",
        json={"scheduled_date": "2026-10-16", "notes": "Confirmed squad vehicle availability"},
        headers=headers
    )
    assert r_sched.status_code == 200

    # 5. Record verified outcome: THEFT_CONFIRMED
    r_outcome = client.post(
        f"/api/inspections/cases/{case_id}/record-outcome",
        json={
            "outcome": "THEFT_CONFIRMED",
            "meter_tampered": True,
            "direct_hooking_detected": True,
            "meter_seal_broken": True,
            "estimated_units_stolen": 2200.0,
            "penalty_amount_inr": 55000.0,
            "findings_summary": "Underground secondary line tapped ahead of digital smart meter.",
            "evidence_notes": "Physical cables seized as evidence."
        },
        headers=headers
    )
    assert r_outcome.status_code == 200
    assert r_outcome.json()["ground_truth_label"] == 1

    # 6. Verify feedback loop entry in database
    db = SessionLocal()
    try:
        case_obj = db.query(InspectionCase).filter(InspectionCase.id == case_id).first()
        fb_entry = db.query(ModelFeedback).filter(ModelFeedback.prediction_id == case_obj.prediction_id).first()
        assert fb_entry is not None
        assert fb_entry.verified_outcome == "THEFT_CONFIRMED"
        assert fb_entry.ground_truth_label == 1
        assert fb_entry.is_eligible_for_retraining is True

        # Verify feedback summary API
        r_fb = client.get("/api/feedback/summary", headers=headers)
        assert r_fb.status_code == 200
        fb_summary = r_fb.json()
        assert fb_summary["theft_confirmed_count"] >= 1
        assert fb_summary["feedback_loop_status"] == "ACTIVE_SYNCHRONIZED"
    finally:
        db.close()

# ============================================================================
# 6. BOARD COMMUNICATION & AGGREGATE ENFORCEMENT STATS TESTS
# ============================================================================
def test_board_communication_and_enforcement_summary():
    """Tests board post creation, listing, and non-PII aggregate statistics."""
    token_board = get_auth_token("board_admin", "Utility@2026")

    # 1. Create post
    r_post = client.post(
        "/api/posts",
        json={
            "title": "Grid Resiliency Advisory: Monsoon Preparedness",
            "category": "MAINTENANCE",
            "summary": "Tree trimming and line maintenance scheduled along transmission corridors.",
            "content": "Special monsoon vigilance squads will inspect line sag and distribution boxes."
        },
        headers={"Authorization": f"Bearer {token_board}"}
    )
    assert r_post.status_code == 200
    created_post_id = r_post.json()["id"]

    try:
        # 2. Public view posts
        r_list = client.get("/api/posts")
        assert r_list.status_code == 200
        assert len(r_list.json()) >= 1

        # 3. Aggregate enforcement statistics (No PII)
        r_stats = client.get("/api/posts/enforcement-summary")
        assert r_stats.status_code == 200
        stats_data = r_stats.json()
        assert "total_inspections_completed" in stats_data
        assert "theft_confirmed_count" in stats_data
        assert "total_penalty_assessed_inr" in stats_data
    finally:
        # Clean up created test post to ensure database hygiene
        client.delete(f"/api/posts/{created_post_id}", headers={"Authorization": f"Bearer {token_board}"})

# ============================================================================
# 7. CONSUMER PORTAL TESTS
# ============================================================================
def test_consumer_portal_usage_and_billing():
    """Verifies consumer profile, legitimate usage views (no ML flags), and billing."""
    token_cons = get_auth_token("cons_01", "Utility@2026")
    headers = {"Authorization": f"Bearer {token_cons}"}

    # Profile
    r_prof = client.get("/api/consumers/me", headers=headers)
    assert r_prof.status_code == 200
    assert "consumer_no" in r_prof.json()
    # Confirm NO ML fields leaked
    assert "theft_probability" not in r_prof.json()
    assert "risk_category" not in r_prof.json()

    # Usage
    r_use = client.get("/api/consumers/me/usage", headers=headers)
    assert r_use.status_code == 200
    assert "current_month_kwh" in r_use.json()
    assert "theft_probability" not in r_use.json()

    # Bills
    r_bills = client.get("/api/billing/my-bills", headers=headers)
    assert r_bills.status_code == 200
    bills = r_bills.json()
    assert len(bills) > 0

    # Report issue
    r_issue = client.post(
        "/api/issues/report",
        json={
            "category": "METER_FAULT",
            "subject": "Digital display blinking erratically",
            "description": "Smart meter LCD is flashing error code E-04."
        },
        headers=headers
    )
    assert r_issue.status_code == 200
    assert "ticket_number" in r_issue.json()

# ============================================================================
# 8. ML PREDICTION & REGISTRY TESTS
# ============================================================================
def test_ml_model_metadata_and_live_inference():
    """Verifies that active model metadata is retrieved and live inference pipeline runs."""
    token_emp = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token_emp}"}

    # 1. Active model metadata
    r_mod = client.get("/api/predictions/active-model", headers=headers)
    assert r_mod.status_code == 200
    mod_info = r_mod.json()
    assert mod_info["model_version"] == "v1.0.0"
    assert "XGBoost" in mod_info["algorithm"]
    assert mod_info["decision_threshold"] == 0.65
    assert mod_info["status"] == "ACTIVE"
    assert "metrics" in mod_info

    # 2. Live inference on consumer
    db = SessionLocal()
    cons = db.query(Consumer).first()
    cons_id = cons.id
    db.close()

    r_inf = client.post(f"/api/predictions/predict-consumer/{cons_id}", headers=headers)
    assert r_inf.status_code == 200
    inf_res = r_inf.json()
    assert "theft_probability" in inf_res
    assert "theft_risk_percentage" in inf_res
    assert "risk_category" in inf_res
    assert "operational_priority_score" in inf_res
    assert "top_contributing_factors" in inf_res
    assert len(inf_res["top_contributing_factors"]) > 0

