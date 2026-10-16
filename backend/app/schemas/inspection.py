"""
Inspection & Case Lifecycle Schemas
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel

class InspectionCaseSummary(BaseModel):
    id: int
    case_number: str
    consumer_id: int
    consumer_name: str
    cons_no: str
    address: str
    zone: str
    substation: str
    feeder: str
    latitude: float
    longitude: float
    theft_risk_percentage: float
    risk_category: str
    operational_priority_score: float
    status: str
    outcome: str
    assigned_employee_name: Optional[str] = None
    scheduled_date: Optional[date] = None
    created_at: datetime

class FactorExplanation(BaseModel):
    feature: str
    display_name: str
    feature_value: float
    shap_contribution: float
    direction: str

class InspectionCaseDetail(BaseModel):
    id: int
    case_number: str
    consumer_id: int
    consumer_name: str
    cons_no: str
    address: str
    zone: str
    division: str
    substation: str
    feeder: str
    latitude: float
    longitude: float
    tariff_category: str
    meter_number: Optional[str] = None
    meter_status: Optional[str] = None
    
    # ML & Risk
    theft_probability: float
    theft_risk_percentage: float
    risk_category: str
    operational_priority_score: float
    data_quality_score: float
    data_quality_category: str
    threshold_used: float
    model_version: str
    top_contributing_factors: List[Dict[str, Any]]
    
    # Lifecycle
    status: str
    outcome: str
    assigned_employee_id: Optional[int] = None
    assigned_employee_name: Optional[str] = None
    scheduled_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Inspection outcome result if recorded
    findings_summary: Optional[str] = None
    meter_tampered: Optional[bool] = None
    penalty_amount_inr: Optional[float] = None
    inspected_at: Optional[datetime] = None

class AssignInspectionRequest(BaseModel):
    employee_id: int
    scheduled_date: date
    instructions: Optional[str] = None

class ScheduleInspectionRequest(BaseModel):
    scheduled_date: date
    notes: Optional[str] = None

class RecordOutcomeRequest(BaseModel):
    outcome: str  # THEFT_CONFIRMED, NO_THEFT_FOUND, INCONCLUSIVE
    meter_tampered: bool = False
    direct_hooking_detected: bool = False
    meter_seal_broken: bool = False
    estimated_units_stolen: float = 0.0
    penalty_amount_inr: float = 0.0
    findings_summary: str
    evidence_notes: Optional[str] = None
    evidence_photos: Optional[List[str]] = None
