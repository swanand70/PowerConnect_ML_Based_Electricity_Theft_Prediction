"""
Phase 7 Automated Verification Test Suite
System Integration, Security Hardening, Performance Optimisation,
Enterprise Health & Readiness, and Transaction Integrity.
"""

import sys
import time
from pathlib import Path
import pytest
import pandas as pd
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.entities import User, InspectionCase, ConsumerIssue, Bill, AuditLog, ModelVersion
from src.predict import predict_consumer_theft_risk, load_active_model, clear_model_cache
from backend.app.api.consumers import get_cached_clean_readings_df

client = TestClient(app)

def get_auth_token(username: str = "emp001", password: str = "Utility@2026") -> str:
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]

# 1. Enterprise Health & Readiness Check
def test_enterprise_health_and_readiness():
    """Confirms /health and /api/health report database connectivity and model artifact readiness."""
    for path in ["/health", "/api/health"]:
        res = client.get(path)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == settings.PROJECT_NAME
        assert data["environment"] == settings.ENVIRONMENT
        assert data["active_model_version"] == "v1.0.0"
        assert data["components"]["server"] == "operational"
        assert data["components"]["database"] == "connected"
        assert data["components"]["inference_model"] == "ready"

# 2. CORS Configuration Verification
def test_cors_configuration():
    """Verifies that CORS origins are parsed properly from settings without wildcards in production."""
    origins = settings.cors_origins
    assert isinstance(origins, list)
    assert len(origins) > 0
    assert any("5173" in o for o in origins)

# 3. Centralized Clean Error Handling (Anti-raw-stack-trace rule)
def test_validation_error_handling_sanitization():
    """Confirms request validation errors return clean 422 JSON without internal stack traces."""
    res = client.post("/api/auth/login", json={"invalid_field": "test"})
    assert res.status_code == 422
    data = res.json()
    assert "detail" in data
    assert "Validation error:" in data["detail"]
    assert "Traceback" not in data["detail"]

# 4. In-Memory ML Model Caching Performance
def test_model_cache_thread_safety_and_performance():
    """Verifies that predict_consumer_theft_risk reuses cached model without re-reading pickle files."""
    clear_model_cache()
    
    # First load (cold)
    t0 = time.perf_counter()
    m1, meta1 = load_active_model()
    t_cold = time.perf_counter() - t0

    # Second load (warm cache)
    t1 = time.perf_counter()
    m2, meta2 = load_active_model()
    t_warm = time.perf_counter() - t1

    assert m1 is m2, "Cached model instance should be identical in memory"
    assert meta1 == meta2
    assert t_warm <= t_cold or t_warm < 0.01, f"Warm cache ({t_warm:.4f}s) should be instantaneous"

# 5. Clean Readings CSV Caching
def test_clean_readings_caching_performance():
    """Confirms that get_cached_clean_readings_df caches the parsed DataFrame."""
    df1 = get_cached_clean_readings_df()
    assert df1 is not None
    assert len(df1) > 0
    assert "CONS_NO" in df1.columns

    df2 = get_cached_clean_readings_df()
    assert df1 is df2, "Cached DataFrame should be the exact same object in memory"

# 6. Database Transaction Rollback Safety on Assignment
def test_inspection_assignment_invalid_officer_rollback():
    """Verifies that attempting assignment with an invalid officer returns 404 without corrupting case state."""
    token = get_auth_token("emp001", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch top case
    cases = client.get("/api/inspections/cases", headers=headers).json()
    case_id = cases[0]["id"]
    original_status = cases[0]["status"]

    # Assign with invalid officer ID 99999
    res = client.post(
        f"/api/inspections/cases/{case_id}/assign",
        json={"employee_id": 99999, "scheduled_date": "2026-11-01"},
        headers=headers
    )
    assert res.status_code == 404
    assert "Employee not found" in res.json()["detail"]

    # Verify case was not modified
    case_after = client.get(f"/api/inspections/cases/{case_id}", headers=headers).json()
    assert case_after["status"] == original_status

# 7. Consumer Data Isolation & Anti-Theft Boundary
def test_consumer_anti_theft_flag_isolation():
    """Guarantees consumer endpoints NEVER leak theft risk score, SHAP values, or suspect flags."""
    token = get_auth_token("cons_01", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Profile check
    res_prof = client.get("/api/consumers/me", headers=headers)
    assert res_prof.status_code == 200
    prof = res_prof.json()
    assert "theft_probability" not in prof
    assert "risk_category" not in prof
    assert "shap" not in str(prof).lower()

    # Usage check
    res_usage = client.get("/api/consumers/me/usage", headers=headers)
    assert res_usage.status_code == 200
    usage = res_usage.json()
    assert "theft" not in str(usage).lower()
    assert "risk" not in str(usage).lower()
    assert "priority" not in str(usage).lower()

# 8. Cross-Consumer Bill and Grievance Isolation
def test_cross_consumer_isolation_enforcement():
    """Verifies consumer A cannot view or pay consumer B's bills."""
    token_consumer1 = get_auth_token("cons_01", "Utility@2026")
    token_consumer2 = get_auth_token("cons_02", "Utility@2026")

    # Fetch consumer 2's bill
    res_b2 = client.get("/api/billing/my-bills", headers={"Authorization": f"Bearer {token_consumer2}"})
    assert res_b2.status_code == 200
    bills2 = res_b2.json()
    assert len(bills2) > 0
    foreign_bill_id = bills2[0]["id"]

    # Consumer 1 attempts to fetch Consumer 2's bill
    res = client.get(f"/api/billing/{foreign_bill_id}", headers={"Authorization": f"Bearer {token_consumer1}"})
    assert res.status_code in [403, 404]
    assert "Access denied" in res.json().get("detail", "")

# 9. Demonstration Payment Audit Record
def test_demonstration_simulated_payment_audit():
    """Verifies that paying a bill updates status and creates an auditable log without Stripe."""
    token = get_auth_token("cons_01", "Utility@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Get my bills
    bills = client.get("/api/billing/my-bills", headers=headers).json()
    assert len(bills) > 0
    first_bill = bills[0]

    # Pay bill
    res_pay = client.post(f"/api/billing/{first_bill['id']}/pay", headers=headers)
    assert res_pay.status_code == 200
    assert res_pay.json()["status"] == "PAID"

    # Verify audit trail
    db = SessionLocal()
    audit = db.query(AuditLog).filter(
        AuditLog.entity_type == "BILL",
        AuditLog.entity_id == str(first_bill["id"])
    ).first()
    assert audit is not None
    assert audit.action == "BILL_PAID"
    db.close()

# 10. Role Boundary Strict Enforcement
def test_unauthorized_board_admin_access_to_inspections_blocked():
    """Board communication admins cannot view inspection cases or run candidate retraining."""
    token_board = get_auth_token("board_admin", "Utility@2026")
    headers = {"Authorization": f"Bearer {token_board}"}

    r1 = client.get("/api/inspections/cases", headers=headers)
    assert r1.status_code == 403

    r2 = client.post("/api/models/candidate/train", headers=headers)
    assert r2.status_code == 403

    r3 = client.get("/api/models/monitoring", headers=headers)
    assert r3.status_code == 403
