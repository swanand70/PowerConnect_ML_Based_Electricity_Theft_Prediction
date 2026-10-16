"""
Electricity Theft Intelligence & Inspection Platform
Production Inference Pipeline (Phase 2 & Phase 3)

Provides unified inference ensuring 100% parity between training and serving:
Raw daily readings -> Clean/Winsorize/Impute -> Feature Extraction -> Active Model -> SHAP Explanation -> Priority Calculation.
"""

import sys
import json
import pickle
from pathlib import Path
import numpy as np
import pandas as pd

import threading

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils import logger, BASE_DIR, MODELS_DIR
from src.feature_engineering import extract_features_from_dataframe
from src.explain import explain_consumer

# Thread-safe in-memory model cache
_model_cache_lock = threading.Lock()
_cached_model = None
_cached_metadata = None
_cached_model_path = None
_cached_mtime = None

def clear_model_cache():
    """Explicitly clears the in-memory inference model cache."""
    global _cached_model, _cached_metadata, _cached_model_path, _cached_mtime
    with _model_cache_lock:
        _cached_model = None
        _cached_metadata = None
        _cached_model_path = None
        _cached_mtime = None

def load_active_model(model_dir: Path = None):
    """Loads active production model and associated metadata with thread-safe caching."""
    global _cached_model, _cached_metadata, _cached_model_path, _cached_mtime

    # Fast-path for warm in-memory cache when default active model is requested
    if model_dir is None:
        with _model_cache_lock:
            if _cached_model is not None and _cached_model_path is not None:
                try:
                    if Path(_cached_model_path).stat().st_mtime == _cached_mtime:
                        return _cached_model, _cached_metadata
                except Exception:
                    pass

    if model_dir is None:
        try:
            from backend.app.core.database import SessionLocal
            from backend.app.models.entities import ModelVersion
            db = SessionLocal()
            active_mv = db.query(ModelVersion).filter(ModelVersion.status == "ACTIVE").first()
            if active_mv and active_mv.model_path:
                cand_dir = BASE_DIR / active_mv.model_path if not Path(active_mv.model_path).is_absolute() else Path(active_mv.model_path)
                cand_dir = cand_dir.parent if cand_dir.suffix else cand_dir
                if (cand_dir / "xgboost_model.pkl").exists():
                    model_dir = cand_dir
            db.close()
        except Exception:
            pass

    if model_dir is None or not (model_dir / "xgboost_model.pkl").exists():
        model_dir = MODELS_DIR / "v1"

    model_file = model_dir / "xgboost_model.pkl"
    meta_file = model_dir / "model_metadata.json"

    # Check cache validity
    try:
        current_mtime = model_file.stat().st_mtime
    except Exception:
        current_mtime = 0

    with _model_cache_lock:
        if (
            _cached_model is not None
            and _cached_model_path == str(model_file)
            and _cached_mtime == current_mtime
        ):
            return _cached_model, _cached_metadata

        with open(model_file, "rb") as f:
            model = pickle.load(f)

        if meta_file.exists():
            with open(meta_file, "r") as f:
                metadata = json.load(f)
        else:
            with open(MODELS_DIR / "v1" / "model_metadata.json", "r") as f:
                metadata = json.load(f)

        _cached_model = model
        _cached_metadata = metadata
        _cached_model_path = str(model_file)
        _cached_mtime = current_mtime

    return model, metadata

def calculate_operational_priority(
    risk_score: float,
    volatility: float,
    data_quality_score: float,
    recent_ratio: float
) -> float:
    """
    Computes transparent, operational inspection priority score [0.0 - 100.0].
    Weights:
    - 60% ML Theft Risk
    - 15% Volatility / Consumption Drop Anomaly
    - 15% Consumption Deviation (sharp drop in recent usage)
    - 10% Data Quality Reliability
    """
    # Recent drop anomaly: if recent usage dropped sharply (< 0.5 of historical), anomaly is high
    drop_severity = max(0.0, min(1.0, 1.0 - recent_ratio)) if recent_ratio < 1.0 else 0.0
    volat_clamped = min(1.0, volatility / 20.0)
    
    priority = (
        (0.60 * risk_score) +
        (0.15 * drop_severity) +
        (0.15 * volat_clamped) +
        (0.10 * data_quality_score)
    ) * 100.0
    
    return round(float(priority), 1)

def categorize_theft_risk(probability: float) -> str:
    """Categorizes probability into operational tier."""
    if probability >= 0.80:
        return "CRITICAL"
    elif probability >= 0.60:
        return "HIGH"
    elif probability >= 0.40:
        return "MEDIUM"
    else:
        return "LOW"

def predict_consumer_theft_risk(consumer_row_df: pd.DataFrame, include_shap: bool = True) -> dict:
    """
    Runs end-to-end inference on a single consumer record or batch.
    Takes DataFrame containing metadata and reading columns.
    """
    model, metadata = load_active_model()
    
    # 1. Feature extraction using the identical pipeline
    features_df = extract_features_from_dataframe(consumer_row_df)
    
    # Align columns with trained model features
    expected_cols = metadata["feature_columns"]
    X_input = features_df[expected_cols]
    
    # 2. Probability prediction
    probas = model.predict_proba(X_input)[:, 1]
    threshold = metadata.get("threshold", 0.50)
    
    results = []
    for i, p in enumerate(probas):
        row_feat = features_df.iloc[i]
        cons_id = str(row_feat["CONS_NO"])
        risk_pct = round(float(p) * 100.0, 1)
        risk_category = categorize_theft_risk(float(p))
        
        # Operational priority
        volat = float(row_feat.get("volatility_daily_diff", 0.0))
        d_qual = float(row_feat.get("data_quality_score", 1.0))
        r_ratio = float(row_feat.get("recent_vs_historical_ratio", 1.0))
        priority_score = calculate_operational_priority(float(p), volat, d_qual, r_ratio)
        
        # Explainability
        explanation = explain_consumer(row_feat, top_k=5) if include_shap else {}
        
        results.append({
            "consumer_id": cons_id,
            "theft_probability": round(float(p), 4),
            "theft_risk_percentage": risk_pct,
            "risk_category": risk_category,
            "operational_priority_score": priority_score,
            "flagged_as_suspect": bool(p >= threshold),
            "threshold_used": threshold,
            "model_version": metadata.get("model_version", "v1.0.0"),
            "data_quality_score": round(d_qual, 3),
            "data_quality_category": "High" if d_qual >= 0.8 else ("Moderate" if d_qual >= 0.5 else "Low"),
            "top_contributing_factors": explanation.get("top_contributing_factors", [])
        })
        
    return results[0] if len(results) == 1 else results
