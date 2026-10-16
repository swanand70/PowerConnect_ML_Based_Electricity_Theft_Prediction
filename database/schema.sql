-- ============================================================================
-- ELECTRICITY THEFT INTELLIGENCE & INSPECTION PLATFORM
-- Normalized Relational Database Schema (MySQL 8.0)
-- ============================================================================

USE `electricity_theft_db`;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `hashed_password` VARCHAR(255) NOT NULL,
    `role` ENUM('CONSUMER', 'INSPECTION_EMPLOYEE', 'BOARD_COMMUNICATION_ADMIN') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `onboarding_completed` BOOLEAN NOT NULL DEFAULT FALSE,
    `onboarding_version` VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Utility Inspection Employees (Flying Squad)
CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(30) NOT NULL UNIQUE, -- EMP001 to EMP020
    `user_id` INT NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `designation` VARCHAR(100) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `zone` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `active_cases_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_employees_zone` (`zone`),
    INDEX `idx_employees_emp_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Consumers (Mapped to real SGCC data / synthetic utility metadata)
CREATE TABLE IF NOT EXISTS `consumers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `cons_no` VARCHAR(64) NOT NULL UNIQUE, -- SGCC hash identifier
    `user_id` INT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `zone` VARCHAR(100) NOT NULL,
    `division` VARCHAR(100) NOT NULL,
    `substation` VARCHAR(100) NOT NULL,
    `feeder` VARCHAR(100) NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `tariff_category` VARCHAR(50) NOT NULL DEFAULT 'DOMESTIC',
    `sanctioned_load_kw` DECIMAL(6, 2) NOT NULL DEFAULT 5.0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_consumers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_consumers_cons_no` (`cons_no`),
    INDEX `idx_consumers_zone` (`zone`),
    INDEX `idx_consumers_feeder` (`feeder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Meters
