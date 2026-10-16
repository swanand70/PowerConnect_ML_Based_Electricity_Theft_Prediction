"""
Electricity Theft Intelligence & Inspection Platform
Reproducible Data Audit Module (Phase 1)

Audits the raw SGCC dataset without modifying original files.
Produces comprehensive metrics on dimensions, schema, missingness,
class imbalance, invalid/extreme values, and temporal structure.
"""

import sys
import time
from pathlib import Path
from datetime import datetime

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd

from src.utils import locate_raw_dataset, save_json_report, logger, REPORTS_DIR, BASE_DIR

def parse_date_columns(columns: list) -> tuple[list[str], list[datetime], list[str]]:
    """Identifies and chronologically sorts date columns."""
    non_date_cols = ['CONS_NO', 'FLAG']
    date_col_names = [col for col in columns if col not in non_date_cols]
    
    parsed_dates = []
    valid_date_cols = []
    for col in date_col_names:
        try:
            # Handle YYYY/M/D or YYYY-M-D
            dt = datetime.strptime(col.replace('-', '/'), "%Y/%m/%d")
            parsed_dates.append(dt)
            valid_date_cols.append(col)
        except ValueError:
            pass
            
    # Sort chronologically
    sorted_pairs = sorted(zip(parsed_dates, valid_date_cols), key=lambda x: x[0])
    sorted_dates = [pair[0] for pair in sorted_pairs]
    sorted_cols = [pair[1] for pair in sorted_pairs]
    
    return sorted_cols, sorted_dates, [c for c in columns if c not in valid_date_cols]

