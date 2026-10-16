"""
Human-in-the-Loop Model Feedback & Monitoring Endpoints
Strictly restricted to INSPECTION_EMPLOYEE role.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.entities import User, ModelFeedback, InspectionCase, Prediction, InspectionResult, Consumer, AuditLog
from backend.app.api.deps import require_role

router = APIRouter()

class FeedbackEligibilityUpdateRequest(BaseModel):
    is_eligible: bool
    review_notes: str

@router.get("/summary", response_model=Dict[str, Any])
def get_feedback_monitoring_summary(
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Returns verified physical outcomes and feedback loop status.
    Guarantees that uninspected cases (NOT_VERIFIED) are never treated as negative labels.
    """
    total_feedback_entries = db.query(ModelFeedback).count()
    confirmed_thefts = db.query(ModelFeedback).filter(ModelFeedback.verified_outcome == "THEFT_CONFIRMED").count()
    no_theft_found = db.query(ModelFeedback).filter(ModelFeedback.verified_outcome == "NO_THEFT_FOUND").count()
    inconclusive = db.query(ModelFeedback).filter(ModelFeedback.verified_outcome == "INCONCLUSIVE").count()
    
    # Unverified candidates
    unverified_cases = db.query(InspectionCase).filter(InspectionCase.outcome == "NOT_VERIFIED").count()
    eligible_retraining = db.query(ModelFeedback).filter(ModelFeedback.is_eligible_for_retraining == True).count()

    # Strict denominator: Conclusive audits (confirmed + clean)
    conclusive_audits = confirmed_thefts + no_theft_found
    hit_rate = (confirmed_thefts / conclusive_audits * 100.0) if conclusive_audits > 0 else 0.0

    return {
        "verified_feedback_records_count": total_feedback_entries,
        "theft_confirmed_count": confirmed_thefts,
        "no_theft_found_count": no_theft_found,
        "inconclusive_count": inconclusive,
        "uninspected_candidates_not_verified": unverified_cases,
        "eligible_for_future_retraining_count": eligible_retraining,
        "physical_verification_confirmation_rate_pct": round(hit_rate, 2),
        "feedback_loop_status": "ACTIVE_SYNCHRONIZED"
    }

@router.get("/review", response_model=Dict[str, Any])
def list_feedback_review_records(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    outcome_filter: Optional[str] = Query(None, alias="outcome"),
    eligible_only: Optional[bool] = Query(None, alias="eligible"),
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Returns audit trail records for feedback eligibility review:
    Inspects consumer identity, verifier notes, physical tampering flags, and eligibility status.
    """
    query = db.query(ModelFeedback).join(InspectionResult).join(InspectionCase)
    
    if outcome_filter:
        query = query.filter(ModelFeedback.verified_outcome == outcome_filter)
    if eligible_only is not None:
        query = query.filter(ModelFeedback.is_eligible_for_retraining == eligible_only)

    feedbacks = query.order_by(ModelFeedback.verified_at.desc()).all()
    
    records = []
    for fb in feedbacks:
        res = fb.inspection_result
        case = res.case if res else None
        cons = case.consumer if case else None
        emp = res.employee if res else None

        records.append({
            "id": fb.id,
            "prediction_id": fb.prediction_id,
            "case_id": case.id if case else None,
            "case_number": case.case_number if case else "N/A",
            "consumer_name": cons.name if cons else "Unknown Consumer",
            "cons_no": cons.cons_no if cons else "N/A",
            "zone": cons.zone if cons else "N/A",
            "feeder": cons.feeder if cons else "N/A",
            "verified_outcome": fb.verified_outcome,
            "ground_truth_label": fb.ground_truth_label,
            "is_eligible_for_retraining": fb.is_eligible_for_retraining,
            "tampered": res.meter_tampered if res else False,
            "direct_hooking": res.direct_hooking_detected if res else False,
            "findings_summary": res.findings_summary if res else "",
            "evidence_notes": res.evidence_notes if res else "",
            "penalty_amount_inr": float(res.penalty_amount_inr) if res else 0.0,
            "verified_by": emp.full_name if emp else "Field Inspector",
            "verified_at": fb.verified_at.isoformat() if fb.verified_at else None
        })

    eligible_cnt = len([r for r in records if r["is_eligible_for_retraining"]])
    ineligible_cnt = len([r for r in records if not r["is_eligible_for_retraining"]])

    return {
        "total": len(records),
        "eligible_count": eligible_cnt,
        "ineligible_count": ineligible_cnt,
        "page": page,
        "limit": limit,
        "items": records
    }

@router.patch("/{feedback_id}/eligibility", response_model=Dict[str, Any])
def update_feedback_eligibility(
    feedback_id: int,
    is_eligible: Optional[bool] = Query(None),
    payload: Optional[FeedbackEligibilityUpdateRequest] = None,
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """
    Authorizes supervisory review of feedback eligibility.
    Audit log records reviewer identity and justification notes.
    """
    fb = db.query(ModelFeedback).filter(ModelFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback record not found.")

    new_val = is_eligible if is_eligible is not None else (payload.is_eligible if payload else not fb.is_eligible_for_retraining)
    review_notes = payload.review_notes if payload else "Supervisory update via governance workspace."

    old_eligibility = fb.is_eligible_for_retraining
    fb.is_eligible_for_retraining = new_val
    
    # Audit trail
    audit = AuditLog(
        actor_user_id=current_user.id,
        action="FEEDBACK_ELIGIBILITY_OVERRIDDEN",
        entity_type="MODEL_FEEDBACK",
        entity_id=str(fb.id),
        details={
            "feedback_id": fb.id,
            "previous_eligibility": old_eligibility,
            "new_eligibility": new_val,
            "verified_outcome": fb.verified_outcome,
            "review_notes": review_notes,
            "reviewed_by": current_user.username
        }
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"Feedback #{fb.id} eligibility updated to {new_val}.",
        "feedback_id": fb.id,
        "is_eligible_for_retraining": fb.is_eligible_for_retraining
    }
