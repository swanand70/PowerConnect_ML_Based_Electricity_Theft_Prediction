"""
Authentication API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, UTC

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.entities import User, AuditLog
from backend.app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/token", response_model=TokenResponse)
@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates user credentials and issues signed JWT with role claims."""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == login_data.username_or_email) |
        (User.email == login_data.username_or_email)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is inactive")

    # Generate token
    token = create_access_token(subject=user.username, role=user.role)

    # Log to audit table
    audit_entry = AuditLog(
        actor_user_id=user.id,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        details={"username": user.username, "role": user.role}
    )
    db.add(audit_entry)
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        user_id=user.id,
        onboarding_completed=user.onboarding_completed,
        onboarding_version=user.onboarding_version
    )

@router.get("/me", response_model=UserProfileResponse)
def get_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns profile for currently authenticated user."""
    profile = UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        onboarding_completed=current_user.onboarding_completed,
        onboarding_version=current_user.onboarding_version
    )

    if current_user.role == "INSPECTION_EMPLOYEE" and current_user.employee:
        profile.employee_id = current_user.employee.employee_id
        profile.full_name = current_user.employee.full_name
        profile.zone = current_user.employee.zone
    elif current_user.role == "CONSUMER" and current_user.consumer:
        profile.full_name = current_user.consumer.name
        profile.consumer_no = current_user.consumer.cons_no
        profile.zone = current_user.consumer.zone

    return profile
