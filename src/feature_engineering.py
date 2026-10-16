"""
Electricity Theft Intelligence & Inspection Platform
Feature Engineering Engine (Phase 2)

Extracts domain-rich statistical, behavioral, temporal, and distributional features
from chronologically ordered electricity consumption time series.
"""

import sys
import time
from pathlib import Path
from datetime import datetime, UTC
import numpy as np
import pandas as pd
from scipy import stats

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils import logger, INTERIM_DATA_DIR, PROCESSED_DATA_DIR, REPORTS_DIR, save_json_report
from src.data_audit import parse_date_columns

FEATURE_DOCUMENTATION = {
    # Statistical features
    "mean_consumption": "Average daily consumption (kWh/day)",
    "median_consumption": "Median daily consumption (kWh/day)",
    "std_consumption": "Standard deviation of daily consumption",
    "var_consumption": "Variance of daily consumption",
    "min_consumption": "Minimum daily consumption recorded",
    "max_consumption": "Maximum daily consumption recorded",
    "consumption_range": "Difference between maximum and minimum daily consumption",
    "coeff_of_variation": "Standard deviation divided by mean (relative dispersion)",
    "skewness": "Asymmetry of consumption distribution around the mean",
    "kurtosis": "Tailedness/extremity of consumption distribution",

    # Behavioral & Anomaly features
    "volatility_daily_diff": "Mean absolute day-to-day difference in consumption",
    "max_daily_drop": "Maximum single-day drop in consumption (indicator of bypass initiation)",
    "max_daily_surge": "Maximum single-day surge in consumption",
    "zero_consumption_ratio": "Proportion of days with exactly zero consumption",
    "low_consumption_ratio": "Proportion of days with near-zero consumption (< 0.1 kWh)",
    "abnormal_consumption_ratio": "Fraction of days exceeding 2 standard deviations from consumer mean",
    "autocorr_lag1": "Day-to-day serial correlation (lag 1 consistency)",
    "autocorr_lag7": "Week-to-week serial correlation (lag 7 weekly rhythm)",

    # Temporal & Seasonal features
    "trend_slope": "Linear regression slope of daily consumption across the monitoring span",
    "recent_vs_historical_ratio": "Ratio of recent 90-day mean consumption to prior historical mean (drop indicates theft)",
    "weekday_weekend_ratio": "Ratio of average weekday consumption to weekend consumption",
    "quarterly_variance_ratio": "Variance between quarterly mean consumptions (seasonal stability)",

    # Distributional features
    "q25_consumption": "25th percentile of daily consumption",
    "q75_consumption": "75th percentile of daily consumption",
    "iqr_consumption": "Interquartile range (Q75 - Q25)",
    "top10_percent_share": "Share of total consumption consumed in the top 10% highest consumption days",

    # Data Quality
    "data_quality_score": "Meter data completeness and reliability score [0.0 - 1.0]",
    "missing_reading_ratio": "Proportion of original readings that were missing prior to imputation"
}

