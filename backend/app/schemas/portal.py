"""
Portal Schemas: Billing, Issues, Board Posts, Notifications, Analytics
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel

class BillResponse(BaseModel):
    id: int
    bill_number: str
    billing_period_start: date
    billing_period_end: date
    units_consumed_kwh: float
    amount_inr: float
    due_date: date
    status: str
    paid_at: Optional[datetime] = None

class ConsumerUsageResponse(BaseModel):
    cons_no: str
    name: str
    tariff_category: str
    sanctioned_load_kw: float
    current_month_kwh: float
    historical_daily_sample: List[Dict[str, Any]]
    mean_consumption_kwh: float
    volatility_score: float

class IssueCreateRequest(BaseModel):
    category: str
    subject: str
    description: str

class IssueResponse(BaseModel):
    id: int
    ticket_number: str
    consumer_name: str
    category: str
    subject: str
    description: str
    status: str
    response_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

class IssueResolveRequest(BaseModel):
    status: str  # IN_PROGRESS, RESOLVED, CLOSED
    response_notes: str

class BoardPostCreateRequest(BaseModel):
    title: str
    category: str
    summary: str
    content: str
    is_published: Optional[bool] = True

class BoardPostUpdateRequest(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None

class BoardPostResponse(BaseModel):
    id: int
    author_name: str
    title: str
    category: str
    summary: str
    content: str
    published_at: datetime
    is_published: Optional[bool] = True

class BoardPostAdminResponse(BaseModel):
    id: int
    author_name: str
    title: str
    category: str
    summary: str
    content: str
    is_published: bool
    published_at: datetime
    created_at: datetime
    updated_at: datetime

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    is_read: bool
    link_url: Optional[str] = None
    created_at: datetime

class AggregateEnforcementStats(BaseModel):
    total_inspections_completed: int
    theft_confirmed_count: int
    clean_inspections_count: int
    inconclusive_count: int
    total_penalty_assessed_inr: float
    total_estimated_units_recovered_kwh: float
    monitored_feeders_count: int
