"""
ML Prediction & Model Registry Endpoints
Strictly restricted to INSPECTION_EMPLOYEE role.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd

from backend.app.core.database import get_db
from backend.app.core.config import BASE_DIR
from backend.app.models.entities import User, Consumer, ModelVersion, Prediction
from backend.app.api.deps import require_role
from src.predict import predict_consumer_theft_risk

router = APIRouter()

@router.get("/active-model", response_model=Dict[str, Any])
def get_active_model_info(
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """Returns active model metadata, evaluation metrics, and optimal decision threshold."""
    model = db.query(ModelVersion).filter(ModelVersion.status == "ACTIVE").first()
    if not model:
        raise HTTPException(status_code=404, detail="No active model found in registry.")

    return {
        "model_version": model.model_version,
        "algorithm": model.algorithm,
        "dataset_version": model.dataset_version,
        "feature_version": model.feature_version,
        "training_timestamp": model.training_timestamp,
        "decision_threshold": float(model.threshold),
        "status": model.status,
        "metrics": {
            "pr_auc": float(model.pr_auc),
            "roc_auc": float(model.roc_auc),
            "f1_score": float(model.f1_score),
            "precision": float(model.precision_score),
            "recall": float(model.recall_score)
        }
    }

@router.post("/predict-consumer/{consumer_id}", response_model=Dict[str, Any])
def run_live_inference_on_consumer(
    consumer_id: int,
    current_user: User = Depends(require_role(["INSPECTION_EMPLOYEE"])),
    db: Session = Depends(get_db)
):
    """Executes live end-to-end inference and SHAP explainability on a consumer record."""
    consumer = db.query(Consumer).filter(Consumer.id == consumer_id).first()
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found.")

    interim_csv = BASE_DIR / "data" / "interim" / "clean_readings.csv"
    if not interim_csv.exists():
        raise HTTPException(status_code=500, detail="Clean readings dataset not found for inference.")

    df = pd.read_csv(interim_csv, nrows=200)
    match_row = df[df["CONS_NO"] == consumer.cons_no]
    if len(match_row) == 0:
        # Fallback to first row
        match_row = df.iloc[[0]]

    # Execute actual ML pipeline
    pred_result = predict_consumer_theft_risk(match_row, include_shap=True)
    return pred_result
