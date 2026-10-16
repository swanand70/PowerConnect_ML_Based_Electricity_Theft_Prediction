"""
User & Onboarding Management API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.entities import User, AuditLog
from backend.app.schemas.auth import OnboardingStatusResponse, OnboardingCompleteRequest
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("/onboarding-status", response_model=OnboardingStatusResponse)
def get_onboarding_status(current_user: User = Depends(get_current_user)):
    """Fetches user's current onboarding state to trigger walkthroughs."""
    return OnboardingStatusResponse(
        onboarding_completed=current_user.onboarding_completed,
        onboarding_version=current_user.onboarding_version,
        role=current_user.role
    )

@router.post("/onboarding-complete", response_model=OnboardingStatusResponse)
def complete_onboarding(
    payload: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks the guided walkthrough tour as finished."""
    current_user.onboarding_completed = payload.completed
    if payload.version:
        current_user.onboarding_version = payload.version
    db.commit()

    # Log to audit trail
    audit = AuditLog(
        actor_user_id=current_user.id,
        action="ONBOARDING_COMPLETED",
        entity_type="USER",
        entity_id=str(current_user.id),
        details={"version": current_user.onboarding_version}
    )
    db.add(audit)
    db.commit()

    return OnboardingStatusResponse(
        onboarding_completed=current_user.onboarding_completed,
        onboarding_version=current_user.onboarding_version,
        role=current_user.role
    )

@router.post("/onboarding-reset", response_model=OnboardingStatusResponse)
def reset_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resets onboarding state to allow replaying the tour anytime from Help/Settings."""
    current_user.onboarding_completed = False
    db.commit()

    audit = AuditLog(
        actor_user_id=current_user.id,
        action="ONBOARDING_RESET_FOR_REPLAY",
        entity_type="USER",
        entity_id=str(current_user.id)
    )
    db.add(audit)
    db.commit()

    return OnboardingStatusResponse(
        onboarding_completed=False,
        onboarding_version=current_user.onboarding_version,
        role=current_user.role
    )
