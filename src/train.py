"""
Electricity Theft Intelligence & Inspection Platform
Model Training & Experimentation Pipeline (Phase 2)

Implements:
1. Strict Data Leakage Prevention (Train / Validation / Test split).
2. Multi-Model Baseline Comparison:
   - Model A: Majority Class Baseline (DummyClassifier)
   - Model B: Logistic Regression (StandardScaler + L2)
   - Model C: Random Forest
   - Model D: XGBoost Classifier
3. Class Imbalance Experiments:
   - Exp A: No Balancing
   - Exp B: Class Weighting
   - Exp C: SMOTE (Fitted ONLY on training data)
4. Validation-based Threshold Optimization.
5. Unbiased Final Test Set Evaluation (PR-AUC, F1, Precision@K, Recall@K).
6. SHAP Explainability Engine Generation.
7. Model Artifact Packaging with Versioning Metadata.
"""

import sys
import time
import json
import pickle
from pathlib import Path
from datetime import datetime, UTC
import numpy as np
import pandas as pd

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import shap

from src.utils import logger, PROCESSED_DATA_DIR, MODELS_DIR, REPORTS_DIR, save_json_report

def calculate_precision_recall_at_k(y_true: np.ndarray, y_proba: np.ndarray, k_list: list[int] = [100, 200, 500, 1000]) -> dict:
    """Calculates Precision@K and Recall@K for operational inspection prioritization."""
    order = np.argsort(y_proba)[::-1]
    total_positives = int(np.sum(y_true))
    results = {}
    
    for k in k_list:
        k_clamped = min(k, len(y_true))
        top_k_indices = order[:k_clamped]
        top_k_true = y_true[top_k_indices]
        positives_in_k = int(np.sum(top_k_true))
        
        prec_k = round(positives_in_k / k_clamped, 4) if k_clamped > 0 else 0.0
        rec_k = round(positives_in_k / total_positives, 4) if total_positives > 0 else 0.0
        results[f"K={k}"] = {
            "inspections_capacity_k": k_clamped,
            "confirmed_theft_cases": positives_in_k,
            "precision_at_k": prec_k,
            "recall_at_k": rec_k
        }
    return results

def optimize_threshold(y_val: np.ndarray, y_val_proba: np.ndarray) -> tuple[float, dict]:
    """Finds optimal decision threshold on Validation set to maximize F1 score."""
    thresholds = np.linspace(0.10, 0.90, 81)
    best_th = 0.50
    best_f1 = -1.0
    best_stats = {}
    
    for th in thresholds:
        preds = (y_val_proba >= th).astype(int)
        p = precision_score(y_val, preds, zero_division=0)
        r = recall_score(y_val, preds, zero_division=0)
        f = f1_score(y_val, preds, zero_division=0)
        
        if f > best_f1:
            best_f1 = f
            best_th = round(float(th), 3)
            best_stats = {
                "threshold": best_th,
                "precision": round(float(p), 4),
                "recall": round(float(r), 4),
                "f1": round(float(f), 4)
            }
            
    logger.info(f"Threshold Optimization on Validation Set: Best Threshold = {best_th} (Val F1: {best_f1:.4f})")
    return best_th, best_stats

