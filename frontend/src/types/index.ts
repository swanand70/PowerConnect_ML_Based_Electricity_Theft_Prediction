/**
 * Electricity Theft Intelligence & Inspection Platform
 * Core TypeScript Type Definitions
 */

export type Role = 'CONSUMER' | 'INSPECTION_EMPLOYEE' | 'BOARD_COMMUNICATION_ADMIN';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: Role;
  onboarding_completed: boolean;
  onboarding_version: string;
  employee_id?: string;
  full_name?: string;
  zone?: string;
  consumer_no?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
  username: string;
  user_id: number;
  onboarding_completed: boolean;
  onboarding_version: string;
}

export interface OnboardingStatus {
  onboarding_completed: boolean;
  onboarding_version: string;
  role: Role;
}

export interface InspectionCaseSummary {
  id: number;
  case_number: string;
  consumer_id: number;
  consumer_name: string;
  cons_no: string;
  address: string;
  zone: string;
  substation: string;
  feeder: string;
  latitude: number;
  longitude: number;
  theft_risk_percentage: number;
  risk_category: 'HIGH' | 'MEDIUM' | 'LOW';
  operational_priority_score: number;
  status: 'DETECTED' | 'REVIEWED' | 'APPROVED' | 'ASSIGNED' | 'SCHEDULED' | 'INSPECTION' | 'OUTCOME_RECORDED' | 'CLOSED';
  outcome: 'NOT_VERIFIED' | 'THEFT_CONFIRMED' | 'NO_THEFT_FOUND' | 'INCONCLUSIVE';
  assigned_employee_name?: string | null;
  scheduled_date?: string | null;
  created_at: string;
}

export interface ShapFactor {
  feature: string;
  display_name: string;
  feature_value: number;
  shap_contribution: number;
  absolute_impact?: number;
  direction: 'INCREASES_THEFT_RISK' | 'DECREASES_THEFT_RISK';
  risk_driver: boolean;
}

export interface InspectionCaseDetail {
  id: number;
  case_number: string;
  consumer_id: number;
  consumer_name: string;
  cons_no: string;
  address: string;
  zone: string;
  division: string;
  substation: string;
  feeder: string;
  latitude: number;
  longitude: number;
  tariff_category: string;
  meter_number?: string | null;
  meter_status?: string | null;
  
  // ML & Risk
  theft_probability: number;
  theft_risk_percentage: number;
  risk_category: 'HIGH' | 'MEDIUM' | 'LOW';
  operational_priority_score: number;
  data_quality_score: number;
  data_quality_category: 'High' | 'Moderate' | 'Low';
  threshold_used: number;
  model_version: string;
  top_contributing_factors: ShapFactor[];
  
  // Lifecycle
  status: string;
  outcome: string;
  assigned_employee_id?: number | null;
  assigned_employee_name?: string | null;
  scheduled_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;

  // Results
  findings_summary?: string | null;
  meter_tampered?: boolean | null;
  penalty_amount_inr?: number | null;
  inspected_at?: string | null;
}

export interface DailyReading {
  date: string;
  kwh: number;
}

export interface CaseConsumptionData {
  case_id: number;
  case_number: string;
  consumer_name: string;
  cons_no: string;
  readings_count: number;
  readings: DailyReading[];
}

export interface MapPoint {
  case_id: number;
  case_number: string;
  consumer_name: string;
  cons_no: string;
  latitude: number;
  longitude: number;
  zone: string;
  division: string;
  substation: string;
  feeder: string;
  operational_priority_score: number;
  theft_risk_percentage: number;
  risk_category: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  outcome: string;
}

export interface DashboardMetrics {
  total_cases_monitored: number;
  pending_inspections: number;
  confirmed_thefts_count: number;
  verified_clean_count: number;
  todays_top_priority_case?: {
    case_id: number;
    case_number: string;
    consumer_name: string;
    zone: string;
    feeder?: string;
    theft_risk_percentage?: number;
    priority_score: number;
    risk_category: string;
    status: string;
  } | null;
  zone_distribution: Record<string, number>;
}

