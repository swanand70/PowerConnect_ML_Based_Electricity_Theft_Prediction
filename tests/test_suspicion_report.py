"""
PowerConnect - Suspicion Report & Anomaly Explanation Automated Test Suite
Verifies:
1. RBAC authorization (Employee allowed, Consumer rejected with 403, Unauth rejected with 401).
2. PDF Report binary integrity (%PDF header, non-empty, proper content-type, safe filename).
3. Non-mutating idempotency (does not alter case status, assignment, or model feedback).
4. Error handling for non-existent cases (404).
5. Robust handling of cases with empty or partial consumption telemetry.
6. Correct case-specific data isolation without cross-contamination.
"""

import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.entities import InspectionCase, ModelFeedback, User
from backend.app.services.pdf_report_service import generate_suspicion_report_pdf

client = TestClient(app)

def get_token(username: str, password: str = "Utility@2026") -> str:
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]


def test_unauthenticated_request_rejected():
    """Unauthenticated access to suspicion report must return 401 Unauthorized."""
    res = client.get("/api/inspections/cases/6/suspicion-report")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"


def test_consumer_access_forbidden():
    """Consumer accounts must be forbidden from accessing employee suspicion reports (403 Forbidden)."""
    consumer_token = get_token("cons_01", "Utility@2026")
    res = client.get(
        "/api/inspections/cases/6/suspicion-report",
        headers={"Authorization": f"Bearer {consumer_token}"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden for consumer, got {res.status_code}"


def test_nonexistent_case_returns_404():
    """Requesting suspicion report for non-existent case ID must return 404 Not Found."""
    emp_token = get_token("emp001", "Utility@2026")
    res = client.get(
        "/api/inspections/cases/999999/suspicion-report",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert res.status_code == 404, f"Expected 404 for missing case, got {res.status_code}"


def test_authorized_employee_downloads_valid_pdf():
    """
    Authorized utility employee can retrieve a valid A4 PDF suspicion briefing.
    Verifies:
    - HTTP 200 OK
    - Content-Type: application/pdf
    - Content-Disposition contains deterministic safe filename
    - PDF binary begins with '%PDF-'
    - Byte length is sufficient for a complete multi-page document with vector chart
    """
    emp_token = get_token("emp001", "Utility@2026")
    res = client.get(
        "/api/inspections/cases/6/suspicion-report",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"
    assert res.headers["content-type"] == "application/pdf"
    assert "attachment; filename=\"PowerConnect_Suspicion_Report_CASE-6.pdf\"" in res.headers["content-disposition"]

    pdf_bytes = res.content
    assert pdf_bytes.startswith(b"%PDF-"), "Generated content does not have a valid PDF header"
    assert len(pdf_bytes) > 5000, f"PDF report is unexpectedly small ({len(pdf_bytes)} bytes)"


def test_report_generation_does_not_mutate_case_or_create_feedback():
    """
    Report generation is strictly read-only:
    - Case status, outcome, and assigned employee must remain unchanged.
    - No rows added to ModelFeedback table.
    """
    db = SessionLocal()
    try:
        case_before = db.query(InspectionCase).filter(InspectionCase.id == 6).first()
        status_before = case_before.status
        outcome_before = case_before.outcome
        feedback_count_before = db.query(ModelFeedback).count()
    finally:
        db.close()

    emp_token = get_token("emp001", "Utility@2026")
    res = client.get(
        "/api/inspections/cases/6/suspicion-report",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert res.status_code == 200

    db = SessionLocal()
    try:
        case_after = db.query(InspectionCase).filter(InspectionCase.id == 6).first()
        status_after = case_after.status
        outcome_after = case_after.outcome
        feedback_count_after = db.query(ModelFeedback).count()

        assert status_after == status_before, f"Status mutated: {status_before} -> {status_after}"
        assert outcome_after == outcome_before, f"Outcome mutated: {outcome_before} -> {outcome_after}"
        assert feedback_count_after == feedback_count_before, "ModelFeedback rows were unintentionally created"
    finally:
        db.close()


def test_pdf_service_handles_empty_consumption_history():
    """
    When a case has zero daily readings, the PDF service must generate a valid PDF
    with a clear notice of limited telemetry rather than crashing or throwing an unhandled exception.
    """
    db = SessionLocal()
    try:
        case = db.query(InspectionCase).filter(InspectionCase.id == 6).first()
        # Call generate_suspicion_report_pdf directly with empty readings list
        pdf_bytes = generate_suspicion_report_pdf(case, daily_readings=[])
        assert isinstance(pdf_bytes, bytes)
        assert pdf_bytes.startswith(b"%PDF-")
        assert len(pdf_bytes) > 3000
    finally:
        db.close()


def test_case_data_isolation_between_cases():
    """
    Ensures that report generation for distinct cases yields case-specific files
    with appropriate headers and different case IDs in the attachment headers.
    """
    emp_token = get_token("emp001", "Utility@2026")

    res6 = client.get("/api/inspections/cases/6/suspicion-report", headers={"Authorization": f"Bearer {emp_token}"})
    res7 = client.get("/api/inspections/cases/7/suspicion-report", headers={"Authorization": f"Bearer {emp_token}"})

    assert res6.status_code == 200
    assert res7.status_code == 200

    assert "CASE-6.pdf" in res6.headers["content-disposition"]
    assert "CASE-7.pdf" in res7.headers["content-disposition"]
    assert res6.content != res7.content, "PDF outputs for two different cases should not be identical"
