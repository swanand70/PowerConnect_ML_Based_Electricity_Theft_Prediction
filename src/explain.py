"""
Electricity Theft Intelligence & Inspection Platform
Explainable AI (XAI) Engine via SHAP (Phase 2)

Generates real, mathematically computed SHAP explanations for individual consumers
and global feature importance. NEVER fabricates explanations.
"""

import sys
import pickle
from pathlib import Path
import numpy as np
import pandas as pd

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils import logger, MODELS_DIR
from src.feature_engineering import FEATURE_DOCUMENTATION

def load_explainer_and_model(model_dir: Path = None):
    """Loads active model and SHAP TreeExplainer."""
    if model_dir is None:
        model_dir = MODELS_DIR / "v1"
        
    model_path = model_dir / "xgboost_model.pkl"
    explainer_path = model_dir / "shap_explainer.pkl"
    
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(explainer_path, "rb") as f:
        explainer = pickle.load(f)
        
    return model, explainer

def explain_consumer(features_series: pd.Series, top_k: int = 5) -> dict:
    """
    Generates local SHAP explanation for an individual consumer.
    Returns:
    - Base expected value (log-odds)
    - Top contributing features with their real values, SHAP impact, and direction.
    """
    model, explainer = load_explainer_and_model()
    
    # Exclude non-feature columns
    feature_cols = [c for c in features_series.index if c not in ['CONS_NO', 'FLAG', 'DATA_QUALITY_CATEGORY']]
    X_sample = features_series[feature_cols].to_frame().T.astype(float)
    
    # Calculate SHAP values
    shap_vals = explainer.shap_values(X_sample)[0]
    
    # Pair with features
    explanation_list = []
    for col_name, val, s_val in zip(feature_cols, X_sample.iloc[0], shap_vals):
        direction = "INCREASES_THEFT_RISK" if s_val > 0 else "DECREASES_THEFT_RISK"
        friendly_desc = FEATURE_DOCUMENTATION.get(col_name, col_name.replace("_", " ").title())
        explanation_list.append({
            "feature": col_name,
            "display_name": friendly_desc,
            "feature_value": round(float(val), 4),
            "shap_contribution": round(float(s_val), 4),
            "absolute_impact": abs(float(s_val)),
            "direction": direction,
            "risk_driver": bool(s_val > 0)
        })
        
    # Sort by absolute impact descending
    explanation_list.sort(key=lambda x: x["absolute_impact"], reverse=True)
    top_factors = explanation_list[:top_k]
    
    return {
        "consumer_id": str(features_series.get("CONS_NO", "UNKNOWN")),
        "top_contributing_factors": top_factors,
        "all_feature_impacts": explanation_list
    }
