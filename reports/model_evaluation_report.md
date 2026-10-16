# SGCC Electricity Theft Detection — Model Evaluation Report

**Model Version:** `v1.0.0`  
**Algorithm:** XGBoost Classifier (Class-Weighted)  
**Status:** `ACTIVE`  
**Trained:** 2026-10-08T17:54:06.771510+00:00  
**Optimal Decision Threshold:** **0.65** (Tuned on Validation Set)  

---

## 1. Unbiased Test Set Performance (Strict Zero-Leakage)
- **PR-AUC (Primary Metric):** **0.3164**
- **ROC-AUC:** **0.7758**
- **F1 Score:** **0.3748**
- **Precision:** **0.3889**
- **Recall:** **0.3616**
- **False Positive Rate (FPR):** **0.053**
- **False Negative Rate (FNR):** **0.6384**

### Confusion Matrix (Test Set)
| | Predicted Normal | Predicted Theft |
|---|---|---|
| **Actual Normal** | 5,506 (TN) | 308 (FP) |
| **Actual Theft** | 346 (FN) | 196 (TP) |

*Operational Meaning:*
- **False Positive (308):** Unnecessary field inspection dispatched; consumer is innocent.
- **False Negative (346):** Theft unflagged; continuous non-technical loss.

---

## 2. Model Baseline Comparison
| Model | Val PR-AUC | Val F1 | Val Precision | Val Recall | Val Top-500 Precision |
|---|---|---|---|---|---|
| Model A (Majority Baseline) | 0.0853 | 0.0 | 0.0 | 0.0 | 0.09 |
| Model B (Logistic Regression) | 0.2687 | 0.2807 | 0.179 | 0.6494 | 0.31 |
| Model C (Random Forest) | 0.332 | 0.3524 | 0.283 | 0.4668 | 0.362 |
| Model D (XGBoost Balanced) | 0.3605 | 0.3395 | 0.2507 | 0.5258 | 0.392 |

---

## 3. Class Imbalance Handling Experiments
| Experiment | Precision | Recall | F1 | PR-AUC | ROC-AUC |
|---|---|---|---|---|---|
| Exp A (No Balancing) | 0.6961 | 0.131 | 0.2205 | 0.3746 | 0.7897 |
| Exp B (Class Weighting) | 0.2507 | 0.5258 | 0.3395 | 0.3605 | 0.7835 |
| Exp C (SMOTE on Train Only) | 0.2797 | 0.3948 | 0.3275 | 0.3146 | 0.7494 |

---

## 4. Inspection Strategy Comparison (Top 500 Capacity)
| Strategy | Hit Rate (Precision@500) | Confirmed Thefts / 500 Inspections | Efficiency Multiplier |
|---|---|---|---|
| Strategy 1 (Random Selection) | 8.00% | 40 | 1.0x (Baseline) |
| Strategy 2 (Highest ML Risk) | 39.00% | 195 | 4.9x |
| Strategy 3 (Operational Priority) | 37.20% | 186 | 4.6x |

---

## 5. Global SHAP Feature Importance
The top factors driving model predictions:
1. **quarterly_variance_ratio** — Mean |SHAP|: 0.4553
2. **missing_reading_ratio** — Mean |SHAP|: 0.2433
3. **autocorr_lag1** — Mean |SHAP|: 0.2225
4. **data_quality_score** — Mean |SHAP|: 0.2014
5. **trend_slope** — Mean |SHAP|: 0.1864
6. **autocorr_lag7** — Mean |SHAP|: 0.1699
7. **coeff_of_variation** — Mean |SHAP|: 0.1638
8. **consumption_range** — Mean |SHAP|: 0.1555
9. **abnormal_consumption_ratio** — Mean |SHAP|: 0.1548
10. **max_consumption** — Mean |SHAP|: 0.1518
11. **recent_vs_historical_ratio** — Mean |SHAP|: 0.1097
12. **kurtosis** — Mean |SHAP|: 0.1063
13. **weekday_weekend_ratio** — Mean |SHAP|: 0.0921
14. **max_daily_surge** — Mean |SHAP|: 0.0829
15. **q25_consumption** — Mean |SHAP|: 0.0724