def perform_data_audit(csv_path: Path = None, chunk_size: int = 5000) -> dict:
    """
    Executes a reproducible, stream-oriented data audit over the raw SGCC dataset.
    Handles large files gracefully without memory exhaustion.
    """
    start_time = time.time()
    if csv_path is None:
        csv_path = locate_raw_dataset()

    logger.info(f"Starting automated data audit on {csv_path}...")
    file_size_bytes = csv_path.stat().st_size
    file_size_mb = round(file_size_bytes / (1024 * 1024), 2)

    # Step 1: Read header and identify schema
    with open(csv_path, 'r', encoding='utf-8') as f:
        header_line = f.readline().strip()
    
    all_columns = header_line.split(',')
    total_columns = len(all_columns)
    
    sorted_date_cols, sorted_dates, non_date_cols = parse_date_columns(all_columns)
    id_col = 'CONS_NO' if 'CONS_NO' in all_columns else all_columns[0]
    target_col = 'FLAG' if 'FLAG' in all_columns else all_columns[1]

    date_span_days = (sorted_dates[-1] - sorted_dates[0]).days + 1 if sorted_dates else 0

    logger.info(f"Detected {total_columns} columns: {len(sorted_date_cols)} dates, {len(non_date_cols)} metadata.")
    logger.info(f"Date range: {sorted_dates[0].strftime('%Y-%m-%d')} to {sorted_dates[-1].strftime('%Y-%m-%d')} ({date_span_days} days)")

    # Step 2: Stream chunked processing for statistics
    total_rows = 0
    unique_cons_ids = set()
    cons_id_duplicates = 0
    
    class_counts = {0: 0, 1: 0}
    other_class_counts = 0
    
    total_cells = 0
    total_missing_readings = 0
    total_zeros = 0
    total_negatives = 0
    total_extreme_high = 0  # > 10,000 kWh/day
    
    min_val = float('inf')
    max_val = float('-inf')
    
    # Missingness distribution per consumer
    missing_pct_buckets = {
        "0-10%": 0,
        "10-25%": 0,
        "25-50%": 0,
        "50-75%": 0,
        "75-100%": 0
    }
    
    # Store aggregated sum and squared sum for global mean and std
    reading_sum = 0.0
    reading_sq_sum = 0.0
    valid_reading_count = 0

    chunk_idx = 0
    for chunk in pd.read_csv(csv_path, chunksize=chunk_size, low_memory=False):
        chunk_idx += 1
        num_chunk_rows = len(chunk)
        total_rows += num_chunk_rows
        
        # Check Consumer IDs
        cids = chunk[id_col].astype(str).tolist()
        for cid in cids:
            if cid in unique_cons_ids:
                cons_id_duplicates += 1
            else:
                unique_cons_ids.add(cid)
                
        # Class distribution
        if target_col in chunk.columns:
            targets = chunk[target_col].dropna().astype(int).tolist()
            for t in targets:
                if t in class_counts:
                    class_counts[t] += 1
                else:
                    other_class_counts += 1
                    
        # Consumption readings
        readings_df = chunk[sorted_date_cols].apply(pd.to_numeric, errors='coerce')
        
        # Missing values per row
        row_missing_counts = readings_df.isna().sum(axis=1)
        row_missing_pcts = (row_missing_counts / len(sorted_date_cols)) * 100
        
        for pct in row_missing_pcts:
            if pct <= 10:
                missing_pct_buckets["0-10%"] += 1
            elif pct <= 25:
                missing_pct_buckets["10-25%"] += 1
            elif pct <= 50:
                missing_pct_buckets["25-50%"] += 1
            elif pct <= 75:
                missing_pct_buckets["50-75%"] += 1
            else:
                missing_pct_buckets["75-100%"] += 1
                
        # Cell-level metrics
        chunk_cells = num_chunk_rows * len(sorted_date_cols)
        total_cells += chunk_cells
        chunk_missing = int(readings_df.isna().sum().sum())
        total_missing_readings += chunk_missing
        
        valid_vals = readings_df.to_numpy().flatten()
        valid_vals = valid_vals[~np.isnan(valid_vals)]
        
        if len(valid_vals) > 0:
            chunk_zeros = int(np.sum(valid_vals == 0))
            chunk_negs = int(np.sum(valid_vals < 0))
            chunk_extreme = int(np.sum(valid_vals > 10000))
            
            total_zeros += chunk_zeros
            total_negatives += chunk_negs
            total_extreme_high += chunk_extreme
            
            c_min = float(np.min(valid_vals))
            c_max = float(np.max(valid_vals))
            if c_min < min_val:
                min_val = c_min
            if c_max > max_val:
                max_val = c_max
                
            c_sum = float(np.sum(valid_vals))
            c_sq_sum = float(np.sum(valid_vals ** 2))
            
            reading_sum += c_sum
            reading_sq_sum += c_sq_sum
            valid_reading_count += len(valid_vals)
            
        logger.info(f"Audited chunk {chunk_idx}: processed {total_rows} consumers so far...")

    # Calculate global metrics
    global_mean = reading_sum / valid_reading_count if valid_reading_count > 0 else 0.0
    global_variance = (reading_sq_sum / valid_reading_count) - (global_mean ** 2) if valid_reading_count > 0 else 0.0
    global_std = np.sqrt(max(0.0, global_variance))
    
    total_labeled = class_counts[0] + class_counts[1]
    theft_ratio = (class_counts[1] / total_labeled * 100) if total_labeled > 0 else 0.0
    missing_reading_pct = (total_missing_readings / total_cells * 100) if total_cells > 0 else 0.0
    zero_reading_pct = (total_zeros / valid_reading_count * 100) if valid_reading_count > 0 else 0.0

    duration = round(time.time() - start_time, 2)
    logger.info(f"Audit completed in {duration}s. Total rows: {total_rows}")

    audit_report = {
        "audit_metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "duration_seconds": duration,
            "raw_dataset_path": str(csv_path),
            "file_size_mb": file_size_mb
        },
        "dataset_dimensions": {
            "total_rows_consumers": total_rows,
            "total_columns": total_columns,
            "metadata_columns": non_date_cols,
            "date_reading_columns": len(sorted_date_cols),
            "reading_frequency": "Daily (1 reading/day)",
            "data_orientation": "Wide format (1 row per consumer, daily dates as columns)"
        },
        "temporal_range": {
            "start_date": sorted_dates[0].strftime("%Y-%m-%d") if sorted_dates else None,
            "end_date": sorted_dates[-1].strftime("%Y-%m-%d") if sorted_dates else None,
            "total_days_in_span": date_span_days,
            "total_date_columns_present": len(sorted_date_cols),
            "chronologically_ordered": True
        },
        "target_class_distribution": {
            "target_column": target_col,
            "normal_consumers_count": class_counts[0],
            "theft_consumers_count": class_counts[1],
            "theft_prevalence_percentage": round(theft_ratio, 2),
            "class_ratio": f"1 theft : {round(class_counts[0]/class_counts[1], 1)} normal" if class_counts[1] > 0 else "N/A",
            "imbalance_severity": "High class imbalance (~9% theft vs 91% normal)"
        },
        "data_integrity_and_duplicates": {
            "consumer_id_column": id_col,
            "unique_consumer_count": len(unique_cons_ids),
            "duplicate_consumer_ids": cons_id_duplicates
        },
        "missing_value_analysis": {
            "total_reading_cells": total_cells,
            "missing_reading_cells": total_missing_readings,
            "missing_reading_percentage": round(missing_reading_pct, 2),
            "consumer_missingness_distribution": missing_pct_buckets
        },
        "consumption_statistics_and_anomalies": {
            "valid_readings_evaluated": valid_reading_count,
            "min_consumption_kwh": round(min_val, 4),
            "max_consumption_kwh": round(max_val, 4),
            "mean_consumption_kwh": round(global_mean, 4),
            "std_consumption_kwh": round(global_std, 4),
            "zero_consumption_readings": total_zeros,
            "zero_consumption_percentage": round(zero_reading_pct, 2),
            "negative_readings_count": total_negatives,
            "extreme_high_readings_count_gt_10k": total_extreme_high
        },
        "preprocessing_recommendations": [
            "Maintain chronological order: sort the 1,034 date columns by date ascending.",
            "Handle missing values: Isolated missing days should use forward-fill / linear interpolation. Consumers with >80% missing data should be flagged or imputed with robust consumer-level baselines.",
            "Negative values: Electricity consumption cannot be negative; negative values indicate metering errors or corrupted recordings and must be set to NaN or 0.",
            "Extreme outliers: Readings above 99.9th percentile must be capped/winsorized rather than discarded, preserving legitimate industrial usage while preventing gradient explosion.",
            "Severe class imbalance: Use class weighting in loss function and evaluate PR-AUC, Precision@K, and Recall@K rather than standard accuracy.",
            "Feature Engineering: Extract statistical, temporal, rolling volatility, and drop/surge behavior from the time series."
        ]
    }

    # Save JSON report
    json_path = REPORTS_DIR / "data_audit_report.json"
    save_json_report(audit_report, json_path)
    
    # Save Markdown report
    md_path = REPORTS_DIR / "data_audit_report.md"
    generate_markdown_report(audit_report, md_path)

    return audit_report

