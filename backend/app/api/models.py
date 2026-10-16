"""
Model Governance, Performance Monitoring & Lifecycle Endpoints
Strictly restricted to INSPECTION_EMPLOYEE role.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.entities import User
from backend.app.api.deps import require_role
from backend.app.services.monitoring_service import ModelMonitoringService
from backend.app.services.lifecycle_service import ModelLifecycleService

router = APIRouter()

class CandidateTrainRequest(BaseModel):
    force_benchmark: bool = False
    allow_benchmark_demonstration: bool = False

class ModelRollbackRequest(BaseModel):
    target_version: str = "v1.0.0"

@router.get("/monitoring", response_model=Dict[str, Any])
def get_three_tier_model_monitoring(
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Returns complete Three-Tier Model Intelligence Metrics:
    - Tier 1: Historical offline holdout benchmark (champion v1.0.0).
    - Tier 2: Real-world operational field inspection confirmation hit rates.
    - Tier 3: Label-backed live performance calculation with sample-size gating and selection-bias warnings.
    """
    return ModelMonitoringService.get_three_tier_monitoring_metrics(db)

@router.get("/drift", response_model=Dict[str, Any])
def get_data_and_feature_drift_analysis(
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Computes data quality indicators and statistical feature drift (PSI)
    comparing incoming consumption profiles against the SGCC-2016-Clean-v1 reference distribution.
    """
    return ModelMonitoringService.get_data_and_feature_drift(db)

@router.get("/registry", response_model=List[Dict[str, Any]])
def list_registered_models(
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Returns all registered model versions, evaluated candidates, and retired champions.
    """
    return ModelLifecycleService.get_registered_models(db)

@router.post("/candidate/train", response_model=Dict[str, Any])
def run_controlled_candidate_training(
    payload: Optional[CandidateTrainRequest] = None,
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Executes a controlled candidate training run.
    Guarantees strict leakage prevention and sample-size gating:
    - Refuses training if verified field feedback is insufficient (< 50 verified labels).
    - Demonstrates benchmark candidate comparison when explicitly requested.
    """
    force_bm = (payload.force_benchmark or payload.allow_benchmark_demonstration) if payload else False
    return ModelLifecycleService.run_controlled_candidate_training(current_user, db, force_benchmark=force_bm)

@router.post("/candidate/{version}/promote", response_model=Dict[str, Any])
def promote_candidate_to_active(
    version: str,
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Authorizes promotion of an evaluated candidate model to ACTIVE champion.
    Retires the previous champion and records audit trail.
    """
    res = ModelLifecycleService.promote_candidate_model(version, current_user, db)
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res

@router.post("/rollback", response_model=Dict[str, Any])
def rollback_model_to_previous(
    payload: Optional[ModelRollbackRequest] = None,
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Restores a previously approved champion (e.g. v1.0.0) in the event of an operational issue.
    """
    target_v = payload.target_version if payload else "v1.0.0"
    res = ModelLifecycleService.rollback_to_champion(target_v, current_user, db)
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res