def evaluate_model_comprehensive(
    model, X: np.ndarray, y: np.ndarray, threshold: float = 0.50
) -> dict:
    """Computes full suite of classification and operational metrics."""
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[:, 1]
    else:
        proba = model.decision_function(X)
        proba = (proba - proba.min()) / (proba.max() - proba.min() + 1e-6)
        
    preds = (proba >= threshold).astype(int)
    cm = confusion_matrix(y, preds)
    tn, fp, fn, tp = cm.ravel()
    
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0
    
    roc_auc = float(roc_auc_score(y, proba)) if len(np.unique(y)) > 1 else 0.5
    pr_auc = float(average_precision_score(y, proba)) if len(np.unique(y)) > 1 else 0.0
    
    metrics = {
        "precision": round(float(precision_score(y, preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y, preds, zero_division=0)), 4),
        "f1": round(float(f1_score(y, preds, zero_division=0)), 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "prioritization_metrics": calculate_precision_recall_at_k(y, proba)
    }
    return metrics, proba

def train_and_evaluate_pipeline(features_path: Path = None, model_dir: Path = None) -> dict:
    """Executes full ML training, evaluation, comparison, and export pipeline."""
    start_time = time.time()
    if features_path is None:
        features_path = PROCESSED_DATA_DIR / "features.csv"
    if model_dir is None:
        model_dir = MODELS_DIR / "v1"
        
    model_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Loading features from {features_path}...")
    df = pd.read_csv(features_path)

    # 1. Feature / Target separation
    target_col = "FLAG"
    id_col = "CONS_NO"
    feature_cols = [c for c in df.columns if c not in [target_col, id_col, "DATA_QUALITY_CATEGORY"]]
    
    X = df[feature_cols].copy()
    y = df[target_col].to_numpy(dtype=int)
    
    logger.info(f"Features: {len(feature_cols)} features for {len(X)} records. Class distribution: {np.bincount(y)}")

    # 2. Strict Train / Validation / Test Split (70% Train, 15% Validation, 15% Test)
    # Stratified split to preserve class imbalance
    X_train_full, X_test, y_train_full, y_test, ids_train_full, ids_test = train_test_split(
        X, y, df[id_col].values, test_size=0.15, stratify=y, random_state=42
    )
    
    val_ratio_of_remaining = 0.15 / 0.85
    X_train, X_val, y_train, y_val, ids_train, ids_val = train_test_split(
        X_train_full, y_train_full, ids_train_full, test_size=val_ratio_of_remaining, stratify=y_train_full, random_state=42
    )

    logger.info(f"Dataset Split (Strict Leakage Prevention):")
    logger.info(f"  Train:      {len(X_train)} samples ({np.sum(y_train)} theft)")
    logger.info(f"  Validation: {len(X_val)} samples ({np.sum(y_val)} theft)")
    logger.info(f"  Test:       {len(X_test)} samples ({np.sum(y_test)} theft)")

    # 3. Model Baseline Comparison
    models_to_evaluate = {
        "Model A (Majority Baseline)": DummyClassifier(strategy="most_frequent"),
        "Model B (Logistic Regression)": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
        ]),
        "Model C (Random Forest)": RandomForestClassifier(
            n_estimators=100, max_depth=12, class_weight="balanced", random_state=42, n_jobs=-1
        ),
        "Model D (XGBoost Balanced)": xgb.XGBClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.08,
            scale_pos_weight=(len(y_train) - sum(y_train)) / sum(y_train),
            eval_metric="aucpr",
            random_state=42,
            n_jobs=-1
        )
    }

    comparison_results = {}
    logger.info("Executing Multi-Model Baseline Comparison on Validation Set...")

    for name, model in models_to_evaluate.items():
        m_start = time.time()
        logger.info(f"Fitting {name}...")
        model.fit(X_train, y_train)
        val_metrics, _ = evaluate_model_comprehensive(model, X_val, y_val, threshold=0.50)
        fit_duration = round(time.time() - m_start, 2)
        comparison_results[name] = {
            "fit_time_seconds": fit_duration,
            "val_f1": val_metrics["f1"],
            "val_roc_auc": val_metrics["roc_auc"],
            "val_pr_auc": val_metrics["pr_auc"],
            "val_precision": val_metrics["precision"],
            "val_recall": val_metrics["recall"],
            "val_top500_precision": val_metrics["prioritization_metrics"].get("K=500", {}).get("precision_at_k", 0.0)
        }
        logger.info(f"--> {name}: Val PR-AUC={val_metrics['pr_auc']:.4f}, Val F1={val_metrics['f1']:.4f}")

    # 4. Class Imbalance Experiments on XGBoost
    imbalance_experiments = {}
    logger.info("Evaluating Class Imbalance Handling Strategies (No Balance vs Class Weights vs SMOTE)...")

    # Exp A: No Balancing
    xgb_no_balance = xgb.XGBClassifier(n_estimators=150, max_depth=6, learning_rate=0.08, eval_metric="aucpr", random_state=42, n_jobs=-1)
    xgb_no_balance.fit(X_train, y_train)
    m_no_bal, _ = evaluate_model_comprehensive(xgb_no_balance, X_val, y_val, threshold=0.50)
    imbalance_experiments["Exp A (No Balancing)"] = m_no_bal

    # Exp B: Class Weighting (scale_pos_weight)
    imbalance_experiments["Exp B (Class Weighting)"] = val_metrics  # already evaluated as Model D

    # Exp C: SMOTE (Fitted ONLY on training data to prevent leakage)
    logger.info("Applying SMOTE strictly to training data...")
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    logger.info(f"SMOTE resampled training set size: {len(X_train_smote)}")

    xgb_smote = xgb.XGBClassifier(n_estimators=150, max_depth=6, learning_rate=0.08, eval_metric="aucpr", random_state=42, n_jobs=-1)
    xgb_smote.fit(X_train_smote, y_train_smote)
    m_smote, _ = evaluate_model_comprehensive(xgb_smote, X_val, y_val, threshold=0.50)
    imbalance_experiments["Exp C (SMOTE on Train Only)"] = m_smote

    # Select champion model
    best_candidate_name = "Model D (XGBoost Balanced)"
    champion_model = models_to_evaluate[best_candidate_name]

    # 5. Threshold Optimization on Validation Set
    _, val_champion_proba = evaluate_model_comprehensive(champion_model, X_val, y_val, threshold=0.50)
    optimal_threshold, threshold_tuning_summary = optimize_threshold(y_val, val_champion_proba)

    # 6. Final Evaluation on Untouched Test Set
    logger.info("Performing final unbiased evaluation on untouched Test Set...")
    test_metrics, test_proba = evaluate_model_comprehensive(champion_model, X_test, y_test, threshold=optimal_threshold)
    logger.info(f"FINAL TEST RESULTS @ Threshold={optimal_threshold}:")
    logger.info(f"  PR-AUC:   {test_metrics['pr_auc']:.4f}")
    logger.info(f"  ROC-AUC:  {test_metrics['roc_auc']:.4f}")
    logger.info(f"  F1 Score: {test_metrics['f1']:.4f}")
    logger.info(f"  Precision:{test_metrics['precision']:.4f}")
    logger.info(f"  Recall:   {test_metrics['recall']:.4f}")
    logger.info(f"  Precision@500: {test_metrics['prioritization_metrics'].get('K=500', {}).get('precision_at_k', 0.0)}")

    # 7. Inspection Strategy Comparison on Test Set (Section 15)
    # Strategy 1: Random Inspection
    rng = np.random.RandomState(42)
    random_order = rng.permutation(len(y_test))
    rand_prec_at_500 = round(float(np.mean(y_test[random_order[:500]])), 4)
    
    # Strategy 2: Highest ML Risk
    ml_order = np.argsort(test_proba)[::-1]
    ml_prec_at_500 = round(float(np.mean(y_test[ml_order[:500]])), 4)

    # Strategy 3: Operational Priority (Risk + Data Quality + Volatility)
    test_qual = X_test["data_quality_score"].values
    test_volat = X_test["volatility_daily_diff"].values
    volat_norm = (test_volat - test_volat.min()) / (test_volat.max() - test_volat.min() + 1e-6)
    
    # Priority Formula: 70% ML Risk + 15% Volatility Anomaly + 15% Data Quality
    operational_priority = (0.70 * test_proba) + (0.15 * volat_norm) + (0.15 * test_qual)
    op_order = np.argsort(operational_priority)[::-1]
    op_prec_at_500 = round(float(np.mean(y_test[op_order[:500]])), 4)

    strategy_comparison = {
        "Strategy 1 (Random Selection)": {
            "top_500_inspections_precision": rand_prec_at_500,
            "top_500_confirmed_thefts": int(rand_prec_at_500 * 500),
            "efficiency_multiplier": "1.0x (Baseline)"
        },
        "Strategy 2 (Highest ML Risk)": {
            "top_500_inspections_precision": ml_prec_at_500,
            "top_500_confirmed_thefts": int(ml_prec_at_500 * 500),
            "efficiency_multiplier": f"{round(ml_prec_at_500 / max(1e-4, rand_prec_at_500), 1)}x"
        },
        "Strategy 3 (Operational Priority)": {
            "top_500_inspections_precision": op_prec_at_500,
            "top_500_confirmed_thefts": int(op_prec_at_500 * 500),
            "efficiency_multiplier": f"{round(op_prec_at_500 / max(1e-4, rand_prec_at_500), 1)}x"
        }
    }
    logger.info(f"Inspection Strategy Comparison (Top 500 Inspections):")
    logger.info(f"  Random:    {rand_prec_at_500:.2%} hit rate ({int(rand_prec_at_500 * 500)} thefts)")
    logger.info(f"  ML Risk:   {ml_prec_at_500:.2%} hit rate ({int(ml_prec_at_500 * 500)} thefts)")
    logger.info(f"  Op Priority:{op_prec_at_500:.2%} hit rate ({int(op_prec_at_500 * 500)} thefts)")

    # 8. SHAP Explainability Engine
    logger.info("Fitting SHAP TreeExplainer on Champion Model...")
    explainer = shap.TreeExplainer(champion_model)
    
    # Calculate SHAP values on validation sample for global importance
    val_sample = X_val.sample(n=min(500, len(X_val)), random_state=42)
    shap_values = explainer.shap_values(val_sample)
    
    # Global feature importance
    mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
    top_feature_indices = np.argsort(mean_abs_shap)[::-1]
    
    global_explanations = [
        {
            "rank": int(i + 1),
            "feature": feature_cols[idx],
            "importance_score": round(float(mean_abs_shap[idx]), 4),
            "description": feature_cols[idx]
        }
        for i, idx in enumerate(top_feature_indices[:15])
    ]

    # 9. Save Model Artifacts & Metadata
    model_version = "v1.0.0"
    model_file_path = model_dir / "xgboost_model.pkl"
    explainer_file_path = model_dir / "shap_explainer.pkl"
    metadata_file_path = model_dir / "model_metadata.json"

    with open(model_file_path, "wb") as f:
        pickle.dump(champion_model, f)
        
    with open(explainer_file_path, "wb") as f:
        pickle.dump(explainer, f)

    model_metadata = {
        "model_version": model_version,
        "dataset_version": "SGCC-2016-Clean-v1",
        "feature_version": "v1.0",
        "training_timestamp": datetime.now(UTC).isoformat(),
        "algorithm": "XGBoost Classifier (Class-Weighted)",
        "feature_columns": feature_cols,
        "hyperparameters": {
            "n_estimators": 150,
            "max_depth": 6,
            "learning_rate": 0.08,
            "scale_pos_weight": float((len(y_train) - sum(y_train)) / sum(y_train)),
            "eval_metric": "aucpr"
        },
        "threshold": optimal_threshold,
        "status": "ACTIVE",
        "validation_metrics": threshold_tuning_summary,
        "test_metrics": {
            "precision": test_metrics["precision"],
            "recall": test_metrics["recall"],
            "f1": test_metrics["f1"],
            "roc_auc": test_metrics["roc_auc"],
            "pr_auc": test_metrics["pr_auc"],
            "false_positive_rate": test_metrics["false_positive_rate"],
            "false_negative_rate": test_metrics["false_negative_rate"],
            "confusion_matrix": test_metrics["confusion_matrix"],
            "precision_recall_at_k": test_metrics["prioritization_metrics"]
        },
        "model_comparison": comparison_results,
        "imbalance_experiments": {
            k: {
                "precision": v["precision"], "recall": v["recall"],
                "f1": v["f1"], "pr_auc": v["pr_auc"], "roc_auc": v["roc_auc"]
            }
            for k, v in imbalance_experiments.items()
        },
        "strategy_comparison": strategy_comparison,
        "global_shap_importance": global_explanations
    }

    save_json_report(model_metadata, metadata_file_path)
    
    # Save markdown evaluation report
    generate_model_evaluation_md(model_metadata, REPORTS_DIR / "model_evaluation_report.md")

    logger.info(f"Model training and export complete in {round(time.time() - start_time, 2)}s.")
    return model_metadata

