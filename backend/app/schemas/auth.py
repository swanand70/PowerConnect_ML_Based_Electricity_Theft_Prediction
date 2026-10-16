"""
Authentication & Authorization Pydantic Schemas
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    user_id: int
    onboarding_completed: bool
    onboarding_version: str

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    onboarding_completed: bool
    onboarding_version: str
    employee_id: Optional[str] = None
    full_name: Optional[str] = None
    zone: Optional[str] = None
    consumer_no: Optional[str] = None

class OnboardingStatusResponse(BaseModel):
    onboarding_completed: bool
    onboarding_version: str
    role: str

class OnboardingCompleteRequest(BaseModel):
    completed: bool = True
    version: Optional[str] = "v1.0"
