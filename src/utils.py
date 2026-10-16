"""
Electricity Theft Intelligence & Inspection Platform
Core Utility Functions & Path Management
"""

import os
import sys
import json
import logging
from pathlib import Path

# Base project paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
INTERIM_DATA_DIR = DATA_DIR / "interim"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

# Ensure essential directories exist
for directory in [DATA_DIR, RAW_DATA_DIR, INTERIM_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR, REPORTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Logger setup
def setup_logger(name: str = "SGCC_Pipeline") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        logger.addHandler(stream_handler)
    return logger

logger = setup_logger()

def locate_raw_dataset() -> Path:
    """
    Locates the raw SGCC dataset file in the workspace without making assumptions.
    Checks data/raw first, then archive, then scans workspace for any data.csv.
    """
    candidate_locations = [
        RAW_DATA_DIR / "data.csv",
        BASE_DIR / "archive" / "data.csv",
    ]
    
    for candidate in candidate_locations:
        if candidate.exists() and candidate.is_file():
            logger.info(f"Discovered raw dataset at: {candidate}")
            return candidate
            
    # Search recursively if not in primary spots
    csv_candidates = list(BASE_DIR.glob("**/data.csv"))
    if csv_candidates:
        logger.info(f"Discovered raw dataset via scan at: {csv_candidates[0]}")
        return csv_candidates[0]
        
    raise FileNotFoundError(
        f"SGCC dataset not found in {RAW_DATA_DIR} or {BASE_DIR / 'archive'}. "
        "Please ensure the extracted dataset folder is in the project workspace."
    )

def save_json_report(data: dict, filepath: Path) -> None:
    """Saves a dictionary as formatted JSON report."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    logger.info(f"Report saved successfully to {filepath}")