def generate_model_evaluation_md(meta: dict, md_path: Path) -> None:
    """Generates markdown report of model evaluation."""
    tm = meta["test_metrics"]
    cm = tm["confusion_matrix"]
    
    md = f"""# SGCC Electricity Theft Detection — Model Evaluation Report

**Model Version:** `{meta['model_version']}`  
**Algorithm:** {meta['algorithm']}  
**Status:** `{meta['status']}`  
**Trained:** {meta['training_timestamp']}  
**Optimal Decision Threshold:** **{meta['threshold']}** (Tuned on Validation Set)  

---

## 1. Unbiased Test Set Performance (Strict Zero-Leakage)
- **PR-AUC (Primary Metric):** **{tm['pr_auc']}**
- **ROC-AUC:** **{tm['roc_auc']}**
- **F1 Score:** **{tm['f1']}**
- **Precision:** **{tm['precision']}**
- **Recall:** **{tm['recall']}**
- **False Positive Rate (FPR):** **{tm['false_positive_rate']}**
- **False Negative Rate (FNR):** **{tm['false_negative_rate']}**

### Confusion Matrix (Test Set)
| | Predicted Normal | Predicted Theft |
|---|---|---|
| **Actual Normal** | {cm['true_negatives']:,} (TN) | {cm['false_positives']:,} (FP) |
| **Actual Theft** | {cm['false_negatives']:,} (FN) | {cm['true_positives']:,} (TP) |

*Operational Meaning:*
- **False Positive ({cm['false_positives']}):** Unnecessary field inspection dispatched; consumer is innocent.
- **False Negative ({cm['false_negatives']}):** Theft unflagged; continuous non-technical loss.

---

## 2. Model Baseline Comparison
| Model | Val PR-AUC | Val F1 | Val Precision | Val Recall | Val Top-500 Precision |
|---|---|---|---|---|---|
"""
    for name, res in meta["model_comparison"].items():
        md += f"| {name} | {res['val_pr_auc']} | {res['val_f1']} | {res['val_precision']} | {res['val_recall']} | {res['val_top500_precision']} |\n"

    md += """
---

## 3. Class Imbalance Handling Experiments
| Experiment | Precision | Recall | F1 | PR-AUC | ROC-AUC |
|---|---|---|---|---|---|
"""
    for exp, res in meta["imbalance_experiments"].items():
        md += f"| {exp} | {res['precision']} | {res['recall']} | {res['f1']} | {res['pr_auc']} | {res['roc_auc']} |\n"

    md += """
---

## 4. Inspection Strategy Comparison (Top 500 Capacity)
| Strategy | Hit Rate (Precision@500) | Confirmed Thefts / 500 Inspections | Efficiency Multiplier |
|---|---|---|---|
"""
    for strat, res in meta["strategy_comparison"].items():
        md += f"| {strat} | {res['top_500_inspections_precision']:.2%} | {res['top_500_confirmed_thefts']} | {res['efficiency_multiplier']} |\n"

    md += """
---

## 5. Global SHAP Feature Importance
The top factors driving model predictions:
"""
    for feat in meta["global_shap_importance"]:
        md += f"{feat['rank']}. **{feat['feature']}** — Mean |SHAP|: {feat['importance_score']}\n"

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md)
    logger.info(f"Markdown report generated at {md_path}")

if __name__ == "__main__":
    train_and_evaluate_pipeline()
