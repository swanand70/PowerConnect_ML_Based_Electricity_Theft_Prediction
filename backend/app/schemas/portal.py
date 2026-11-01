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
    paid_amount_inr: float = 0.0
    outstanding_amount_inr: float = 0.0
    due_date: date
    status: str
    paid_at: Optional[datetime] = None

class CreatePaymentOrderRequest(BaseModel):
    amount_inr: float
    idempotency_key: Optional[str] = None

class CreatePaymentOrderResponse(BaseModel):
    order_id: str
    key_id: str
    amount_inr: float
    amount_paise: int
    currency: str
    receipt_number: str
    bill_id: int
    bill_number: str
    consumer_name: str
    consumer_email: Optional[str] = None
    consumer_phone: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    bill_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    receipt_number: str
    payment_id: int
    amount_paid_inr: float
    new_paid_total_inr: float
    new_outstanding_inr: float
    bill_status: str
    is_fully_paid: bool

class PaymentTransactionSummary(BaseModel):
    id: int
    receipt_number: str
    amount_inr: float
    currency: str
    status: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime
    verified_at: Optional[datetime] = None

class PaymentReceiptResponse(BaseModel):
    id: int
    receipt_number: str
    bill_id: int
    bill_number: str
    consumer_name: str
    consumer_no: str
    tariff_category: str
    amount_inr: float
    currency: str
    status: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime
    verified_at: Optional[datetime] = None
    original_bill_amount_inr: float
    total_paid_inr: float
    remaining_balance_inr: float
    bill_status: str

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