def extract_features_from_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Vectorized feature extraction from clean consumption DataFrame.
    Expects metadata columns ['CONS_NO', 'FLAG', 'DATA_QUALITY_SCORE', 'MISSING_RATIO']
    followed by chronologically ordered date columns.
    """
    start_time = time.time()
    logger.info(f"Extracting engineered features for {len(df)} consumers...")

    metadata_cols = [c for c in ['CONS_NO', 'FLAG', 'DATA_QUALITY_SCORE', 'MISSING_RATIO'] if c in df.columns]
    date_cols = [c for c in df.columns if c not in metadata_cols and c not in ['DATA_QUALITY_CATEGORY']]

    # Parse date strings to timestamps for temporal calculations
    parsed_date_cols, parsed_dates, _ = parse_date_columns(date_cols)
    dates_array = np.array(parsed_dates)
    day_indices = np.arange(len(date_cols), dtype=np.float32)
    is_weekend = np.array([d.weekday() >= 5 for d in parsed_dates])

    # Convert consumption matrix to numpy array for fast vector operations
    C = df[parsed_date_cols].to_numpy(dtype=np.float32)
    num_consumers, num_days = C.shape

    # 1. Statistical Features
    mean = np.mean(C, axis=1)
    median = np.median(C, axis=1)
    std = np.std(C, axis=1)
    var = std ** 2
    c_min = np.min(C, axis=1)
    c_max = np.max(C, axis=1)
    c_range = c_max - c_min
    cv = np.where(mean > 1e-4, std / (mean + 1e-6), 0.0)

    # Scipy skew and kurtosis
    skew = stats.skew(C, axis=1, nan_policy='omit')
    kurt = stats.kurtosis(C, axis=1, nan_policy='omit')
    skew = np.nan_to_num(skew, nan=0.0)
    kurt = np.nan_to_num(kurt, nan=0.0)

    # 2. Behavioral Features
    diffs = np.diff(C, axis=1)
    volatility = np.mean(np.abs(diffs), axis=1)
    max_drop = np.max(np.maximum(0, -diffs), axis=1)
    max_surge = np.max(np.maximum(0, diffs), axis=1)
    
    zero_ratio = np.mean(C == 0.0, axis=1)
    low_ratio = np.mean(C < 0.1, axis=1)
    
    # Abnormal readings (> 2 std devs away from consumer mean)
    upper_bounds = mean[:, None] + 2.0 * std[:, None]
    abnormal_ratio = np.mean(C > upper_bounds, axis=1)

    # Autocorrelation (lag 1 and lag 7)
    centered = C - mean[:, None]
    denom = np.sum(centered ** 2, axis=1) + 1e-6
    autocorr_lag1 = np.sum(centered[:, :-1] * centered[:, 1:], axis=1) / denom
    autocorr_lag7 = np.sum(centered[:, :-7] * centered[:, 7:], axis=1) / denom
    autocorr_lag1 = np.clip(autocorr_lag1, -1.0, 1.0)
    autocorr_lag7 = np.clip(autocorr_lag7, -1.0, 1.0)

    # 3. Temporal & Seasonal Features
    # Trend slope: Linear regression over day indices
    x_mean = np.mean(day_indices)
    x_dev = day_indices - x_mean
    ss_xx = np.sum(x_dev ** 2)
    slopes = np.sum(centered * x_dev[None, :], axis=1) / ss_xx

    # Recent (last 90 days) vs Historical (prior days)
    recent_days = min(90, num_days // 4)
    recent_mean = np.mean(C[:, -recent_days:], axis=1)
    historical_mean = np.mean(C[:, :-recent_days], axis=1) + 1e-6
    recent_ratio = np.clip(recent_mean / historical_mean, 0.0, 10.0)

    # Weekday vs Weekend ratio
    weekday_mean = np.mean(C[:, ~is_weekend], axis=1)
    weekend_mean = np.mean(C[:, is_weekend], axis=1) + 1e-6
    weekday_weekend_ratio = np.clip(weekday_mean / weekend_mean, 0.0, 10.0)

    # Quarterly variance
    quarter_len = num_days // 4
    if quarter_len > 0:
        q_means = np.stack([
            np.mean(C[:, :quarter_len], axis=1),
            np.mean(C[:, quarter_len:2*quarter_len], axis=1),
            np.mean(C[:, 2*quarter_len:3*quarter_len], axis=1),
            np.mean(C[:, 3*quarter_len:], axis=1)
        ], axis=1)
        quarterly_var = np.var(q_means, axis=1)
    else:
        quarterly_var = np.zeros(num_consumers, dtype=np.float32)

    # 4. Distributional Features
    q25 = np.percentile(C, 25, axis=1)
    q75 = np.percentile(C, 75, axis=1)
    iqr = q75 - q25

    # Top 10% consumption share
    sorted_C = np.sort(C, axis=1)
    top_10_cutoff = int(0.90 * num_days)
    top10_sum = np.sum(sorted_C[:, top_10_cutoff:], axis=1)
    total_sum = np.sum(C, axis=1) + 1e-6
    top10_share = np.clip(top10_sum / total_sum, 0.0, 1.0)

    # Assembly into engineered features DataFrame
    features_dict = {
        "CONS_NO": df["CONS_NO"],
        # Target if present
        **({"FLAG": df["FLAG"]} if "FLAG" in df.columns else {}),
        
        # Data Quality
        "data_quality_score": df["DATA_QUALITY_SCORE"] if "DATA_QUALITY_SCORE" in df.columns else np.ones(num_consumers),
        "missing_reading_ratio": df["MISSING_RATIO"] if "MISSING_RATIO" in df.columns else np.zeros(num_consumers),

        # Statistical
        "mean_consumption": mean,
        "median_consumption": median,
        "std_consumption": std,
        "var_consumption": var,
        "min_consumption": c_min,
        "max_consumption": c_max,
        "consumption_range": c_range,
        "coeff_of_variation": cv,
        "skewness": skew,
        "kurtosis": kurt,

        # Behavioral
        "volatility_daily_diff": volatility,
        "max_daily_drop": max_drop,
        "max_daily_surge": max_surge,
        "zero_consumption_ratio": zero_ratio,
        "low_consumption_ratio": low_ratio,
        "abnormal_consumption_ratio": abnormal_ratio,
        "autocorr_lag1": autocorr_lag1,
        "autocorr_lag7": autocorr_lag7,

        # Temporal
        "trend_slope": slopes,
        "recent_vs_historical_ratio": recent_ratio,
        "weekday_weekend_ratio": weekday_weekend_ratio,
        "quarterly_variance_ratio": quarterly_var,

        # Distributional
        "q25_consumption": q25,
        "q75_consumption": q75,
        "iqr_consumption": iqr,
        "top10_percent_share": top10_share
    }

    feature_df = pd.DataFrame(features_dict)
    duration = round(time.time() - start_time, 2)
    logger.info(f"Feature engineering completed in {duration}s. Created {len(feature_df.columns)} columns.")

    return feature_df

def run_feature_engineering_pipeline(
    interim_path: Path = None,
    output_path: Path = None
) -> Path:
    """Runs the feature engineering pipeline from interim clean readings."""
    if interim_path is None:
        interim_path = INTERIM_DATA_DIR / "clean_readings.csv"
        
    if output_path is None:
        output_path = PROCESSED_DATA_DIR / "features.csv"

    logger.info(f"Reading interim dataset from {interim_path}...")
    df = pd.read_csv(interim_path, low_memory=False)

    feature_df = extract_features_from_dataframe(df)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Saving engineered features to {output_path}...")
    feature_df.to_csv(output_path, index=False)
    logger.info("Engineered features saved successfully.")

    # Save documentation artifact
    save_json_report(FEATURE_DOCUMENTATION, REPORTS_DIR / "feature_catalog.json")

    return output_path

if __name__ == "__main__":
    run_feature_engineering_pipeline()
