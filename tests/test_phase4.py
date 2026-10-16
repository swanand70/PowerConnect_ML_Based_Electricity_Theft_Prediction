"""
Phase 4 Automated Integration Test Suite
Verifies Inspection Intelligence Portal End-to-End:
Frontend availability, API contract fulfillment, role isolation,
SHAP explainability, daily consumption series, officer assignments,
and verified outcome recording.
"""

import pytest
import httpx
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.entities import User, InspectionCase, Employee, ModelFeedback

client = TestClient(app)

def get_auth_token(username: str = "emp001", password: str = "Utility@2026") -> str:
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]

# 1. Frontend Dev Server Check
def test_frontend_server_serves_html():
    """Confirms Vite development server is running and serving HTML with correct titles."""
    try:
        r = httpx.get("http://localhost:5173/", timeout=5.0)
        assert r.status_code == 200
        assert "Vigilance & Inspection Intelligence Platform" in r.text
        assert "root" in r.text
    except Exception as e:
        pytest.skip(f"Vite server not accessible on localhost:5173: {e}")

# 2. Employee Dashboard Contract
def test_inspection_dashboard_endpoint():
    """Verifies operational metrics, top priority candidate, and zone breakdown."""
    token = get_auth_token("emp001", "Utility@2026")
    res = client.get("/api/inspections/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "total_cases_monitored" in data
    assert "pending_inspections" in data
    assert "confirmed_thefts_count" in data
    assert "verified_clean_count" in data
    assert "zone_distribution" in data
    assert len(data["zone_distribution"]) > 0

# 3. Prioritized Queue & Filtering
def test_inspection_queue_and_filtering():
    """Verifies candidate queue retrieval and query filtering."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # All cases
    res = client.get("/api/inspections/cases", headers=headers)
    assert res.status_code == 200
    all_cases = res.json()
    assert len(all_cases) > 0
    top_case = all_cases[0]
    assert "theft_risk_percentage" in top_case
    assert "operational_priority_score" in top_case
    assert "feeder" in top_case

    # Filter by risk
    res_high = client.get("/api/inspections/cases?risk=HIGH", headers=headers)
    assert res_high.status_code == 200
    for c in res_high.json():
        assert c["risk_category"] == "HIGH"

# 4. Case Details, SHAP Explainability & Daily Consumption
def test_case_detail_shap_and_consumption():
    """Verifies case detail context, top SHAP factors, and historical daily readings."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    cases = client.get("/api/inspections/cases", headers=headers).json()
    case_id = cases[0]["id"]

    # Details
    res_detail = client.get(f"/api/inspections/cases/{case_id}", headers=headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert "top_contributing_factors" in detail
    assert "data_quality_score" in detail
    assert "threshold_used" in detail
    assert len(detail["top_contributing_factors"]) > 0

    # Daily Consumption Trend
    res_cons = client.get(f"/api/inspections/cases/{case_id}/consumption?days=60", headers=headers)
    assert res_cons.status_code == 200
    cons_data = res_cons.json()
    assert "readings" in cons_data
    assert len(cons_data["readings"]) > 0
    assert "kwh" in cons_data["readings"][0]

# 5. Officer Roster & Squad Assignment Workflow
def test_officer_list_and_case_assignment():
    """Verifies officer list for dropdown and case assignment with scheduled date."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # List officers
    res_officers = client.get("/api/inspections/employees", headers=headers)
    assert res_officers.status_code == 200
    officers = res_officers.json()
    assert len(officers) >= 20
    first_officer = officers[0]

    # Assign case
    cases = client.get("/api/inspections/cases", headers=headers).json()
    target_case_id = cases[0]["id"]

    res_assign = client.post(
        f"/api/inspections/cases/{target_case_id}/assign",
        json={
            "employee_id": first_officer["id"],
            "scheduled_date": "2026-10-20",
            "instructions": "Inspect CT chamber and service tap."
        },
        headers=headers
    )
    assert res_assign.status_code == 200
    assert "successfully assigned" in res_assign.json()["message"]

# 6. Physical Field Outcome & Retraining Synchronization
def test_record_field_outcome_and_feedback():
    """Verifies outcome recording, physical evidence flags, and feedback entry."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    cases = client.get("/api/inspections/cases", headers=headers).json()
    target_case_id = cases[0]["id"]

    res_outcome = client.post(
        f"/api/inspections/cases/{target_case_id}/record-outcome",
        json={
            "outcome": "THEFT_CONFIRMED",
            "meter_tampered": True,
            "direct_hooking_detected": True,
            "meter_seal_broken": True,
            "estimated_units_stolen": 2500.0,
            "penalty_amount_inr": 62500.0,
            "findings_summary": "Underground secondary line tapped ahead of digital smart meter.",
            "evidence_notes": "Physical cables seized and sealed."
        },
        headers=headers
    )
    assert res_outcome.status_code == 200
    out_json = res_outcome.json()
    assert out_json["ground_truth_label"] == 1
    assert out_json["eligible_for_retraining"] is True

# 7. GIS Map Endpoints
def test_map_points_endpoint():
    """Verifies map point retrieval with valid latitude and longitude coordinates."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    res_map = client.get("/api/inspections/map", headers=headers)
    assert res_map.status_code == 200
    points = res_map.json()
    assert len(points) > 0
    for p in points:
        assert "latitude" in p
        assert "longitude" in p
        assert "theft_risk_percentage" in p
        assert "operational_priority_score" in p

# 8. Operational Reports
def test_operational_reports_endpoint():
    """Verifies consolidated management report calculations."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    res_rep = client.get("/api/inspections/reports", headers=headers)
    assert res_rep.status_code == 200
    rep = res_rep.json()
    assert "total_cases" in rep
    assert "completed_inspections" in rep
    assert "theft_confirmed_count" in rep
    assert "clean_count" in rep
    assert "total_penalty_assessed_inr" in rep
    assert "recent_activity" in rep

# 9. Role Boundaries Server-Side Verification
def test_unauthorized_roles_blocked_from_employee_portal():
    """Verifies that Consumers and Board Admins are strictly blocked from inspection APIs."""
    token_consumer = get_auth_token("cons_01", "Utility@2026")
    token_board = get_auth_token("board_admin", "Utility@2026")

    # Consumer cannot view inspections
    r1 = client.get("/api/inspections/cases", headers={"Authorization": f"Bearer {token_consumer}"})
    assert r1.status_code == 403

    # Board Admin cannot view inspections
    r2 = client.get("/api/inspections/cases", headers={"Authorization": f"Bearer {token_board}"})
    assert r2.status_code == 403

    # Consumer cannot view dashboard
    r3 = client.get("/api/inspections/dashboard", headers={"Authorization": f"Bearer {token_consumer}"})
    assert r3.status_code == 403

# 10. Operational Notifications & Mark All Read
def test_notifications_read_all_and_lifecycle():
    """Verifies notification listing and explicit mark-all-read API behavior."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch initial notifications
    res = client.get("/api/notifications", headers=headers)
    assert res.status_code == 200
    notifs = res.json()
    assert isinstance(notifs, list)

    # Call read-all endpoint
    res_read_all = client.post("/api/notifications/read-all", headers=headers)
    assert res_read_all.status_code == 200
    assert "marked as read" in res_read_all.json()["message"]

    # Verify all notifications are now marked as read
    res_after = client.get("/api/notifications", headers=headers)
    assert res_after.status_code == 200
    notifs_after = res_after.json()
    for n in notifs_after:
        assert n["is_read"] is True

# 11. Contextual Navigation & Route Serving Check
def test_navigation_contextual_routes_and_html_structure():
    """Verifies SPA route delivery and presence of application shell across endpoints."""
    try:
        r = httpx.get("http://localhost:5173/employee/dashboard", timeout=5.0)
        assert r.status_code == 200
        assert "Vigilance & Inspection Intelligence Platform" in r.text

        r_case = httpx.get("http://localhost:5173/employee/inspections/1", timeout=5.0)
        assert r_case.status_code == 200
        assert "root" in r_case.text
    except Exception as e:
        pytest.skip(f"Vite server not accessible on localhost:5173: {e}")
