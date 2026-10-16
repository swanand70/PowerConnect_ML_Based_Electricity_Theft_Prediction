"""
SQLAlchemy ORM Entities mapping to MySQL Database Schema
"""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime,
    ForeignKey, Text, Enum, JSON, Numeric
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum("CONSUMER", "INSPECTION_EMPLOYEE", "BOARD_COMMUNICATION_ADMIN", name="user_role"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    onboarding_version = Column(String(20), default="v1.0", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="user", uselist=False)
    consumer = relationship("Consumer", back_populates="user", uselist=False)
    board_posts = relationship("BoardPost", back_populates="author")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(30), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    designation = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    zone = Column(String(100), nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    active_cases_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="employee")
    assigned_cases = relationship("InspectionCase", back_populates="assigned_employee")
    assignments = relationship("InspectionAssignment", back_populates="employee", foreign_keys="InspectionAssignment.employee_id")
    inspection_results = relationship("InspectionResult", back_populates="employee")

class Consumer(Base):
    __tablename__ = "consumers"

    id = Column(Integer, primary_key=True, index=True)
    cons_no = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    zone = Column(String(100), nullable=False, index=True)
    division = Column(String(100), nullable=False)
    substation = Column(String(100), nullable=False)
    feeder = Column(String(100), nullable=False, index=True)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    tariff_category = Column(String(50), default="DOMESTIC", nullable=False)
    sanctioned_load_kw = Column(Numeric(6, 2), default=5.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="consumer")
    meter = relationship("Meter", back_populates="consumer", uselist=False)
    features = relationship("ConsumptionFeatures", back_populates="consumer", uselist=False)
    predictions = relationship("Prediction", back_populates="consumer")
    inspection_cases = relationship("InspectionCase", back_populates="consumer")
    bills = relationship("Bill", back_populates="consumer")
    issues = relationship("ConsumerIssue", back_populates="consumer")

class Meter(Base):
    __tablename__ = "meters"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), unique=True, nullable=False)
    meter_number = Column(String(50), unique=True, nullable=False)
    meter_type = Column(String(50), default="SMART_DIGITAL", nullable=False)
    installation_date = Column(Date, nullable=False)
    status = Column(Enum("ACTIVE", "SUSPECTED_TAMPERED", "FAULTY", "REPLACED", name="meter_status"), default="ACTIVE", nullable=False)
    last_communication_time = Column(DateTime, nullable=True)

    consumer = relationship("Consumer", back_populates="meter")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), unique=True, nullable=False)
    dataset_version = Column(String(50), nullable=False)
    feature_version = Column(String(50), nullable=False)
    algorithm = Column(String(100), nullable=False)
    training_timestamp = Column(DateTime, nullable=False)
    threshold = Column(Numeric(5, 4), nullable=False)
    precision_score = Column(Numeric(6, 4), nullable=False)
    recall_score = Column(Numeric(6, 4), nullable=False)
    f1_score = Column(Numeric(6, 4), nullable=False)
    roc_auc = Column(Numeric(6, 4), nullable=False)
    pr_auc = Column(Numeric(6, 4), nullable=False)
    status = Column(Enum("CANDIDATE", "ACTIVE", "RETIRED", name="model_status"), default="ACTIVE", nullable=False)
    model_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    predictions = relationship("Prediction", back_populates="model_version")

class ConsumptionFeatures(Base):
    __tablename__ = "consumption_features"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False, index=True)
    feature_version = Column(String(50), default="v1.0", nullable=False)
    mean_consumption = Column(Float, nullable=False)
    median_consumption = Column(Float, nullable=False)
    std_consumption = Column(Float, nullable=False)
    var_consumption = Column(Float, nullable=False)
    min_consumption = Column(Float, nullable=False)
    max_consumption = Column(Float, nullable=False)
    consumption_range = Column(Float, nullable=False)
    coeff_of_variation = Column(Float, nullable=False)
    skewness = Column(Float, nullable=False)
    kurtosis = Column(Float, nullable=False)
    volatility_daily_diff = Column(Float, nullable=False)
    max_daily_drop = Column(Float, nullable=False)
    max_daily_surge = Column(Float, nullable=False)
    zero_consumption_ratio = Column(Float, nullable=False)
    low_consumption_ratio = Column(Float, nullable=False)
    abnormal_consumption_ratio = Column(Float, nullable=False)
    autocorr_lag1 = Column(Float, nullable=False)
    autocorr_lag7 = Column(Float, nullable=False)
    trend_slope = Column(Float, nullable=False)
    recent_vs_historical_ratio = Column(Float, nullable=False)
    weekday_weekend_ratio = Column(Float, nullable=False)
    quarterly_variance_ratio = Column(Float, nullable=False)
    q25_consumption = Column(Float, nullable=False)
    q75_consumption = Column(Float, nullable=False)
    iqr_consumption = Column(Float, nullable=False)
    top10_percent_share = Column(Float, nullable=False)
    data_quality_score = Column(Float, nullable=False)
    missing_reading_ratio = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    consumer = relationship("Consumer", back_populates="features")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    theft_probability = Column(Numeric(6, 4), nullable=False)
    theft_risk_percentage = Column(Numeric(5, 2), nullable=False)
    risk_category = Column(Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="risk_tier"), nullable=False, index=True)
    operational_priority_score = Column(Numeric(5, 2), nullable=False, index=True)
    data_quality_score = Column(Numeric(5, 3), nullable=False)
    data_quality_category = Column(Enum("Low", "Moderate", "High", name="quality_tier"), nullable=False)
    threshold_used = Column(Numeric(5, 4), nullable=False)
    flagged_as_suspect = Column(Boolean, nullable=False)
    top_contributing_factors_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    consumer = relationship("Consumer", back_populates="predictions")
    model_version = relationship("ModelVersion", back_populates="predictions")
    inspection_cases = relationship("InspectionCase", back_populates="prediction")
    feedback = relationship("ModelFeedback", back_populates="prediction", uselist=False)

