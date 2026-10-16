# SGCC Electricity Theft Dataset — Automated Audit Report

**Generated:** 2026-10-08T17:42:56.520948  
**Raw Dataset:** `D:\Desktop\VITC-STUDY-MATERIAL\COURSE-MATERIAL\TY\FALL-SEM_26-27\PROJECTS\PROJECT-SOFTWARE-ENGG\archive\data.csv`  
**Dataset File Size:** 167.08 MB  
**Audit Duration:** 11.59 seconds  

---

## 1. Dataset Dimensions & Structure
- **Total Consumers (Rows):** 42,372
- **Total Columns:** 1036
- **Metadata Columns:** CONS_NO, FLAG
- **Reading Columns (Days):** 1034
- **Reading Frequency:** Daily (1 reading/day)
- **Data Orientation:** Wide format (1 row per consumer, daily dates as columns)

## 2. Temporal Span
- **Date Range:** 2014-01-01 to 2016-10-31
- **Span:** 1035 days
- **Chronological Sorting:** Required (original CSV column order is lexicographical)

## 3. Target Class Distribution
- **Target Field:** `FLAG`
- **Normal Consumers (0):** 38,757
- **Theft Suspects (1):** 3,615
- **Theft Prevalence:** **8.53%**
- **Class Ratio:** 1 theft : 10.7 normal
- **Evaluation Implication:** Severe class imbalance. Accuracy is misleading; **PR-AUC, F1, Precision@K, and Recall@K** are primary operational metrics.

## 4. Data Quality & Missingness Analysis
- **Total Reading Cells:** 43,812,648
- **Missing Readings (NaN):** 11,233,528 (25.64%)
- **Consumer Missingness Breakdown:**
  - **0-10% missing readings:** 20,997 consumers
  - **10-25% missing readings:** 5,986 consumers
  - **25-50% missing readings:** 4,205 consumers
  - **50-75% missing readings:** 10,790 consumers
  - **75-100% missing readings:** 394 consumers

## 5. Consumption Statistics & Physical Anomalies
- **Minimum Consumption:** 0.0 kWh
- **Maximum Consumption:** 800,003.32 kWh
- **Global Mean:** 9.2589 kWh/day
- **Global Standard Deviation:** 273.2241 kWh/day
- **Zero Readings:** 5,788,603 (17.77%)
- **Negative Readings (Corrupted):** 0
- **Extreme Readings (>10,000 kWh):** 260

## 6. Preprocessing Architecture Recommendations
1. Maintain chronological order: sort the 1,034 date columns by date ascending.
1. Handle missing values: Isolated missing days should use forward-fill / linear interpolation. Consumers with >80% missing data should be flagged or imputed with robust consumer-level baselines.
1. Negative values: Electricity consumption cannot be negative; negative values indicate metering errors or corrupted recordings and must be set to NaN or 0.
1. Extreme outliers: Readings above 99.9th percentile must be capped/winsorized rather than discarded, preserving legitimate industrial usage while preventing gradient explosion.
1. Severe class imbalance: Use class weighting in loss function and evaluate PR-AUC, Precision@K, and Recall@K rather than standard accuracy.
1. Feature Engineering: Extract statistical, temporal, rolling volatility, and drop/surge behavior from the time series.
