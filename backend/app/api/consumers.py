"""
Consumer Profile & Usage Endpoints
Strict role isolation: Consumers never see internal ML risk/theft flags.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd

from backend.app.core.database import get_db
from backend.app.core.config import settings, BASE_DIR
from backend.app.models.entities import User, Consumer, Meter, ConsumptionFeatures
from backend.app.schemas.portal import ConsumerUsageResponse
from backend.app.api.deps import get_current_user, require_role

import threading
from typing import List, Dict, Any, Optional

_clean_readings_cache: Optional[pd.DataFrame] = None
_clean_readings_lock = threading.Lock()

def get_cached_clean_readings_df() -> Optional[pd.DataFrame]:
    """Provides thread-safe in-memory cached access to interim clean readings."""
    global _clean_readings_cache
    with _clean_readings_lock:
        if _clean_readings_cache is not None:
            return _clean_readings_cache
        interim_csv = BASE_DIR / "data" / "interim" / "clean_readings.csv"
        if interim_csv.exists():
            try:
                _clean_readings_cache = pd.read_csv(interim_csv, nrows=100)
                return _clean_readings_cache
            except Exception:
                return None
        return None

router = APIRouter()

@router.get("/me", response_model=Dict[str, Any])
def get_consumer_profile(
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Returns consumer connection details for authenticated consumer."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="No consumer account linked to this user.")

    meter = consumer.meter
    return {
        "id": consumer.id,
        "consumer_no": consumer.cons_no,
        "name": consumer.name,
        "address": consumer.address,
        "zone": consumer.zone,
        "division": consumer.division,
        "substation": consumer.substation,
        "feeder": consumer.feeder,
        "tariff_category": consumer.tariff_category,
        "sanctioned_load_kw": float(consumer.sanctioned_load_kw),
        "meter_number": meter.meter_number if meter else "MTR-SMART-DEFAULT",
        "meter_type": meter.meter_type if meter else "Smart Digital Bidirectional",
        "meter_status": meter.status if meter else "ACTIVE"
    }

@router.get("/me/usage", response_model=ConsumerUsageResponse)
def get_consumer_usage(
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Returns safe, legitimate consumption view for consumer (no ML flags exposed)."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found.")

    features = consumer.features
    mean_val = features.mean_consumption if features else 12.5
    volat_val = features.volatility_daily_diff if features else 2.1

    # Fetch daily sample from cached clean readings
    sample_readings = []
    try:
        df = get_cached_clean_readings_df()
        if df is not None:
            row = df[df["CONS_NO"] == consumer.cons_no]
            if len(row) > 0:
                # Get last 30 daily columns
                date_cols = [c for c in row.columns if "/" in c][-30:]
                for d in date_cols:
                    sample_readings.append({"date": d, "kwh": round(float(row.iloc[0][d]), 2)})
    except Exception:
        pass

    if not sample_readings:
        # Fallback 30-day baseline
        for i in range(30):
            sample_readings.append({
                "date": f"Day-{30-i}",
                "kwh": round(float(mean_val) + (0.5 * (i % 3)), 2)
            })

    current_month_total = round(sum(d["kwh"] for d in sample_readings), 1)

    return ConsumerUsageResponse(
        cons_no=consumer.cons_no,
        name=consumer.name,
        tariff_category=consumer.tariff_category,
        sanctioned_load_kw=float(consumer.sanctioned_load_kw),
        current_month_kwh=current_month_total,
        historical_daily_sample=sample_readings,
        mean_consumption_kwh=round(float(mean_val), 2),
        volatility_score=round(float(volat_val), 2)
    )

@router.get("/{cons_no}/consumption")
def get_consumer_consumption_history(
    cons_no: str,
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """Allows inspection officers to inspect full daily time series for case evaluation."""
    consumer = db.query(Consumer).filter(Consumer.cons_no == cons_no).first()
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found")

    daily_readings = []
    try:
        df = get_cached_clean_readings_df()
        if df is not None:
            row = df[df["CONS_NO"] == cons_no]
            if len(row) > 0:
                date_cols = [c for c in row.columns if "/" in c]
                for d in date_cols:
                    daily_readings.append({"date": d, "kwh": round(float(row.iloc[0][d]), 2)})
    except Exception:
        pass

    return {
        "cons_no": cons_no,
        "name": consumer.name,
        "total_readings_count": len(daily_readings),
        "readings": daily_readings
    }