class InspectionCase(Base):
    __tablename__ = "inspection_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, nullable=False, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    priority_score = Column(Numeric(5, 2), nullable=False, index=True)
    risk_category = Column(Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="case_risk"), nullable=False)
    status = Column(Enum("DETECTED", "REVIEWED", "APPROVED", "ASSIGNED", "SCHEDULED", "INSPECTION", "OUTCOME_RECORDED", "CLOSED", name="case_status"), default="DETECTED", nullable=False, index=True)
    outcome = Column(Enum("NOT_VERIFIED", "THEFT_CONFIRMED", "NO_THEFT_FOUND", "INCONCLUSIVE", name="case_outcome"), default="NOT_VERIFIED", nullable=False, index=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    scheduled_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    consumer = relationship("Consumer", back_populates="inspection_cases")
    prediction = relationship("Prediction", back_populates="inspection_cases")
    assigned_employee = relationship("Employee", back_populates="assigned_cases")
    assignments = relationship("InspectionAssignment", back_populates="case")
    result = relationship("InspectionResult", back_populates="case", uselist=False)

class InspectionAssignment(Base):
    __tablename__ = "inspection_assignments"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    scheduled_date = Column(Date, nullable=False)
    instructions = Column(Text, nullable=True)
    status = Column(Enum("PENDING", "ACCEPTED", "COMPLETED", "REASSIGNED", name="assign_status"), default="PENDING", nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("InspectionCase", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments", foreign_keys=[employee_id])

class InspectionResult(Base):
    __tablename__ = "inspection_results"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("inspection_cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    outcome = Column(Enum("THEFT_CONFIRMED", "NO_THEFT_FOUND", "INCONCLUSIVE", name="result_outcome"), nullable=False)
    meter_tampered = Column(Boolean, default=False, nullable=False)
    direct_hooking_detected = Column(Boolean, default=False, nullable=False)
    meter_seal_broken = Column(Boolean, default=False, nullable=False)
    estimated_units_stolen = Column(Numeric(10, 2), default=0.0, nullable=False)
    penalty_amount_inr = Column(Numeric(12, 2), default=0.0, nullable=False)
    findings_summary = Column(Text, nullable=False)
    evidence_notes = Column(Text, nullable=True)
    evidence_photos_json = Column(JSON, nullable=True)
    inspected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("InspectionCase", back_populates="result")
    employee = relationship("Employee", back_populates="inspection_results")
    feedback = relationship("ModelFeedback", back_populates="inspection_result", uselist=False)

class ModelFeedback(Base):
    __tablename__ = "model_feedback"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False)
    inspection_result_id = Column(Integer, ForeignKey("inspection_results.id", ondelete="CASCADE"), nullable=False)
    verified_outcome = Column(Enum("THEFT_CONFIRMED", "NO_THEFT_FOUND", "INCONCLUSIVE", name="feedback_outcome"), nullable=False)
    ground_truth_label = Column(Integer, nullable=True)  # 1 for theft, 0 for clean
    is_eligible_for_retraining = Column(Boolean, default=True, nullable=False)
    retraining_batch_id = Column(String(50), nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    prediction = relationship("Prediction", back_populates="feedback")
    inspection_result = relationship("InspectionResult", back_populates="feedback")

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False, index=True)
    bill_number = Column(String(50), unique=True, nullable=False)
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    units_consumed_kwh = Column(Numeric(10, 2), nullable=False)
    amount_inr = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(Enum("PENDING", "PAID", "OVERDUE", name="bill_status"), default="PENDING", nullable=False, index=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    consumer = relationship("Consumer", back_populates="bills")

class ConsumerIssue(Base):
    __tablename__ = "consumer_issues"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_number = Column(String(50), unique=True, nullable=False)
    category = Column(String(100), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum("SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED", name="issue_status"), default="SUBMITTED", nullable=False, index=True)
    response_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    consumer = relationship("Consumer", back_populates="issues")

class BoardPost(Base):
    __tablename__ = "board_posts"

    id = Column(Integer, primary_key=True, index=True)
    author_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(Enum("POLICY", "SCHEME", "MAINTENANCE", "ADVISORY", "ENERGY_SAVING", "ENFORCEMENT_UPDATE", name="post_category"), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False, index=True)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    author = relationship("User", back_populates="board_posts")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    link_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    actor = relationship("User", back_populates="audit_logs")