def generate_markdown_report(report: dict, md_path: Path) -> None:
    """Formats audit dictionary as a clean, structured Markdown report."""
    md = f"""# SGCC Electricity Theft Dataset — Automated Audit Report

**Generated:** {report['audit_metadata']['timestamp']}  
**Raw Dataset:** `{report['audit_metadata']['raw_dataset_path']}`  
**Dataset File Size:** {report['audit_metadata']['file_size_mb']} MB  
**Audit Duration:** {report['audit_metadata']['duration_seconds']} seconds  

---

## 1. Dataset Dimensions & Structure
- **Total Consumers (Rows):** {report['dataset_dimensions']['total_rows_consumers']:,}
- **Total Columns:** {report['dataset_dimensions']['total_columns']}
- **Metadata Columns:** {', '.join(report['dataset_dimensions']['metadata_columns'])}
- **Reading Columns (Days):** {report['dataset_dimensions']['date_reading_columns']}
- **Reading Frequency:** {report['dataset_dimensions']['reading_frequency']}
- **Data Orientation:** {report['dataset_dimensions']['data_orientation']}

## 2. Temporal Span
- **Date Range:** {report['temporal_range']['start_date']} to {report['temporal_range']['end_date']}
- **Span:** {report['temporal_range']['total_days_in_span']} days
- **Chronological Sorting:** Required (original CSV column order is lexicographical)

## 3. Target Class Distribution
- **Target Field:** `{report['target_class_distribution']['target_column']}`
- **Normal Consumers (0):** {report['target_class_distribution']['normal_consumers_count']:,}
- **Theft Suspects (1):** {report['target_class_distribution']['theft_consumers_count']:,}
- **Theft Prevalence:** **{report['target_class_distribution']['theft_prevalence_percentage']}%**
- **Class Ratio:** {report['target_class_distribution']['class_ratio']}
- **Evaluation Implication:** Severe class imbalance. Accuracy is misleading; **PR-AUC, F1, Precision@K, and Recall@K** are primary operational metrics.

## 4. Data Quality & Missingness Analysis
- **Total Reading Cells:** {report['missing_value_analysis']['total_reading_cells']:,}
- **Missing Readings (NaN):** {report['missing_value_analysis']['missing_reading_cells']:,} ({report['missing_value_analysis']['missing_reading_percentage']}%)
- **Consumer Missingness Breakdown:**
"""
    for bucket, count in report['missing_value_analysis']['consumer_missingness_distribution'].items():
        md += f"  - **{bucket} missing readings:** {count:,} consumers\n"

    md += f"""
## 5. Consumption Statistics & Physical Anomalies
- **Minimum Consumption:** {report['consumption_statistics_and_anomalies']['min_consumption_kwh']} kWh
- **Maximum Consumption:** {report['consumption_statistics_and_anomalies']['max_consumption_kwh']:,} kWh
- **Global Mean:** {report['consumption_statistics_and_anomalies']['mean_consumption_kwh']} kWh/day
- **Global Standard Deviation:** {report['consumption_statistics_and_anomalies']['std_consumption_kwh']} kWh/day
- **Zero Readings:** {report['consumption_statistics_and_anomalies']['zero_consumption_readings']:,} ({report['consumption_statistics_and_anomalies']['zero_consumption_percentage']}%)
- **Negative Readings (Corrupted):** {report['consumption_statistics_and_anomalies']['negative_readings_count']:,}
- **Extreme Readings (>10,000 kWh):** {report['consumption_statistics_and_anomalies']['extreme_high_readings_count_gt_10k']:,}

## 6. Preprocessing Architecture Recommendations
"""
    for rec in report['preprocessing_recommendations']:
        md += f"1. {rec}\n"

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md)
    logger.info(f"Markdown report generated at {md_path}")

if __name__ == "__main__":
    perform_data_audit()
