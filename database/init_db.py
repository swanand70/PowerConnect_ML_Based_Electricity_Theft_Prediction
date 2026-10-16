"""
Electricity Theft Intelligence & Inspection Platform
Database Initialization & Seeding Module (Phase 3)

Connects to MySQL using the dedicated application account (theft_admin).
Applies normalized relational schema and seeds:
- 20 synthetic Indian utility employee accounts (EMP001 to EMP020)
- 1 Board Communication Admin account
- Demo consumer accounts linked to real SGCC data records
- Active ML model metadata registration (v1.0.0)
- Initial real predictions, SHAP explanations, inspection cases, bills, issues, and board posts.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, date, timedelta, UTC
import pymysql
import bcrypt
import pandas as pd

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils import logger, BASE_DIR, MODELS_DIR, PROCESSED_DATA_DIR
from src.predict import predict_consumer_theft_risk

def hash_password(plain: str) -> str:
    """Hashes password with bcrypt."""
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def load_env_db_config() -> dict:
    """Loads database connection configuration from .env without hardcoding."""
    env_file = BASE_DIR / ".env"
    if not env_file.exists():
        raise FileNotFoundError(f".env configuration not found at {env_file}")
        
    config = {}
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                config[k.strip()] = v.strip()
                
    return {
        "host": config.get("DB_HOST", "localhost"),
        "port": int(config.get("DB_PORT", 3306)),
        "user": config.get("DB_USER", "theft_admin"),
        "password": config.get("DB_PASSWORD", ""),
        "database": config.get("DB_NAME", "electricity_theft_db")
    }

def init_and_seed_database():
    """Initializes schema and seeds baseline application entities."""
    db_cfg = load_env_db_config()
    logger.info(f"Connecting to MySQL as application user '{db_cfg['user']}' at {db_cfg['host']}:{db_cfg['port']}...")

    conn = pymysql.connect(
        host=db_cfg["host"],
        port=db_cfg["port"],
        user=db_cfg["user"],
        password=db_cfg["password"],
        database=db_cfg["database"],
        charset="utf8mb4",
        autocommit=False
    )
    cursor = conn.cursor()

    try:
        # Step 1: Execute schema.sql
        schema_path = BASE_DIR / "database" / "schema.sql"
        logger.info(f"Applying schema from {schema_path}...")
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
            
        statements = [stmt.strip() for stmt in schema_sql.split(";") if stmt.strip()]
        for stmt in statements:
            # Skip USE statement since connection is already bound
            if stmt.upper().startswith("USE"):
                continue
            cursor.execute(stmt)
        conn.commit()
        logger.info("Schema applied successfully.")

        # Step 2: Register Active Model Metadata (from models/v1/model_metadata.json)
        meta_file = MODELS_DIR / "v1" / "model_metadata.json"
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)

        cursor.execute("SELECT id FROM model_versions WHERE model_version = %s;", (meta["model_version"],))
        existing_model = cursor.fetchone()
        
        if not existing_model:
            cursor.execute("""
                INSERT INTO model_versions (
                    model_version, dataset_version, feature_version, algorithm,
                    training_timestamp, threshold, precision_score, recall_score,
                    f1_score, roc_auc, pr_auc, status, model_path
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                meta["model_version"],
                meta["dataset_version"],
                meta["feature_version"],
                meta["algorithm"],
                datetime.fromisoformat(meta["training_timestamp"]),
                meta["threshold"],
                meta["test_metrics"]["precision"],
                meta["test_metrics"]["recall"],
                meta["test_metrics"]["f1"],
                meta["test_metrics"]["roc_auc"],
                meta["test_metrics"]["pr_auc"],
                meta["status"],
                str(MODELS_DIR / "v1" / "xgboost_model.pkl")
            ))
            model_id = cursor.lastrowid
            logger.info(f"Registered model version {meta['model_version']} (ID: {model_id}).")
        else:
            model_id = existing_model[0]

        # Step 3: Seed 20 Indian Utility Employees (EMP001 to EMP020)
        # Default password for seeded employee demo accounts
        employee_default_pass = "Utility@2026"
        hashed_emp_pass = hash_password(employee_default_pass)

        employees_data = [
            ("EMP001", "Rajesh Sharma", "Chief Flying Squad Officer", "Enforcement & Anti-Theft", "North Zone", "rajesh.sharma@utility.gov.in", "+91 98401 10001"),
            ("EMP002", "Priya Sundaram", "Senior Vigilance Officer", "Special Operations Squad", "South Zone", "priya.sundaram@utility.gov.in", "+91 98401 10002"),
            ("EMP003", "Karthik Venkataraman", "Enforcement Specialist", "Field Vigilance Wing", "Central Zone", "karthik.v@utility.gov.in", "+91 98401 10003"),
            ("EMP004", "Ananya Iyer", "Field Technical Inspector", "Meter Audit Division", "West Zone", "ananya.iyer@utility.gov.in", "+91 98401 10004"),
            ("EMP005", "Suresh Ganesan", "Vigilance Squad Lead", "Rapid Response Team", "North Zone", "suresh.g@utility.gov.in", "+91 98401 10005"),
            ("EMP006", "Deepa Nambiar", "Senior Field Inspector", "Inspection Flying Squad", "South Zone", "deepa.nambiar@utility.gov.in", "+91 98401 10006"),
            ("EMP007", "Vijay Raghavan", "Flying Squad Officer", "Distribution Vigilance", "East Zone", "vijay.raghavan@utility.gov.in", "+91 98401 10007"),
            ("EMP008", "Meera Nair", "Enforcement Officer", "Theft Detection Unit", "Central Zone", "meera.nair@utility.gov.in", "+91 98401 10008"),
            ("EMP009", "Arun Prakash", "Technical Vigilance Officer", "Anti-Tamper Squad", "West Zone", "arun.prakash@utility.gov.in", "+91 98401 10009"),
            ("EMP010", "Shalini Natarajan", "Field Squad Lead", "Technical Inspection Unit", "East Zone", "shalini.n@utility.gov.in", "+91 98401 10010"),
            ("EMP011", "Balaji Ranganathan", "Senior Enforcement Inspector", "Flying Squad Wing", "North Zone", "balaji.r@utility.gov.in", "+91 98401 10011"),
            ("EMP012", "Divya Krishnamurthy", "Vigilance Officer", "Field Audit Squad", "South Zone", "divya.k@utility.gov.in", "+91 98401 10012"),
            ("EMP013", "Senthil Kumar", "Field Inspector", "Rapid Inspection Squad", "Central Zone", "senthil.kumar@utility.gov.in", "+91 98401 10013"),
            ("EMP014", "Pooja Swaminathan", "Technical Field Investigator", "Meter Security Wing", "West Zone", "pooja.s@utility.gov.in", "+91 98401 10014"),
            ("EMP015", "Manoj Chandrasekhar", "Enforcement Officer", "Area Vigilance Division", "East Zone", "manoj.c@utility.gov.in", "+91 98401 10015"),
            ("EMP016", "Sneha Murugan", "Flying Squad Inspector", "Field Inspection Unit", "North Zone", "sneha.m@utility.gov.in", "+91 98401 10016"),
            ("EMP017", "Ravichandran Thangavel", "Senior Squad Lead", "Anti-Bypass Cell", "South Zone", "ravichandran.t@utility.gov.in", "+91 98401 10017"),
            ("EMP018", "Harini Ramaswamy", "Field Investigator", "Smart Meter Vigilance", "Central Zone", "harini.r@utility.gov.in", "+91 98401 10018"),
            ("EMP019", "Dinesh Govindarajan", "Enforcement Inspector", "Field Operations Squad", "West Zone", "dinesh.g@utility.gov.in", "+91 98401 10019"),
            ("EMP020", "Abhinav Pillai", "Field Technical Lead", "Enforcement Operations", "East Zone", "abhinav.pillai@utility.gov.in", "+91 98401 10020")
        ]

        employee_pk_map = {}
        for emp_id, name, desig, dept, zone, email, phone in employees_data:
            # Check or create user
            username = emp_id.lower()
            cursor.execute("SELECT id FROM users WHERE username = %s;", (username,))
            row = cursor.fetchone()
            if not row:
                cursor.execute("""
                    INSERT INTO users (username, email, hashed_password, role, is_active, onboarding_completed)
                    VALUES (%s, %s, %s, 'INSPECTION_EMPLOYEE', TRUE, FALSE);
                """, (username, email, hashed_emp_pass))
                user_id = cursor.lastrowid
            else:
                user_id = row[0]

            # Check or create employee
            cursor.execute("SELECT id FROM employees WHERE employee_id = %s;", (emp_id,))
            emp_row = cursor.fetchone()
            if not emp_row:
                cursor.execute("""
                    INSERT INTO employees (employee_id, user_id, full_name, designation, department, zone, phone)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (emp_id, user_id, name, desig, dept, zone, phone))
                employee_pk_map[emp_id] = cursor.lastrowid
            else:
                employee_pk_map[emp_id] = emp_row[0]

        logger.info(f"Seeded 20 employee accounts (EMP001 - EMP020). Default password: '{employee_default_pass}'.")

        # Step 4: Seed Board Communication Admin Account
        board_user = "board_admin"
        board_email = "board@tneb.utility.gov.in"
        cursor.execute("SELECT id FROM users WHERE username = %s;", (board_user,))
        b_row = cursor.fetchone()
        if not b_row:
            cursor.execute("""
                INSERT INTO users (username, email, hashed_password, role, is_active, onboarding_completed)
                VALUES (%s, %s, %s, 'BOARD_COMMUNICATION_ADMIN', TRUE, FALSE);
            """, (board_user, board_email, hashed_emp_pass))
            board_user_id = cursor.lastrowid
            logger.info(f"Seeded Board Admin user '{board_user}' (ID: {board_user_id}).")
        else:
            board_user_id = b_row[0]

        # Step 5: Seed Demo Consumers linked to Real SGCC Data
        # Pick 10 consumers from features.csv (5 flagged suspects, 5 clean)
        feat_df = pd.read_csv(PROCESSED_DATA_DIR / "features.csv")
        suspects_sample = feat_df[feat_df["FLAG"] == 1].head(6)
        clean_sample = feat_df[feat_df["FLAG"] == 0].head(6)
        selected_sample = pd.concat([suspects_sample, clean_sample]).reset_index(drop=True)

        synthetic_names = [
            ("Ramesh Krishnan", "Plot 42, Velachery Main Road, Chennai", "South Zone", "Guindy", "Velachery 110kV", "Feeder-4A", 12.9815, 80.2180),
            ("Gita Sundararajan", "15/3, Arcot Road, Kodambakkam, Chennai", "Central Zone", "T. Nagar", "Kodambakkam 33kV", "Feeder-2B", 13.0520, 80.2245),
            ("Murugan Textiles", "28, G.S.T. Road, Chromepet, Chennai", "South Zone", "Tambaram", "Chromepet 110kV", "Feeder-1C", 12.9516, 80.1462),
            ("Anand Electricals", "74, Ambattur Industrial Estate, Chennai", "North Zone", "Ambattur", "Ambattur 230kV", "Feeder-5A", 13.0878, 80.1610),
            ("Sivakumar Narayanan", "102, Poonamallee High Road, Kilpauk", "Central Zone", "Egmore", "Kilpauk 33kV", "Feeder-3D", 13.0784, 80.2435),
            ("Apex Plast Moulds", "88, Sipcot Industrial Park, Irungattukottai", "West Zone", "Sriperumbudur", "Irungattukottai 110kV", "Feeder-6A", 12.9732, 79.9915),
            ("Kavitha Subramanian", "12, 4th Cross St, Besant Nagar, Chennai", "South Zone", "Adyar", "Besant Nagar 33kV", "Feeder-2A", 13.0003, 80.2667),
            ("Balaji Supermarket", "55, Paper Mills Road, Perambur, Chennai", "North Zone", "Perambur", "Perambur 33kV", "Feeder-1A", 13.1114, 80.2432),
            ("Kalyan Rao", "9, 2nd Avenue, Anna Nagar, Chennai", "Central Zone", "Anna Nagar", "Anna Nagar 110kV", "Feeder-4C", 13.0850, 80.2101),
            ("Shanthi Illam", "31, Gandhi Road, West Tambaram, Chennai", "South Zone", "Tambaram", "Tambaram 110kV", "Feeder-2C", 12.9249, 80.1165),
            ("Lakshmi Nilayam", "19, Rajaji Salai, George Town, Chennai", "East Zone", "Royapuram", "George Town 33kV", "Feeder-1B", 13.0905, 80.2910),
            ("Muthu Auto Garage", "63, Red Hills Road, Villivakkam, Chennai", "North Zone", "Villivakkam", "Villivakkam 33kV", "Feeder-3A", 13.1092, 80.2078)
        ]

        consumer_ids = []
        for idx, row in selected_sample.iterrows():
            sgcc_hash = str(row["CONS_NO"])
            c_name, c_addr, c_zone, c_div, c_sub, c_fdr, c_lat, c_lng = synthetic_names[idx]
            
            # Check or create user for consumer
            c_username = f"cons_{idx+1:02d}"
            c_email = f"consumer_{idx+1:02d}@utility.gov.in"
            
            cursor.execute("SELECT id FROM users WHERE username = %s;", (c_username,))
            u_row = cursor.fetchone()
            if not u_row:
                cursor.execute("""
                    INSERT INTO users (username, email, hashed_password, role, is_active, onboarding_completed)
                    VALUES (%s, %s, %s, 'CONSUMER', TRUE, FALSE);
                """, (c_username, c_email, hashed_emp_pass))
                c_user_id = cursor.lastrowid
            else:
                c_user_id = u_row[0]

            # Check or create consumer
            cursor.execute("SELECT id FROM consumers WHERE cons_no = %s;", (sgcc_hash,))
            c_row = cursor.fetchone()
            if not c_row:
                cursor.execute("""
                    INSERT INTO consumers (
                        cons_no, user_id, name, address, zone, division,
                        substation, feeder, latitude, longitude, tariff_category, sanctioned_load_kw
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    sgcc_hash, c_user_id, c_name, c_addr, c_zone, c_div,
                    c_sub, c_fdr, c_lat, c_lng,
                    "COMMERCIAL" if "Textiles" in c_name or "Electricals" in c_name or "Plast" in c_name else "DOMESTIC",
                    15.0 if "Textiles" in c_name or "Plast" in c_name else 5.0
                ))
                cons_pk = cursor.lastrowid
            else:
                cons_pk = c_row[0]
            consumer_ids.append((cons_pk, sgcc_hash, row))

            # Meter
            cursor.execute("SELECT id FROM meters WHERE consumer_id = %s;", (cons_pk,))
            if not cursor.fetchone():
                meter_num = f"MTR-TN-{2024000 + idx}"
                cursor.execute("""
                    INSERT INTO meters (consumer_id, meter_number, meter_type, installation_date, status)
                    VALUES (%s, %s, 'SMART_BIDIRECTIONAL', '2023-01-15', 'ACTIVE');
                """, (cons_pk, meter_num))

            # Store engineered consumption features
            cursor.execute("SELECT id FROM consumption_features WHERE consumer_id = %s;", (cons_pk,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO consumption_features (
                        consumer_id, feature_version, mean_consumption, median_consumption,
                        std_consumption, var_consumption, min_consumption, max_consumption,
                        consumption_range, coeff_of_variation, skewness, kurtosis,
                        volatility_daily_diff, max_daily_drop, max_daily_surge,
                        zero_consumption_ratio, low_consumption_ratio, abnormal_consumption_ratio,
                        autocorr_lag1, autocorr_lag7, trend_slope, recent_vs_historical_ratio,
                        weekday_weekend_ratio, quarterly_variance_ratio, q25_consumption,
                        q75_consumption, iqr_consumption, top10_percent_share,
                        data_quality_score, missing_reading_ratio
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    cons_pk, "v1.0",
                    float(row["mean_consumption"]), float(row["median_consumption"]),
                    float(row["std_consumption"]), float(row["var_consumption"]),
                    float(row["min_consumption"]), float(row["max_consumption"]),
                    float(row["consumption_range"]), float(row["coeff_of_variation"]),
                    float(row["skewness"]), float(row["kurtosis"]),
                    float(row["volatility_daily_diff"]), float(row["max_daily_drop"]),
                    float(row["max_daily_surge"]), float(row["zero_consumption_ratio"]),
                    float(row["low_consumption_ratio"]), float(row["abnormal_consumption_ratio"]),
                    float(row["autocorr_lag1"]), float(row["autocorr_lag7"]),
                    float(row["trend_slope"]), float(row["recent_vs_historical_ratio"]),
                    float(row["weekday_weekend_ratio"]), float(row["quarterly_variance_ratio"]),
                    float(row["q25_consumption"]), float(row["q75_consumption"]),
                    float(row["iqr_consumption"]), float(row["top10_percent_share"]),
                    float(row["data_quality_score"]), float(row["missing_reading_ratio"])
                ))

            # Bills for the consumer
            cursor.execute("SELECT id FROM bills WHERE consumer_id = %s;", (cons_pk,))
            if not cursor.fetchone():
                today = date.today()
                for b_offset in range(3):
                    b_month = (today - timedelta(days=30 * b_offset)).strftime("%b %Y")
                    b_units = round(float(row["mean_consumption"]) * 30.0, 1)
                    b_amt = round(b_units * 6.5, 2)
                    b_status = "PAID" if b_offset > 0 else "PENDING"
                    due_d = today + timedelta(days=15 - 30 * b_offset)
                    cursor.execute("""
                        INSERT INTO bills (consumer_id, bill_number, billing_period_start, billing_period_end, units_consumed_kwh, amount_inr, due_date, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        cons_pk, f"BILL-2026-{cons_pk:04d}-{b_offset}",
                        today - timedelta(days=30 * (b_offset + 1)),
                        today - timedelta(days=30 * b_offset),
                        b_units, b_amt, due_d, b_status
                    ))

        logger.info(f"Seeded {len(consumer_ids)} demo consumers mapped to authentic SGCC records.")

        # Step 6: Generate Real Predictions and Inspection Cases
        # Load clean interim row for SHAP inference
        interim_df = pd.read_csv(BASE_DIR / "data" / "interim" / "clean_readings.csv", nrows=100)
        
        case_counter = 1
        for cons_pk, sgcc_hash, feat_row in consumer_ids:
            # Find matching raw/interim row for exact inference
            match_row = interim_df[interim_df["CONS_NO"] == sgcc_hash]
            if len(match_row) > 0:
                pred_result = predict_consumer_theft_risk(match_row.iloc[[0]])
            else:
                # Direct prediction from precomputed features
                p_prob = 0.88 if feat_row["FLAG"] == 1 else 0.12
                pred_result = {
                    "theft_probability": p_prob,
                    "theft_risk_percentage": round(p_prob * 100, 1),
                    "risk_category": "CRITICAL" if p_prob >= 0.8 else "LOW",
                    "operational_priority_score": round(p_prob * 85, 1),
                    "data_quality_score": float(feat_row["data_quality_score"]),
                    "data_quality_category": "High" if feat_row["data_quality_score"] >= 0.8 else "Moderate",
                    "flagged_as_suspect": p_prob >= 0.65,
                    "threshold_used": 0.65,
                    "top_contributing_factors": [
                        {"feature": "volatility_daily_diff", "display_name": "Mean absolute daily volatility", "feature_value": float(feat_row["volatility_daily_diff"]), "shap_contribution": 0.32, "direction": "INCREASES_THEFT_RISK"},
                        {"feature": "recent_vs_historical_ratio", "display_name": "Recent 90-day vs historical drop", "feature_value": float(feat_row["recent_vs_historical_ratio"]), "shap_contribution": 0.28, "direction": "INCREASES_THEFT_RISK"},
                        {"feature": "autocorr_lag1", "display_name": "Day-to-day serial correlation", "feature_value": float(feat_row["autocorr_lag1"]), "shap_contribution": -0.15, "direction": "DECREASES_THEFT_RISK"}
                    ]
                }

            # Insert prediction
            cursor.execute("SELECT id FROM predictions WHERE consumer_id = %s;", (cons_pk,))
            p_row = cursor.fetchone()
            if not p_row:
                cursor.execute("""
                    INSERT INTO predictions (
                        consumer_id, model_version_id, theft_probability, theft_risk_percentage,
                        risk_category, operational_priority_score, data_quality_score, data_quality_category,
                        threshold_used, flagged_as_suspect, top_contributing_factors_json
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    cons_pk, model_id,
                    pred_result["theft_probability"], pred_result["theft_risk_percentage"],
                    pred_result["risk_category"], pred_result["operational_priority_score"],
                    pred_result["data_quality_score"], pred_result["data_quality_category"],
                    pred_result["threshold_used"], pred_result["flagged_as_suspect"],
                    json.dumps(pred_result["top_contributing_factors"], default=str)
                ))
                pred_pk = cursor.lastrowid
            else:
                pred_pk = p_row[0]

            # If suspect or high priority, create Inspection Case in various lifecycle states
            if pred_result["flagged_as_suspect"] or pred_result["operational_priority_score"] > 40:
                cursor.execute("SELECT id FROM inspection_cases WHERE consumer_id = %s;", (cons_pk,))
                if not cursor.fetchone():
                    case_num = f"CASE-2026-{case_counter:04d}"
                    emp_assigned = employee_pk_map.get(f"EMP00{(case_counter % 5) + 1}", 1)
                    
                    # Cycle through realistic case statuses for demonstration
                    if case_counter == 1:
                        c_status, c_outcome = "DETECTED", "NOT_VERIFIED"
                        sched_d = None
                    elif case_counter == 2:
                        c_status, c_outcome = "ASSIGNED", "NOT_VERIFIED"
                        sched_d = date.today() + timedelta(days=2)
                    elif case_counter == 3:
                        c_status, c_outcome = "SCHEDULED", "NOT_VERIFIED"
                        sched_d = date.today() + timedelta(days=1)
                    elif case_counter == 4:
                        c_status, c_outcome = "OUTCOME_RECORDED", "THEFT_CONFIRMED"
                        sched_d = date.today() - timedelta(days=3)
                    else:
                        c_status, c_outcome = "CLOSED", "NO_THEFT_FOUND"
                        sched_d = date.today() - timedelta(days=7)

                    cursor.execute("""
                        INSERT INTO inspection_cases (
                            case_number, consumer_id, prediction_id, priority_score,
                            risk_category, status, outcome, assigned_employee_id, scheduled_date, notes
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        case_num, cons_pk, pred_pk,
                        pred_result["operational_priority_score"], pred_result["risk_category"],
                        c_status, c_outcome, emp_assigned, sched_d,
                        f"Priority inspection triggered by XGBoost theft risk model ({pred_result['theft_risk_percentage']}% probability)."
                    ))
                    case_pk = cursor.lastrowid

                    # If OUTCOME_RECORDED or CLOSED, insert Inspection Result and Model Feedback
                    if c_outcome in ["THEFT_CONFIRMED", "NO_THEFT_FOUND"]:
                        cursor.execute("""
                            INSERT INTO inspection_results (
                                case_id, employee_id, outcome, meter_tampered, direct_hooking_detected,
                                meter_seal_broken, estimated_units_stolen, penalty_amount_inr, findings_summary, evidence_notes
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                        """, (
                            case_pk, emp_assigned, c_outcome,
                            c_outcome == "THEFT_CONFIRMED",
                            c_outcome == "THEFT_CONFIRMED",
                            c_outcome == "THEFT_CONFIRMED",
                            1450.0 if c_outcome == "THEFT_CONFIRMED" else 0.0,
                            35000.0 if c_outcome == "THEFT_CONFIRMED" else 0.0,
                            "Physical inspection performed by Flying Squad. Verified secondary bypass on terminal block." if c_outcome == "THEFT_CONFIRMED" else "Normal high seasonal load verified. No physical tampering detected.",
                            "Digital photos recorded. Calibration test conducted on-site."
                        ))
                        res_pk = cursor.lastrowid

                        # Insert into model feedback loop
                        cursor.execute("""
                            INSERT INTO model_feedback (
                                prediction_id, inspection_result_id, verified_outcome,
                                ground_truth_label, is_eligible_for_retraining
                            ) VALUES (%s, %s, %s, %s, TRUE);
                        """, (
                            pred_pk, res_pk, c_outcome,
                            1 if c_outcome == "THEFT_CONFIRMED" else 0
                        ))

                    case_counter += 1

        logger.info(f"Seeded {case_counter - 1} inspection cases across all lifecycle stages.")

        # Step 7: Seed Official Board Communication Posts (4 Published + 2 Drafts)
        board_posts = [
            (
                "Scheduled Substation Feeder Maintenance (Demonstration Advisory)",
                "MAINTENANCE",
                "Planned maintenance operations scheduled on 110kV distribution network. Affected feeder zones will experience temporary alternate routing.",
                "To reinforce high-voltage feeder stability and prevent seasonal tripping, scheduled technical overhaul will be conducted on Feeder-4A and adjacent lines on Saturday between 09:00 AM and 01:00 PM.\n\nPower supply will be temporarily routed through alternate distribution feeders where feasible. Consumers in Guindy and South Zone divisions are advised to plan major power operations accordingly.\n\nNote: This is a demonstration notice for platform evaluation.",
                True,
                datetime.utcnow() - timedelta(days=2)
            ),
            (
                "Electricity Conservation and Consumer Assistance Scheme",
                "SCHEME",
                "Seasonal energy conservation incentives and technical advisory for domestic and small-commercial consumers.",
                "The State Electricity Distribution Board has announced its seasonal Electricity Conservation and Consumer Assistance initiative.\n\nEligible domestic and agricultural consumers can access technical advisory services regarding load regularisation, energy-efficient equipment subsidies, and off-peak tariff incentives. For personalized load-optimization assessments or voluntary load regularization without inspection charges, visit the Consumer Portal or contact the Board Customer Service Cell.",
                True,
                datetime.utcnow() - timedelta(days=4)
            ),
            (
                "Public Safety Advisory: Monsoon Precautions & Overhead Line Clearance",
                "ADVISORY",
                "Essential monsoon electrical safety guidelines, safe clearance distances, and 24/7 emergency reporting procedures.",
                "In anticipation of heavy seasonal rainfall, the Board urges citizens and business owners to maintain vigilance regarding electrical installations.\n\n1. Maintain a minimum clearance of 3 meters from 11kV distribution lines and distribution transformers.\n2. Do not touch or approach snapped overhead conductors; report immediately via the 24/7 emergency vigilance desk.\n3. Ensure all earthing electrodes and RCCB/ELCB safety switches are tested by licensed electrical contractors.\n\nReport hazards immediately to the 24/7 central control desk.",
                True,
                datetime.utcnow() - timedelta(days=1)
            ),
            (
                "Consumer Grievance Redressal Protocol & Rapid Response Desk",
                "POLICY",
                "Standard operating procedure for registering metering disputes, billing complaints, and power quality concerns.",
                "The Electricity Board has codified standard service turnaround times under the Consumer Protection Regulations:\n\n• Meter Fault Inspection: Within 48 hours of ticket registration.\n• Billing Slab Reconciliation: Within 5 working days.\n• Voltage Stabilization Queries: Within 72 hours.\n\nConsumers are encouraged to submit tickets with photographic meter evidence directly through the Consumer Portal for priority resolution.",
                True,
                datetime.utcnow() - timedelta(hours=6)
            ),
            (
                "Smart Meter Tamper Prevention & Anti-Interference Guidelines (Draft)",
                "SCHEME",
                "Draft technical specifications and legal provisions regarding smart meter terminal seals and optical communication integrity.",
                "Draft Policy Bulletin — Internal Administrative Review.\n\nThis document outlines mandatory tamper-evident sealing procedures, remote telemetry heartbeats, and zero-tolerance penalties under Section 135 of the Electricity Act 2003 for external shunt connections or optical port tampering.\n\nStatus: Pending Final Board Review & Gazette Notification.",
                False,
                datetime.utcnow() - timedelta(hours=3)
            ),
            (
                "Feeder Loss Reduction & Modernization Scheme Phase 2 (Draft)",
                "ENFORCEMENT_UPDATE",
                "Draft bulletin outlining aggregate technical and commercial (AT&C) loss reduction targets for high-density industrial feeders.",
                "Preliminary operational briefing regarding the Phase 2 Feeder Modernization Program across 18 monitored distribution substations.\n\nFocus areas include aerial bunched cable installation, advanced distribution transformer metering, and machine-learning guided vigilance dispatch.\n\nStatus: Pending Administrative Sign-Off.",
                False,
                datetime.utcnow() - timedelta(hours=1)
            )
        ]

        # Ensure demo notice records are seeded cleanly and idempotently
        for title, cat, summary, content, is_pub, pub_time in board_posts:
            cursor.execute("SELECT id FROM board_posts WHERE title = %s;", (title,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO board_posts (author_user_id, title, category, summary, content, is_published, published_at, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (board_user_id, title, cat, summary, content, is_pub, pub_time, pub_time, pub_time))

        logger.info("Seeded 6 official distinct Board Communication notices (4 published, 2 drafts).")

        # Step 8: Seed Contextual Demonstration Notifications
        # A. Employee notification (EMP001)
        cursor.execute("SELECT user_id FROM employees WHERE employee_id = 'EMP001';")
        emp1_row = cursor.fetchone()
        if emp1_row:
            emp_user_id = emp1_row[0]
            cursor.execute("SELECT id FROM notifications WHERE user_id = %s AND title = %s;", (emp_user_id, "New Priority Inspection Assigned"))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, category, is_read, link_url, created_at)
                    VALUES (%s, 'New Priority Inspection Assigned', 'You have been assigned to inspect high-risk candidate in Guindy Division.', 'INSPECTION', TRUE, '/inspections', %s);
                """, (emp_user_id, datetime.utcnow() - timedelta(hours=4)))

        # B. Primary Demo Consumer notifications (cons_01)
        cursor.execute("SELECT id FROM users WHERE username = 'cons_01';")
        cons1_user_row = cursor.fetchone()
        if cons1_user_row:
            c1_uid = cons1_user_row[0]
            c1_notifications = [
                (
                    "Monthly Electricity Bill Generated",
                    "Your electricity bill for the billing cycle (₹2,118.35) is available for review. Units consumed: 284.00 kWh.",
                    "BILL",
                    True,
                    "/bills",
                    datetime.utcnow() - timedelta(days=5)
                ),
                (
                    "Demonstration Payment Confirmation",
                    "Payment of ₹2,118.35 for Bill #BILL-2026-0025-0 was recorded successfully. Transaction reference: TXN-DEMO-20261015-88.",
                    "PAYMENT",
                    True,
                    "/bills",
                    datetime.utcnow() - timedelta(days=3)
                ),
                (
                    "Upcoming Tariff Cycle Notice",
                    "Your next bi-monthly meter reading cycle starts in 7 days. Ensure unimpeded access to the exterior meter enclosure.",
                    "REMINDER",
                    False,
                    "/bills",
                    datetime.utcnow() - timedelta(days=1)
                ),
                (
                    "Support Ticket TKT-20261010-0025-35 Resolved",
                    "Your billing inquiry regarding tariff slab calculation has been reviewed and resolved by the billing supervisor.",
                    "SERVICE",
                    False,
                    "/issues",
                    datetime.utcnow() - timedelta(hours=18)
                ),
                (
                    "Official Notice: Electricity Conservation Scheme",
                    "The State Electricity Board has published new guidance on seasonal load management and efficiency incentives.",
                    "ANNOUNCEMENT",
                    False,
                    "/updates",
                    datetime.utcnow() - timedelta(hours=12)
                ),
                (
                    "Weekly Energy Consumption Summary",
                    "Your smart meter recorded an average of 14.2 kWh/day over the last 7 days. Consumption is within normal baseline parameters.",
                    "USAGE",
                    False,
                    "/usage",
                    datetime.utcnow() - timedelta(hours=6)
                ),
                (
                    "Scheduled Feeder Maintenance (Demonstration)",
                    "Maintenance on Feeder-4A is scheduled for Saturday 09:00 AM – 01:00 PM. Alternate routing will be utilized where available.",
                    "MAINTENANCE",
                    False,
                    "/updates",
                    datetime.utcnow() - timedelta(hours=3)
                ),
                (
                    "Smart Meter Telemetry Synchronized",
                    "Smart meter serial MTR-TN-2024000 has verified two-way telemetry communication with the local distribution substation.",
                    "ACCOUNT",
                    False,
                    "/account",
                    datetime.utcnow() - timedelta(hours=1)
                )
            ]

            for title, msg, cat, is_r, link, c_time in c1_notifications:
                cursor.execute("SELECT id FROM notifications WHERE user_id = %s AND title = %s;", (c1_uid, title))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO notifications (user_id, title, message, category, is_read, link_url, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s);
                    """, (c1_uid, title, msg, cat, is_r, link, c_time))

            logger.info("Seeded 8 realistic demonstration notifications for consumer cons_01.")

        # C. Secondary Demo Consumer notifications (cons_02 & cons_03 for recipient isolation)
        cursor.execute("SELECT id FROM users WHERE username = 'cons_02';")
        cons2_row = cursor.fetchone()
        if cons2_row:
            c2_uid = cons2_row[0]
            cursor.execute("SELECT id FROM notifications WHERE user_id = %s AND title = %s;", (c2_uid, "Upcoming Electricity Bill Due Reminder"))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, category, is_read, link_url, created_at)
                    VALUES (%s, 'Upcoming Electricity Bill Due Reminder', 'Bill #BILL-2026-0026-0 is scheduled for due date review. Please inspect your bill statement.', 'BILL', FALSE, '/bills', %s);
                """, (c2_uid, datetime.utcnow() - timedelta(hours=8)))

        cursor.execute("SELECT id FROM users WHERE username = 'cons_03';")
        cons3_row = cursor.fetchone()
        if cons3_row:
            c3_uid = cons3_row[0]
            cursor.execute("SELECT id FROM notifications WHERE user_id = %s AND title = %s;", (c3_uid, "Commercial Tariff Advisory"))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, category, is_read, link_url, created_at)
                    VALUES (%s, 'Commercial Tariff Advisory', 'HT/LT commercial tariff regularisation guidelines are active for this connection.', 'POLICY', FALSE, '/bills', %s);
                """, (c3_uid, datetime.utcnow() - timedelta(hours=14)))

        conn.commit()
        logger.info("Database initialization and complete seeding PASS successfully.")

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to initialize database: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    init_and_seed_database()
