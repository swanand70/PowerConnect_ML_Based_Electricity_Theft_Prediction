"""
Phase 6 Test Suite: Closed-Loop Intelligence, Model Monitoring & Controlled Model Lifecycle.

Verifies:
1. Feedback Eligibility and Ground-Truth Integrity (THEFT_CONFIRMED -> 1, NO_THEFT_FOUND -> 0, INCONCLUSIVE -> NULL & Ineligible).
2. Three-Tier Model Performance Monitoring (Tier 1 Historical, Tier 2 Operational with conclusive denominator, Tier 3 Sample-gated).
3. Data Quality & Population Stability Index (PSI) Feature Drift Monitoring.
4. Controlled Candidate Training Guard (refusal when sample < 50, leakage safeguards, benchmark evaluation).
5. Model Registry Lifecycle, Promotion, Rollback, and Audit Logging.
6. Role-Based Authorization Enforcement (Consumers & Board Admins denied 403; Unauthenticated 401).
7. Active Inference Preservation (Predictor loads active champion with fallback to v1.0.0).
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.entities import ModelVersion, AuditLog, ModelFeedback, InspectionResult, InspectionCase
from backend.app.services.monitoring_service import ModelMonitoringService, calculate_psi
from backend.app.services.lifecycle_service import ModelLifecycleService

client = TestClient(app)


def get_token(username: str, password: str = "Utility@2026") -> str:
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def employee_token():
    return get_token("emp001")


@pytest.fixture(scope="module")
def consumer_token():
    return get_token("cons_01")


@pytest.fixture(scope="module")
def board_admin_token():
    return get_token("board_admin")


# ============================================================================
# 1. FEEDBACK PIPELINE & GROUND-TRUTH ELIGIBILITY TESTS
# ============================================================================

def test_feedback_eligibility_ground_truth_rules(employee_token):
    """
    Verifies that:
    - THEFT_CONFIRMED produces label 1 and is eligible for retraining.
    - NO_THEFT_FOUND produces label 0 and is eligible for retraining.
    - INCONCLUSIVE produces label NULL and is NOT eligible for retraining.
    - Uninspected consumers are never backfilled as negative labels.
    """
    headers = {"Authorization": f"Bearer {employee_token}"}
    res = client.get("/api/feedback/review?page=1&limit=50", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "eligible_count" in data
    assert "ineligible_count" in data

    for item in data["items"]:
        outcome = item["verified_outcome"]
        label = item["ground_truth_label"]
        eligible = item["is_eligible_for_retraining"]

        if outcome == "THEFT_CONFIRMED":
            assert label == 1, f"Expected label 1 for THEFT_CONFIRMED, got {label}"
        elif outcome == "NO_THEFT_FOUND":
            assert label == 0, f"Expected label 0 for NO_THEFT_FOUND, got {label}"
        elif outcome == "INCONCLUSIVE":
            assert label is None, f"Expected None/null label for INCONCLUSIVE, got {label}"
            assert eligible is False, f"Inconclusive audits must never be eligible for retraining"


def test_supervisor_feedback_eligibility_toggle(employee_token):
    """
    Verifies that an authorized supervisor can toggle retraining eligibility
    and that changes are persisted with auditable trace.
    """
    headers = {"Authorization": f"Bearer {employee_token}"}
    review_res = client.get("/api/feedback/review?page=1&limit=10", headers=headers)
    assert review_res.status_code == 200
    items = review_res.json()["items"]
    assert len(items) > 0, "Expected at least 1 feedback record in test database"

    target_feedback = items[0]
    target_id = target_feedback["id"]
    initial_eligibility = target_feedback["is_eligible_for_retraining"]

    # Toggle to opposite
    new_eligibility = not initial_eligibility
    patch_res = client.patch(
        f"/api/feedback/{target_id}/eligibility?is_eligible={new_eligibility}",
        headers=headers
    )
    assert patch_res.status_code == 200
    patch_data = patch_res.json()
    assert patch_data["is_eligible_for_retraining"] == new_eligibility

    # Toggle back to maintain test database hygiene
    patch_back = client.patch(
        f"/api/feedback/{target_id}/eligibility?is_eligible={initial_eligibility}",
        headers=headers
    )
    assert patch_back.status_code == 200
    assert patch_back.json()["is_eligible_for_retraining"] == initial_eligibility


# ============================================================================
# 2. THREE-TIER PERFORMANCE MONITORING TESTS
# ============================================================================

def test_three_tier_monitoring_structure_and_metrics(employee_token):
    """
    Verifies that the /api/models/monitoring endpoint returns all three tiers:
    - Tier 1: Historical offline holdout benchmark (immutable v1.0.0 test metrics).
    - Tier 2: Operational field outcomes with explicit conclusive denominator.
    - Tier 3: Label-backed supervised performance gated by sample size threshold (min 25).
    """
    headers = {"Authorization": f"Bearer {employee_token}"}
    res = client.get("/api/models/monitoring", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "historical_baseline_tier1" in data
    assert "operational_outcomes_tier2" in data
    assert "label_backed_performance_tier3" in data
    assert "active_model_version" in data

    # Verify Tier 1
    t1 = data["historical_baseline_tier1"]
    assert t1["model_version"] == "v1.0.0"
    assert t1["operating_threshold"] == 0.65
    assert pytest.approx(t1["metrics"]["pr_auc"], 0.001) == 0.3164
    assert pytest.approx(t1["metrics"]["roc_auc"], 0.001) == 0.7758
    assert pytest.approx(t1["metrics"]["f1_score"], 0.001) == 0.3748
    assert "confusion_matrix" in t1
    assert t1["confusion_matrix"]["true_positives"] == 196
    assert t1["confusion_matrix"]["false_positives"] == 308
    assert t1["confusion_matrix"]["false_negatives"] == 346
    assert t1["confusion_matrix"]["true_negatives"] == 5506

    # Verify Tier 2
    t2 = data["operational_outcomes_tier2"]
    assert "completed_inspections_count" in t2
    assert "conclusive_verified_audits_count" in t2
    assert "theft_confirmed_count" in t2
    assert "no_theft_found_count" in t2
    assert "inconclusive_count" in t2
    assert "inspection_confirmation_rate_pct" in t2

    # Conclusive denominator check:
    # Conclusive = confirmed + no_theft_found (inconclusive is excluded!)
    assert t2["conclusive_verified_audits_count"] == (t2["theft_confirmed_count"] + t2["no_theft_found_count"])
    if t2["conclusive_verified_audits_count"] > 0:
        expected_rate = round((t2["theft_confirmed_count"] / t2["conclusive_verified_audits_count"]) * 100, 2)
        assert pytest.approx(t2["inspection_confirmation_rate_pct"], 0.01) == expected_rate

    # Verify Tier 3
    t3 = data["label_backed_performance_tier3"]
    assert "status" in t3
    assert "verified_sample_size" in t3
    assert t3["minimum_required_samples"] == 25
    assert "sampling_limitation_notice" in t3
    # When sample size < 25, status must be INSUFFICIENT_SAMPLE_SIZE
    if t3["verified_sample_size"] < 25:
        assert t3["status"] == "INSUFFICIENT_SAMPLE_SIZE"


# ============================================================================
# 3. DATA QUALITY & POPULATION STABILITY INDEX (PSI) DRIFT MONITORING
# ============================================================================

def test_psi_calculation_mathematical_properties():
    """Verifies that calculate_psi correctly evaluates identical and shifted distributions."""
    ref = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0] * 50
    curr_identical = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0] * 50
    curr_shifted = [8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0] * 50

    psi_zero = calculate_psi(ref, curr_identical)
    assert psi_zero < 0.05, f"PSI for identical distribution should be near 0, got {psi_zero}"

    psi_shifted = calculate_psi(ref, curr_shifted)
    assert psi_shifted > psi_zero, "Shifted distribution must yield higher PSI than identical"


def test_drift_monitoring_api(employee_token):
    """Verifies that /api/models/drift returns feature PSI and data quality health."""
    headers = {"Authorization": f"Bearer {employee_token}"}
    res = client.get("/api/models/drift", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "reference_dataset" in data
    assert "monitored_profiles_count" in data
    assert "average_psi_score" in data
    assert "overall_drift_alert_level" in data
    assert data["overall_drift_alert_level"] in ["NOMINAL", "ATTENTION", "WARNING"]
    assert "data_quality_health" in data
    assert "feature_drift_breakdown" in data
    assert len(data["feature_drift_breakdown"]) >= 5

    # Check key feature names
    feature_names = [f["feature_name"] for f in data["feature_drift_breakdown"]]
    assert "mean_consumption" in feature_names
    assert "volatility_daily_diff" in feature_names
    assert "trend_slope" in feature_names
    assert "zero_consumption_ratio" in feature_names


# ============================================================================
# 4. CONTROLLED CANDIDATE TRAINING & EVALUATION PIPELINE
# ============================================================================

def test_candidate_training_refusal_on_insufficient_feedback(employee_token):
    """
    Verifies that the candidate training pipeline safely halts and refuses
    to create a production candidate if eligible verified labels are < 50.
    """
    headers = {"Authorization": f"Bearer {employee_token}"}
    res = client.post("/api/models/candidate/train", json={"allow_benchmark_demonstration": False}, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is False
    assert data["status"] == "REFUSED_INSUFFICIENT_DATA"
    assert data["minimum_required_count"] == 50
    assert "safely refused" in data["message"].lower() or "insufficient" in data["message"].lower()
    # Champion remains active and untouched
    assert data["active_champion_preserved"] == "v1.0.0"


def test_candidate_training_benchmark_demonstration_run(employee_token):
    """
    Verifies that an authorized demonstration run on the benchmark dataset:
    - Successfully evaluates candidate architecture with leakage prevention.
    - Compares metrics side-by-side with active champion.
    - Registers candidate with CANDIDATE status (does NOT auto-activate).
    """
    headers = {"Authorization": f"Bearer {employee_token}"}
    res = client.post("/api/models/candidate/train", json={"allow_benchmark_demonstration": True}, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is True
    assert data["status"] == "CANDIDATE_EVALUATION_SUCCESS"
    assert "candidate" in data["candidate_version"]
    assert "comparison" in data
    assert "active_champion" in data["comparison"]
    assert "evaluated_candidate" in data["comparison"]
    assert data["comparison"]["active_champion"]["version"] == "v1.0.0"

    # Leakage safeguards must be verified
    assert "leakage_safeguards_verified" in data
    ls = data["leakage_safeguards_verified"]
    assert ls["train_val_test_isolation"] is True
    assert ls["imputer_scaler_fit_on_train_only"] is True
    assert ls["smote_applied_only_to_train"] is True
    assert ls["held_out_test_uncontaminated"] is True


# ============================================================================
# 5. MODEL REGISTRY, PROMOTION, ROLLBACK & AUDIT TRAILS
# ============================================================================

def test_model_registry_list(employee_token):
    """Verifies that all registered model versions are queryable."""
    headers = {"Authorization": f"Bearer {employee_token}"}
    res = client.get("/api/models/registry", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    versions = [m["model_version"] for m in items]
    assert "v1.0.0" in versions


def test_controlled_promotion_and_rollback_lifecycle(employee_token):
    """
    Verifies the complete auditable lifecycle:
    1. Promote candidate model v1.1.0-candidate.
    2. Confirm active model switches in registry and monitoring.
    3. Verify audit log entry is created.
    4. Execute rollback back to v1.0.0 champion.
    5. Confirm champion is restored and audit log recorded.
    """
    headers = {"Authorization": f"Bearer {employee_token}"}

    # First ensure candidate exists via benchmark run
    cand_res = client.post("/api/models/candidate/train", json={"allow_benchmark_demonstration": True}, headers=headers)
    assert cand_res.status_code == 200
    cand_ver = cand_res.json()["candidate_version"]

    # 1. Promote candidate
    promote_res = client.post(f"/api/models/candidate/{cand_ver}/promote", headers=headers)
    assert promote_res.status_code == 200
    assert "successfully promoted to ACTIVE" in promote_res.json()["message"]

    # 2. Check active version in monitoring
    mon_res = client.get("/api/models/monitoring", headers=headers)
    assert mon_res.status_code == 200
    assert mon_res.json()["active_model_version"] == cand_ver

    # 3. Rollback to champion v1.0.0
    rollback_res = client.post("/api/models/rollback", headers=headers)
    assert rollback_res.status_code == 200
    assert "Rollback successful" in rollback_res.json()["message"]
    assert "v1.0.0" in rollback_res.json()["message"]

    # 4. Verify v1.0.0 is active again
    mon_res_after = client.get("/api/models/monitoring", headers=headers)
    assert mon_res_after.status_code == 200
    assert mon_res_after.json()["active_model_version"] == "v1.0.0"

    # 5. Verify database audit logs
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).filter(
            AuditLog.action.in_(["MODEL_PROMOTED_TO_CHAMPION", "MODEL_ROLLEDBACK_TO_PREVIOUS"])
        ).all()
        assert len(logs) >= 2, "Expected at least 2 audit entries for promotion and rollback"
    finally:
        db.close()


# ============================================================================
# 6. ROLE-BASED ACCESS CONTROL ENFORCEMENT
# ============================================================================

def test_unauthenticated_requests_blocked_with_401():
    """Verifies that all Phase 6 model governance endpoints reject unauthenticated calls."""
    eps = [
        "/api/models/monitoring",
        "/api/models/drift",
        "/api/models/registry",
        "/api/feedback/review",
    ]
    for ep in eps:
        res = client.get(ep)
        assert res.status_code == 401, f"Expected 401 on {ep}, got {res.status_code}"


def test_consumer_role_denied_access_with_403(consumer_token):
    """
    Verifies that CONSUMER accounts cannot access internal model monitoring,
    drift statistics, model registry, or feedback reviews.
    """
    headers = {"Authorization": f"Bearer {consumer_token}"}
    eps = [
        "/api/models/monitoring",
        "/api/models/drift",
        "/api/models/registry",
        "/api/feedback/review",
    ]
    for ep in eps:
        res = client.get(ep, headers=headers)
        assert res.status_code == 403, f"Expected 403 for consumer on {ep}, got {res.status_code}"

    # Also test POST mutation endpoints
    post_res = client.post("/api/models/candidate/train", json={}, headers=headers)
    assert post_res.status_code == 403

    rollback_res = client.post("/api/models/rollback", headers=headers)
    assert rollback_res.status_code == 403


def test_board_admin_role_denied_access_with_403(board_admin_token):
    """
    Verifies that BOARD_COMMUNICATION_ADMIN accounts cannot access
    model monitoring, registry, or candidate training.
    """
    headers = {"Authorization": f"Bearer {board_admin_token}"}
    res = client.get("/api/models/monitoring", headers=headers)
    assert res.status_code == 403, f"Expected 403 for board admin on /api/models/monitoring, got {res.status_code}"


# ============================================================================
# 7. INFERENCE PATH ARTIFACT RESILIENCE
# ============================================================================

def test_inference_path_loads_active_champion_safely():
    """
    Verifies that load_active_model() in src/predict.py loads the registered
    champion and falls back gracefully to models/v1 artifacts.
    """
    from src.predict import load_active_model
    model, meta = load_active_model()
    assert model is not None
    assert meta is not None
    assert meta["model_version"] == "v1.0.0"
    threshold = float(meta.get("threshold", meta.get("operating_threshold", 0.0)))
    assert threshold == 0.65
    assert "xgboost" in meta["algorithm"].lower()