CREATE TABLE IF NOT EXISTS `meters` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `consumer_id` INT NOT NULL UNIQUE,
    `meter_number` VARCHAR(50) NOT NULL UNIQUE,
    `meter_type` VARCHAR(50) NOT NULL DEFAULT 'SMART_DIGITAL',
    `installation_date` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPECTED_TAMPERED', 'FAULTY', 'REPLACED') NOT NULL DEFAULT 'ACTIVE',
    `last_communication_time` TIMESTAMP NULL,
    CONSTRAINT `fk_meters_consumer` FOREIGN KEY (`consumer_id`) REFERENCES `consumers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Model Registry & Versioning
CREATE TABLE IF NOT EXISTS `model_versions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `model_version` VARCHAR(50) NOT NULL UNIQUE, -- e.g. v1.0.0
    `dataset_version` VARCHAR(50) NOT NULL,
    `feature_version` VARCHAR(50) NOT NULL,
    `algorithm` VARCHAR(100) NOT NULL,
    `training_timestamp` TIMESTAMP NOT NULL,
    `threshold` DECIMAL(5, 4) NOT NULL,
    `precision_score` DECIMAL(6, 4) NOT NULL,
    `recall_score` DECIMAL(6, 4) NOT NULL,
    `f1_score` DECIMAL(6, 4) NOT NULL,
    `roc_auc` DECIMAL(6, 4) NOT NULL,
    `pr_auc` DECIMAL(6, 4) NOT NULL,
    `status` ENUM('CANDIDATE', 'ACTIVE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    `model_path` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_model_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Engineered Consumption Features
CREATE TABLE IF NOT EXISTS `consumption_features` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `consumer_id` INT NOT NULL,
    `feature_version` VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    `mean_consumption` FLOAT NOT NULL,
    `median_consumption` FLOAT NOT NULL,
    `std_consumption` FLOAT NOT NULL,
    `var_consumption` FLOAT NOT NULL,
    `min_consumption` FLOAT NOT NULL,
    `max_consumption` FLOAT NOT NULL,
    `consumption_range` FLOAT NOT NULL,
    `coeff_of_variation` FLOAT NOT NULL,
    `skewness` FLOAT NOT NULL,
    `kurtosis` FLOAT NOT NULL,
    `volatility_daily_diff` FLOAT NOT NULL,
    `max_daily_drop` FLOAT NOT NULL,
    `max_daily_surge` FLOAT NOT NULL,
    `zero_consumption_ratio` FLOAT NOT NULL,
    `low_consumption_ratio` FLOAT NOT NULL,
    `abnormal_consumption_ratio` FLOAT NOT NULL,
    `autocorr_lag1` FLOAT NOT NULL,
    `autocorr_lag7` FLOAT NOT NULL,
    `trend_slope` FLOAT NOT NULL,
    `recent_vs_historical_ratio` FLOAT NOT NULL,
    `weekday_weekend_ratio` FLOAT NOT NULL,
    `quarterly_variance_ratio` FLOAT NOT NULL,
    `q25_consumption` FLOAT NOT NULL,
    `q75_consumption` FLOAT NOT NULL,
    `iqr_consumption` FLOAT NOT NULL,
    `top10_percent_share` FLOAT NOT NULL,
    `data_quality_score` FLOAT NOT NULL,
    `missing_reading_ratio` FLOAT NOT NULL,
    `computed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_features_consumer` FOREIGN KEY (`consumer_id`) REFERENCES `consumers` (`id`) ON DELETE CASCADE,
    INDEX `idx_features_consumer` (`consumer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Model Predictions & Inference Traceability
CREATE TABLE IF NOT EXISTS `predictions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `consumer_id` INT NOT NULL,
    `model_version_id` INT NOT NULL,
    `theft_probability` DECIMAL(6, 4) NOT NULL,
    `theft_risk_percentage` DECIMAL(5, 2) NOT NULL,
    `risk_category` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `operational_priority_score` DECIMAL(5, 2) NOT NULL,
    `data_quality_score` DECIMAL(5, 3) NOT NULL,
    `data_quality_category` ENUM('Low', 'Moderate', 'High') NOT NULL,
    `threshold_used` DECIMAL(5, 4) NOT NULL,
    `flagged_as_suspect` BOOLEAN NOT NULL,
    `top_contributing_factors_json` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pred_consumer` FOREIGN KEY (`consumer_id`) REFERENCES `consumers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pred_model` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions` (`id`),
    INDEX `idx_pred_consumer` (`consumer_id`),
    INDEX `idx_pred_priority` (`operational_priority_score`),
    INDEX `idx_pred_risk` (`risk_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Inspection Cases (Lifecycle Management)
CREATE TABLE IF NOT EXISTS `inspection_cases` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `case_number` VARCHAR(50) NOT NULL UNIQUE,
    `consumer_id` INT NOT NULL,
    `prediction_id` INT NOT NULL,
    `priority_score` DECIMAL(5, 2) NOT NULL,
    `risk_category` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `status` ENUM('DETECTED', 'REVIEWED', 'APPROVED', 'ASSIGNED', 'SCHEDULED', 'INSPECTION', 'OUTCOME_RECORDED', 'CLOSED') NOT NULL DEFAULT 'DETECTED',
    `outcome` ENUM('NOT_VERIFIED', 'THEFT_CONFIRMED', 'NO_THEFT_FOUND', 'INCONCLUSIVE') NOT NULL DEFAULT 'NOT_VERIFIED',
    `assigned_employee_id` INT NULL,
    `scheduled_date` DATE NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cases_consumer` FOREIGN KEY (`consumer_id`) REFERENCES `consumers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cases_pred` FOREIGN KEY (`prediction_id`) REFERENCES `predictions` (`id`),
    CONSTRAINT `fk_cases_employee` FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
    INDEX `idx_cases_status` (`status`),
    INDEX `idx_cases_outcome` (`outcome`),
    INDEX `idx_cases_priority` (`priority_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Inspection Assignments
CREATE TABLE IF NOT EXISTS `inspection_assignments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `case_id` INT NOT NULL,
    `employee_id` INT NOT NULL,
    `assigned_by_id` INT NULL,
    `scheduled_date` DATE NOT NULL,
    `instructions` TEXT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'COMPLETED', 'REASSIGNED') NOT NULL DEFAULT 'PENDING',
    `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_assign_case` FOREIGN KEY (`case_id`) REFERENCES `inspection_cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_assign_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_assign_by` FOREIGN KEY (`assigned_by_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Inspection Results & Physical Verification Outcomes
CREATE TABLE IF NOT EXISTS `inspection_results` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `case_id` INT NOT NULL UNIQUE,
    `employee_id` INT NOT NULL,
    `outcome` ENUM('THEFT_CONFIRMED', 'NO_THEFT_FOUND', 'INCONCLUSIVE') NOT NULL,
    `meter_tampered` BOOLEAN NOT NULL DEFAULT FALSE,
    `direct_hooking_detected` BOOLEAN NOT NULL DEFAULT FALSE,
    `meter_seal_broken` BOOLEAN NOT NULL DEFAULT FALSE,
    `estimated_units_stolen` DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    `penalty_amount_inr` DECIMAL(12, 2) NOT NULL DEFAULT 0.0,
    `findings_summary` TEXT NOT NULL,
    `evidence_notes` TEXT NULL,
    `evidence_photos_json` JSON NULL,
    `inspected_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_results_case` FOREIGN KEY (`case_id`) REFERENCES `inspection_cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_results_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Human-in-the-Loop Model Feedback Loop
CREATE TABLE IF NOT EXISTS `model_feedback` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `prediction_id` INT NOT NULL,
    `inspection_result_id` INT NOT NULL,
    `verified_outcome` ENUM('THEFT_CONFIRMED', 'NO_THEFT_FOUND', 'INCONCLUSIVE') NOT NULL,
    `ground_truth_label` TINYINT NULL, -- 1 for THEFT_CONFIRMED, 0 for NO_THEFT_FOUND, NULL for INCONCLUSIVE
    `is_eligible_for_retraining` BOOLEAN NOT NULL DEFAULT TRUE,
    `retraining_batch_id` VARCHAR(50) NULL,
    `verified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_feedback_pred` FOREIGN KEY (`prediction_id`) REFERENCES `predictions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_feedback_result` FOREIGN KEY (`inspection_result_id`) REFERENCES `inspection_results` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Consumer Bills
CREATE TABLE IF NOT EXISTS `bills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `consumer_id` INT NOT NULL,
    `bill_number` VARCHAR(50) NOT NULL UNIQUE,
    `billing_period_start` DATE NOT NULL,
    `billing_period_end` DATE NOT NULL,
    `units_consumed_kwh` DECIMAL(10, 2) NOT NULL,
    `amount_inr` DECIMAL(10, 2) NOT NULL,
    `due_date` DATE NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `paid_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_bills_consumer` FOREIGN KEY (`consumer_id`) REFERENCES `consumers` (`id`) ON DELETE CASCADE,
    INDEX `idx_bills_consumer` (`consumer_id`),
    INDEX `idx_bills_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Consumer Issues & Grievances
CREATE TABLE IF NOT EXISTS `consumer_issues` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `consumer_id` INT NOT NULL,
    `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
    `category` VARCHAR(100) NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'SUBMITTED',
    `response_notes` TEXT NULL,
    `resolved_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_issues_consumer` FOREIGN KEY (`consumer_id`) REFERENCES `consumers` (`id`) ON DELETE CASCADE,
    INDEX `idx_issues_consumer` (`consumer_id`),
    INDEX `idx_issues_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Board Communication Feed
CREATE TABLE IF NOT EXISTS `board_posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `author_user_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `category` ENUM('POLICY', 'SCHEME', 'MAINTENANCE', 'ADVISORY', 'ENERGY_SAVING', 'ENFORCEMENT_UPDATE') NOT NULL,
    `summary` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT TRUE,
    `published_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_posts_category` (`category`),
    INDEX `idx_posts_published` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Contextual Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `link_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_notif_user` (`user_id`),
    INDEX `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Security & Operations Audit Logging
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `actor_user_id` INT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(100) NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(50) NULL,
    `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