export interface InspectionOfficer {
  id: number;
  employee_id: string;
  full_name: string;
  designation: string;
  department: string;
  zone: string;
  phone?: string;
}

export interface InspectionReportsData {
  total_cases: number;
  completed_inspections: number;
  pending_inspections: number;
  theft_confirmed_count: number;
  clean_count: number;
  inconclusive_count: number;
  total_penalty_assessed_inr: number;
  total_units_recovered_kwh: number;
  recent_activity: Array<{
    id: number;
    action: string;
    timestamp: string;
    details: Record<string, any>;
  }>;
}

export interface FeedbackSummary {
  verified_feedback_records_count: number;
  theft_confirmed_count: number;
  no_theft_found_count: number;
  inconclusive_count: number;
  uninspected_candidates_not_verified: number;
  eligible_for_future_retraining_count: number;
  physical_verification_confirmation_rate_pct: number;
  feedback_loop_status: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface BoardPostItem {
  id: number;
  author_name: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  published_at: string;
  is_published?: boolean;
}

export interface BoardPostAdminItem {
  id: number;
  author_name: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface BoardPostCreatePayload {
  title: string;
  category: string;
  summary: string;
  content: string;
  is_published?: boolean;
}

export interface BoardPostUpdatePayload {
  title?: string;
  category?: string;
  summary?: string;
  content?: string;
  is_published?: boolean;
}

export interface ConsumerProfile {
  id: number;
  consumer_no: string;
  name: string;
  address: string;
  zone: string;
  division: string;
  substation: string;
  feeder: string;
  tariff_category: string;
  sanctioned_load_kw: number;
  meter_number: string;
  meter_type: string;
  meter_status: string;
}

export interface ConsumerDailyReading {
  date: string;
  kwh: number;
}

export interface ConsumerUsage {
  cons_no: string;
  name: string;
  tariff_category: string;
  sanctioned_load_kw: number;
  current_month_kwh: number;
  historical_daily_sample: ConsumerDailyReading[];
  mean_consumption_kwh: number;
  volatility_score: number;
}

export interface BillItem {
  id: number;
  bill_number: string;
  billing_period_start: string;
  billing_period_end: string;
  units_consumed_kwh: number;
  amount_inr: number;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paid_at?: string | null;
}

export interface ConsumerIssueItem {
  id: number;
  ticket_number: string;
  consumer_name: string;
  category: string;
  subject: string;
  description: string;
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  response_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface IssueCreatePayload {
  category: string;
  subject: string;
  description: string;
}

export interface IssueResolvePayload {
  status: string;
  response_notes: string;
}

export interface AggregateEnforcementStats {
  total_inspections_completed: number;
  theft_confirmed_count: number;
  clean_inspections_count: number;
  inconclusive_count: number;
  total_penalty_assessed_inr: number;
  total_estimated_units_recovered_kwh: number;
  monitored_feeders_count: number;
}

// ============================================================================
// PHASE 6: CLOSED-LOOP MODEL GOVERNANCE & LIFECYCLE TYPES
// ============================================================================

export interface PrecisionRecallAtKItem {
  inspections_capacity_k?: number;
  confirmed_theft_cases?: number;
  confirmed_thefts?: number;
  precision_at_k: number;
  recall_at_k: number;
}

export interface ModelMonitoringTier1Historical {
  model_version: string;
  algorithm: string;
  operating_threshold: number;
  benchmark_dataset: string;
  evaluation_type: string;
  evaluation_notes: string;
  metrics: {
    pr_auc: number;
    roc_auc: number;
    f1_score: number;
    precision: number;
    recall: number;
    false_positive_rate: number;
    false_negative_rate: number;
  };
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  precision_recall_at_k: Record<string, PrecisionRecallAtKItem>;
}

export interface ModelMonitoringTier2Operational {
  total_inspection_cases_monitored: number;
  completed_inspections_count: number;
  conclusive_verified_audits_count: number;
  theft_confirmed_count: number;
  no_theft_found_count: number;
  inconclusive_count: number;
  unverified_pending_cases: number;
  inspection_confirmation_rate_pct: number;
  formula_definition: string;
  gross_audit_hit_rate_pct: number;
}

export interface ModelMonitoringTier3LabelBacked {
  status: 'INSUFFICIENT_SAMPLE_SIZE' | 'EVALUATED_ON_VERIFIED_FEEDBACK';
  verified_sample_size: number;
  minimum_required_samples: number;
  message?: string;
  sampling_limitation_notice: string;
  metrics?: {
    precision: number;
    recall: number;
    f1_score: number;
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
  } | null;
}

export interface ThreeTierMonitoringResponse {
  historical_baseline_tier1: ModelMonitoringTier1Historical;
  operational_outcomes_tier2: ModelMonitoringTier2Operational;
  label_backed_performance_tier3: ModelMonitoringTier3LabelBacked;
  system_health: string;
  active_model_version: string;
}

export interface FeatureDriftItem {
  feature_name: string;
  baseline_mean: number;
  baseline_std: number;
  monitored_mean: number;
  monitored_std: number;
  psi_score: number;
  status: 'STABLE' | 'MODERATE_DRIFT' | 'SIGNIFICANT_DRIFT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface FeatureDriftResponse {
  monitoring_status: string;
  reference_dataset: string;
  monitored_profiles_count: number;
  average_psi_score: number;
  overall_drift_alert_level: 'NOMINAL' | 'ATTENTION' | 'WARNING';
  recommendation: string;
  data_quality_health: {
    mean_data_quality_score: number;
    high_quality_profiles_pct: number;
    low_quality_profiles_pct: number;
    missing_reading_tolerance_ok: boolean;
  };
  feature_drift_breakdown: FeatureDriftItem[];
  methodology_notes: string;
}

export interface ModelRegistryItem {
  id: number;
  model_version: string;
  dataset_version: string;
  feature_version: string;
  algorithm: string;
  training_timestamp: string;
  threshold: number;
  status: 'ACTIVE' | 'CANDIDATE' | 'RETIRED' | 'REJECTED';
  model_path: string;
  created_at: string;
  metrics: {
    pr_auc: number;
    roc_auc: number;
    f1_score: number;
    precision: number;
    recall: number;
  };
}

export interface FeedbackReviewRecord {
  id: number;
  prediction_id: number;
  case_id?: number | null;
  case_number: string;
  consumer_name: string;
  cons_no: string;
  zone: string;
  feeder: string;
  verified_outcome: 'THEFT_CONFIRMED' | 'NO_THEFT_FOUND' | 'INCONCLUSIVE';
  ground_truth_label: number | null;
  is_eligible_for_retraining: boolean;
  tampered: boolean;
  direct_hooking: boolean;
  findings_summary: string;
  evidence_notes: string;
  penalty_amount_inr: number;
  verified_by: string;
  verified_at: string;
}

export interface CandidateTrainingResponse {
  status: string;
  success: boolean;
  message: string;
  eligible_feedback_count?: number;
  minimum_required_count?: number;
  candidate_version?: string;
  comparison?: {
    active_champion: {
      version: string;
      status: string;
      pr_auc: number;
      roc_auc: number;
      f1_score: number;
      precision: number;
      recall: number;
      threshold: number;
    };
    evaluated_candidate: {
      version: string;
      status: string;
      pr_auc: number;
      roc_auc: number;
      f1_score: number;
      precision: number;
      recall: number;
      threshold: number;
      variance_vs_champion_f1: string;
    };
  };
  leakage_safeguards_verified?: {
    train_val_test_isolation: boolean;
    imputer_scaler_fit_on_train_only: boolean;
    smote_applied_only_to_train: boolean;
    held_out_test_uncontaminated: boolean;
  };
  active_champion_preserved: string;
}

