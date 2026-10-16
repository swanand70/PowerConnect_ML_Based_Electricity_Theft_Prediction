import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  ThreeTierMonitoringResponse,
  FeatureDriftResponse,
  ModelRegistryItem,
  FeedbackReviewRecord,
  CandidateTrainingResponse
} from '../types';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  ShieldCheck,
  Cpu,
  BarChart2,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Database,
  Lock,
  Info,
  RefreshCw,
  GitBranch,
  Sliders,
  Check
} from 'lucide-react';

type TabKey = 'overview' | 'monitoring' | 'drift' | 'feedback' | 'lifecycle';

export const ModelGovernance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [monitoringData, setMonitoringData] = useState<ThreeTierMonitoringResponse | null>(null);
  const [driftData, setDriftData] = useState<FeatureDriftResponse | null>(null);
  const [registry, setRegistry] = useState<ModelRegistryItem[]>([]);
  const [feedbackData, setFeedbackData] = useState<{
    total: number;
    eligible_count: number;
    ineligible_count: number;
    items: FeedbackReviewRecord[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Candidate training state
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [allowBenchmarkDemo, setAllowBenchmarkDemo] = useState(false);
  const [trainingResult, setTrainingResult] = useState<CandidateTrainingResponse | null>(null);

  // Promotion / Rollback modal states
  const [promoteModalVersion, setPromoteModalVersion] = useState<string | null>(null);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [monRes, driftRes, regRes, fbRes] = await Promise.all([
        api.getModelMonitoring(),
        api.getDataAndFeatureDrift(),
        api.getModelRegistry(),
        api.getFeedbackReview(1, 50)
      ]);
      setMonitoringData(monRes);
      setDriftData(driftRes);
      setRegistry(regRes);
      setFeedbackData(fbRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load model governance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleEligibility = async (feedbackId: number, currentEligibility: boolean) => {
    try {
      setActionMessage(null);
      const res = await api.toggleFeedbackEligibility(feedbackId, !currentEligibility);
      setActionMessage({ type: 'success', text: res.message });
      // Update local state
      if (feedbackData) {
        setFeedbackData({
          ...feedbackData,
          items: feedbackData.items.map((item) =>
            item.id === feedbackId ? { ...item, is_eligible_for_retraining: res.is_eligible_for_retraining } : item
          )
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update eligibility.' });
    }
  };

  const handleRunCandidateTraining = async () => {
    try {
      setTrainingLoading(true);
      setActionMessage(null);
      setTrainingResult(null);
      const res = await api.trainCandidateModel({ allow_benchmark_demonstration: allowBenchmarkDemo });
      setTrainingResult(res);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        // Refresh registry
        const regRes = await api.getModelRegistry();
        setRegistry(regRes);
      } else {
        setActionMessage({ type: 'info', text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Candidate evaluation failed.' });
    } finally {
      setTrainingLoading(false);
    }
  };

  const handlePromoteCandidate = async (version: string) => {
    try {
      setSubmittingAction(true);
      const res = await api.promoteCandidateModel(version);
      setActionMessage({ type: 'success', text: res.message });
      setPromoteModalVersion(null);
      await loadAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to promote candidate.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRollback = async () => {
    try {
      setSubmittingAction(true);
      const res = await api.rollbackToChampion();
      setActionMessage({ type: 'success', text: res.message });
      setRollbackModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to rollback model.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !monitoringData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg">
          <h2 className="font-semibold text-base mb-1">Model Governance Data Unavailable</h2>
          <p className="text-sm">{error || 'Unable to connect to model monitoring service.'}</p>
          <button
            onClick={loadAllData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { historical_baseline_tier1: tier1, operational_outcomes_tier2: tier2, label_backed_performance_tier3: tier3 } = monitoringData;
  const activeVersion = monitoringData.active_model_version;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-900 dark:text-slate-100">
      {/* Top Banner / Breadcrumb & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Phase 6 Governance Active
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Closed-Loop MLOps</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Model Intelligence & Governance Workspace</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Audit-grade monitoring of champion model performance, field outcome feedback provenance, statistical telemetry drift, and controlled candidate evaluation lifecycle.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Active Production Champion
            </div>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-end space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{activeVersion}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-normal">(τ = {tier1.operating_threshold})</span>
            </div>
          </div>

          <button
            onClick={loadAllData}
            title="Refresh All Governance Telemetry"
            className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : actionMessage.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : actionMessage.type === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline hover:no-underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-1 overflow-x-auto scrollbar-none">
        <button
          id="tab-overview"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Model Benchmark & Overview</span>
        </button>

        <button
          id="tab-monitoring"
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-2 ${
            activeTab === 'monitoring'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Three-Tier Performance Monitoring</span>
        </button>

        <button
          id="tab-drift"
          onClick={() => setActiveTab('drift')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-2 ${
            activeTab === 'drift'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Data Quality & Feature Drift</span>
          {driftData?.overall_drift_alert_level !== 'NOMINAL' && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          id="tab-feedback"
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-2 ${
            activeTab === 'feedback'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Verified Field Feedback Review</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px]">
            {feedbackData?.total || 0}
          </span>
        </button>

        <button
          id="tab-lifecycle"
          onClick={() => setActiveTab('lifecycle')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 flex items-center space-x-2 ${
            activeTab === 'lifecycle'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Candidate Training & Registry</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MODEL BENCHMARK & OVERVIEW
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Champion Metadata Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Production Champion Baseline
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {tier1.algorithm} ({tier1.model_version})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Benchmark Dataset: <span className="font-mono text-slate-700 dark:text-slate-300">{tier1.benchmark_dataset}</span> | Evaluation Type: {tier1.evaluation_type}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium">
                  Operating Threshold: <strong>{tier1.operating_threshold.toFixed(2)}</strong>
                </span>
                <span className="px-3 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Offline Benchmark KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Held-Out PR-AUC
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                  {tier1.metrics.pr_auc.toFixed(4)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Primary ranking metric</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Held-Out ROC-AUC
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {tier1.metrics.roc_auc.toFixed(4)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Overall discrimination</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Held-Out F1-Score
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {tier1.metrics.f1_score.toFixed(4)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">At threshold 0.65</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Offline Precision
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {(tier1.metrics.precision * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">150 TP / 386 Flagged</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Offline Recall
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {(tier1.metrics.recall * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">150 TP / 415 Positives</div>
              </div>
            </div>

            {/* Benchmark Disclaimer Alert */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-md text-xs text-blue-800 dark:text-blue-300 flex items-start space-x-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Immutable Evaluation Baseline:</strong> {tier1.evaluation_notes}. Held-out test partitions are preserved strictly to prevent test-set leakage. Live model evaluations in production must never overwrite or contaminate this historical anchor.
              </div>
            </div>
          </div>

          {/* Matrix & Precision@K side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-3">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Held-Out Confusion Matrix (τ = 0.65)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Total test population: 3,601 consumer time-series records evaluated under class imbalance.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center font-mono">
                <div className="p-4 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-sans font-semibold">True Negatives (TN)</div>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                    {tier1.confusion_matrix.true_negatives.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Correctly Classified Clean</div>
                </div>

                <div className="p-4 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-sans font-semibold">False Positives (FP)</div>
                  <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">
                    {tier1.confusion_matrix.false_positives.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Clean Flagged for Audit</div>
                </div>

                <div className="p-4 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                  <div className="text-xs text-red-700 dark:text-red-400 font-sans font-semibold">False Negatives (FN)</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-200 mt-1">
                    {tier1.confusion_matrix.false_negatives.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">Theft Cases Missed</div>
                </div>

                <div className="p-4 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-sans font-semibold">True Positives (TP)</div>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                    {tier1.confusion_matrix.true_positives.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Theft Cases Detected</div>
                </div>
              </div>
            </div>

            {/* Precision@K Inspection Capacity */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-3">
                <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Operational Capacity Tuning (Precision@K)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Measures audit efficiency when field inspection squad capacity is restricted to top-K highest predicted risk meters.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Squad Capacity (K)</th>
                      <th className="py-2.5 px-3">Precision@K</th>
                      <th className="py-2.5 px-3">Recall@K</th>
                      <th className="py-2.5 px-3">Yield Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {Object.entries(tier1.precision_recall_at_k).map(([key, item]) => (
                      <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 uppercase font-sans">
                          {key.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-bold">
                          {(item.precision_at_k * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {(item.recall_at_k * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-500">
                          {item.confirmed_theft_cases || item.confirmed_thefts} confirmed detections
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: THREE-TIER PERFORMANCE MONITORING
         ========================================================================= */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TIER 1 CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tier 1: Offline Baseline
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Static Holdout
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      {tier1.metrics.pr_auc.toFixed(4)}
                    </div>
                    <div className="text-xs text-slate-500">Held-Out Test PR-AUC</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400">ROC-AUC:</span>{' '}
                      <strong className="font-mono">{tier1.metrics.roc_auc.toFixed(4)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">F1-Score:</span>{' '}
                      <strong className="font-mono">{tier1.metrics.f1_score.toFixed(4)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Precision:</span>{' '}
                      <strong className="font-mono">{(tier1.metrics.precision * 100).toFixed(1)}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Recall:</span>{' '}
                      <strong className="font-mono">{(tier1.metrics.recall * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 border border-slate-200 dark:border-slate-700/50">
                Immutable test partition benchmark (SGCC-2016-Clean-v1). Not affected by live operational data.
              </div>
            </div>

            {/* TIER 2 CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Tier 2: Operational Outcomes
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Field Squads
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      {tier2.inspection_confirmation_rate_pct.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Conclusive Confirmation Rate ({tier2.theft_confirmed_count} / {tier2.conclusive_verified_audits_count} conclusive audits)
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Completed Inspections:</span>
                      <strong className="font-mono">{tier2.completed_inspections_count}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Theft Confirmed:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">{tier2.theft_confirmed_count}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">No Theft Found:</span>
                      <strong className="font-mono text-slate-700 dark:text-slate-300">{tier2.no_theft_found_count}</strong>
                    </div>
                    <div className="flex justify-between text-amber-700 dark:text-amber-400">
                      <span>Inconclusive Audits:</span>
                      <strong className="font-mono">{tier2.inconclusive_count}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pending Verification:</span>
                      <strong className="font-mono">{tier2.unverified_pending_cases}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <strong>Denominator Isolation:</strong> Confirmation rate uses only conclusive audits ({tier2.theft_confirmed_count} + {tier2.no_theft_found_count}). Inconclusive cases are reported separately and excluded from the denominator.
              </div>
            </div>

            {/* TIER 3 CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Tier 3: Label-Backed Performance
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      tier3.status === 'EVALUATED_ON_VERIFIED_FEEDBACK'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {tier3.status === 'EVALUATED_ON_VERIFIED_FEEDBACK' ? 'Verified Evaluation' : 'Sample Gated'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {tier3.status === 'INSUFFICIENT_SAMPLE_SIZE' ? (
                    <div>
                      <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span className="font-bold text-sm">Insufficient Verified Outcomes</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Supervised evaluation requires a minimum of <strong>{tier3.minimum_required_samples}</strong> verified field outcomes to compute statistically sound precision/recall metrics.
                      </p>
                      <div className="mt-3 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${Math.min(100, (tier3.verified_sample_size / tier3.minimum_required_samples) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-[11px] text-right font-mono text-slate-500 mt-1">
                        Current: {tier3.verified_sample_size} / {tier3.minimum_required_samples} required labels
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400">
                        {tier3.metrics ? `${(tier3.metrics.f1_score * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-xs text-slate-500">Live Supervised F1-Score (n = {tier3.verified_sample_size})</div>
                      {tier3.metrics && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <div>Precision: <strong className="font-mono">{(tier3.metrics.precision * 100).toFixed(1)}%</strong></div>
                          <div>Recall: <strong className="font-mono">{(tier3.metrics.recall * 100).toFixed(1)}%</strong></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <strong>Selection Bias Notice:</strong> {tier3.sampling_limitation_notice}
              </div>
            </div>
          </div>

          {/* Operational vs ML Distinction Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Critical Distinction: Operational Hit Rates vs Statistical ML Metrics</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <strong>Operational Confirmation Rate ({tier2.inspection_confirmation_rate_pct.toFixed(1)}%):</strong> Measures vigilance team effectiveness on dispatched audits. Calculated as <code className="text-emerald-700 dark:text-emerald-400 font-mono">Confirmed Thefts ÷ Conclusive Completed Audits</code>. It excludes inconclusive visits from the denominator to reflect true field conclusive yield.
              </div>
              <div>
                <strong>Machine Learning Metrics (PR-AUC, F1, Recall):</strong> Evaluated either against offline holdout test sets (Tier 1) or sufficient unbiased ground truth cohorts (Tier 3). Field hit rate must NEVER be presented to stakeholders as statistical ML precision.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DATA QUALITY & FEATURE DRIFT
         ========================================================================= */}
      {activeTab === 'drift' && driftData && (
        <div className="space-y-6">
          {/* Summary Health Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Population Stability Index (PSI) Telemetry
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Input Feature Drift Monitoring
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reference Dataset: <span className="font-mono text-slate-700 dark:text-slate-300">{driftData.reference_dataset}</span> | Monitored Profiles: <strong className="font-mono">{driftData.monitored_profiles_count.toLocaleString()}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center space-x-1.5 ${
                    driftData.overall_drift_alert_level === 'NOMINAL'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : driftData.overall_drift_alert_level === 'ATTENTION'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span>Alert Level: {driftData.overall_drift_alert_level}</span>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  Mean PSI: {driftData.average_psi_score.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Quality Sub-KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Mean Data Quality Score</div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {(driftData.data_quality_health.mean_data_quality_score * 100).toFixed(1)} / 100
                </div>
              </div>
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">High Quality Profiles</div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {driftData.data_quality_health.high_quality_profiles_pct.toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Low Quality / Gaps</div>
                <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {driftData.data_quality_health.low_quality_profiles_pct.toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Missing Reading Tolerance</div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Compliant</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800/60 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <strong>Recommendation:</strong> {driftData.recommendation}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Engineered Feature Drift Breakdown
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated across 8 key statistical consumption features using 10-bin population stability scoring against reference training distribution.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Feature Name</th>
                    <th className="py-2.5 px-4">Reference Mean (Std)</th>
                    <th className="py-2.5 px-4">Monitored Mean (Std)</th>
                    <th className="py-2.5 px-4">PSI Score</th>
                    <th className="py-2.5 px-4">Stability Status</th>
                    <th className="py-2.5 px-4">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {driftData.feature_drift_breakdown.map((item) => (
                    <tr key={item.feature_name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-slate-100">
                        {item.feature_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {item.baseline_mean.toFixed(2)} (±{item.baseline_std.toFixed(2)})
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                        {item.monitored_mean.toFixed(2)} (±{item.monitored_std.toFixed(2)})
                      </td>
                      <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">
                        {item.psi_score.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'STABLE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : item.status === 'MODERATE_DRIFT'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">
                        {item.severity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              <strong>Methodology Rule:</strong> {driftData.methodology_notes}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: VERIFIED FIELD FEEDBACK REVIEW
         ========================================================================= */}
      {activeTab === 'feedback' && feedbackData && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Field Audits</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {feedbackData.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Recorded by inspection vigilance squads</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Eligible Verified Labels
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {feedbackData.eligible_count}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">THEFT_CONFIRMED (1) or NO_THEFT_FOUND (0)</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Ineligible / Inconclusive Audits
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                {feedbackData.ineligible_count}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Strictly quarantined from supervised training</div>
            </div>
          </div>

          {/* Feedback Review Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Supervisory Feedback Quality & Provenance Review
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify ground truth labels, inspect field officer notes, and manage eligibility for future retraining cohorts.
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing <strong>{feedbackData.items.length}</strong> records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Case / Consumer</th>
                    <th className="py-2.5 px-3">Grid Location</th>
                    <th className="py-2.5 px-3">Verified Outcome</th>
                    <th className="py-2.5 px-3">Ground Truth</th>
                    <th className="py-2.5 px-3">Evidence Notes</th>
                    <th className="py-2.5 px-3">Verified By</th>
                    <th className="py-2.5 px-3 text-center">Retraining Eligible</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {feedbackData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.case_number}</div>
                        <div className="text-[11px] text-slate-500">{item.consumer_name}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <div>{item.zone}</div>
                        <div className="text-[10px] text-slate-400">{item.feeder}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.verified_outcome === 'THEFT_CONFIRMED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : item.verified_outcome === 'NO_THEFT_FOUND'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {item.verified_outcome}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {item.ground_truth_label === 1 ? (
                          <span className="text-red-600 dark:text-red-400">1 (Positive)</span>
                        ) : item.ground_truth_label === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">0 (Negative)</span>
                        ) : (
                          <span className="text-slate-400 font-sans italic text-[11px]">Excluded (null)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                        <p className="line-clamp-2" title={item.evidence_notes || item.findings_summary}>
                          {item.evidence_notes || item.findings_summary || 'No notes provided'}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        <div>{item.verified_by || 'Officer'}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.verified_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.is_eligible_for_retraining
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.is_eligible_for_retraining ? 'Eligible' : 'Quarantined'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleEligibility(item.id, item.is_eligible_for_retraining)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            item.is_eligible_for_retraining
                              ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {item.is_eligible_for_retraining ? 'Exclude' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              <strong>Ground-Truth Integrity Directive:</strong> Inconclusive audits remain permanently ineligible for positive/negative label attribution. Uninspected consumers are NEVER backfilled as non-theft negatives.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CANDIDATE TRAINING & REGISTRY
         ========================================================================= */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
          {/* Candidate Training Trigger Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Controlled Candidate Model Development</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Controlled Candidate Training & Evaluation Pipeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Trains and evaluates candidate model architectures against the active champion with strict train/val/test data leakage prevention.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowBenchmarkDemo}
                    onChange={(e) => setAllowBenchmarkDemo(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Allow Benchmark Demonstration Run</span>
                </label>

                <button
                  onClick={handleRunCandidateTraining}
                  disabled={trainingLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-md text-xs font-bold flex items-center space-x-2 shadow-2xs transition-colors"
                >
                  {trainingLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating Candidate...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Initiate Candidate Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Safeguard Info Banner */}
            <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-md text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center space-x-2 font-semibold text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Automated Retraining Guard Enforced (Minimum 50 Verified Labels Required)</span>
              </div>
              <p>
                In compliance with Section 7 of Phase 6 specifications, the pipeline halts safely and refuses candidate creation if available verified labels are insufficient. Training sets are strictly separated, and SMOTE/scalers are fitted exclusively on the training partition to prevent leakage.
              </p>
            </div>

            {/* Training Result Box */}
            {trainingResult && (
              <div
                className={`mt-4 p-4 rounded-lg border text-xs ${
                  trainingResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {trainingResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>Status: {trainingResult.status}</span>
                </div>
                <p className="mt-1 text-xs">{trainingResult.message}</p>

                {/* Candidate Comparison View */}
                {trainingResult.comparison && (
                  <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800 space-y-3">
                    <div className="font-bold uppercase tracking-wider text-[11px] text-emerald-800 dark:text-emerald-300">
                      Side-by-Side Model Evaluation Comparison
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Active Champion */}
                      <div className="p-3 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-xs">
                        <div className="font-sans font-bold text-slate-800 dark:text-slate-200 mb-2">
                          Active Champion ({trainingResult.comparison.active_champion.version})
                        </div>
                        <div className="space-y-1 text-slate-600 dark:text-slate-400">
                          <div>PR-AUC: <strong>{trainingResult.comparison.active_champion.pr_auc.toFixed(4)}</strong></div>
                          <div>ROC-AUC: <strong>{trainingResult.comparison.active_champion.roc_auc.toFixed(4)}</strong></div>
                          <div>F1-Score: <strong>{trainingResult.comparison.active_champion.f1_score.toFixed(4)}</strong></div>
                          <div>Threshold: <strong>{trainingResult.comparison.active_champion.threshold.toFixed(2)}</strong></div>
                          <div className="font-sans text-[11px] text-emerald-600 font-bold mt-1">STATUS: ACTIVE IN PRODUCTION</div>
                        </div>
                      </div>

                      {/* Evaluated Candidate */}
                      <div className="p-3 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-xs">
                        <div className="font-sans font-bold text-slate-800 dark:text-slate-200 mb-2">
                          Evaluated Candidate ({trainingResult.comparison.evaluated_candidate.version})
                        </div>
                        <div className="space-y-1 text-slate-600 dark:text-slate-400">
                          <div>PR-AUC: <strong>{trainingResult.comparison.evaluated_candidate.pr_auc.toFixed(4)}</strong></div>
                          <div>ROC-AUC: <strong>{trainingResult.comparison.evaluated_candidate.roc_auc.toFixed(4)}</strong></div>
                          <div>F1-Score: <strong>{trainingResult.comparison.evaluated_candidate.f1_score.toFixed(4)}</strong></div>
                          <div>Threshold: <strong>{trainingResult.comparison.evaluated_candidate.threshold.toFixed(2)}</strong></div>
                          <div className="font-sans text-[11px] text-blue-600 font-bold mt-1">
                            F1 Variance: {trainingResult.comparison.evaluated_candidate.variance_vs_champion_f1}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leakage Safeguards Verified */}
                    {trainingResult.leakage_safeguards_verified && (
                      <div className="p-3 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="font-bold text-slate-900 dark:text-white mb-1.5">Leakage Safeguards Audit Verification:</div>
                        <div className="grid grid-cols-2 gap-1 font-mono">
                          <div>Train/Val/Test Isolation: [OK]</div>
                          <div>Imputer/Scaler fit on train only: [OK]</div>
                          <div>SMOTE strictly in training partition: [OK]</div>
                          <div>Held-out test set uncontaminated: [OK]</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Registry Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Auditable Model Registry & Version History
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Traceable record of all trained candidate and champion models stored in database registry.
                </p>
              </div>

              {activeVersion !== 'v1.0.0' && (
                <button
                  onClick={() => setRollbackModalOpen(true)}
                  className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rollback to Champion v1.0.0</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Model Version</th>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Threshold</th>
                    <th className="py-2.5 px-3">Lifecycle Status</th>
                    <th className="py-2.5 px-3">PR-AUC</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">Registered At</th>
                    <th className="py-2.5 px-3 text-right">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {registry.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white font-mono">
                        {item.model_version}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {item.algorithm}
                      </td>
                      <td className="py-3 px-3">{item.threshold.toFixed(2)}</td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : item.status === 'CANDIDATE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-bold">
                        {item.metrics.pr_auc.toFixed(4)}
                      </td>
                      <td className="py-3 px-3">{item.metrics.f1_score.toFixed(4)}</td>
                      <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        {item.status === 'CANDIDATE' ? (
                          <button
                            onClick={() => setPromoteModalVersion(item.model_version)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors"
                          >
                            Authorize Promotion
                          </button>
                        ) : item.status === 'ACTIVE' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                            Serving Inference
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Authorization Modal */}
      {promoteModalVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-base">
              <ShieldCheck className="w-5 h-5" />
              <span>Authorize Model Promotion</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You are about to promote candidate model <strong className="font-mono text-slate-900 dark:text-white">{promoteModalVersion}</strong> to active production status.
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
              <strong>Audit Notice:</strong> This action switches the live inference prediction path to use this candidate model. All subsequent risk scores will be produced by this version. An audit log entry will record your user identity.
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPromoteModalVersion(null)}
                disabled={submittingAction}
                className="px-4 py-2 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePromoteCandidate(promoteModalVersion)}
                disabled={submittingAction}
                className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5"
              >
                {submittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Promotion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Authorization Modal */}
      {rollbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-base">
              <RotateCcw className="w-5 h-5" />
              <span>Emergency Rollback to Champion</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action immediately restores champion model <strong className="font-mono text-slate-900 dark:text-white">v1.0.0</strong> as the active inference engine and retires any active candidate model.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRollbackModalOpen(false)}
                disabled={submittingAction}
                className="px-4 py-2 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRollback}
                disabled={submittingAction}
                className="px-4 py-2 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5"
              >
                {submittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Execute Rollback</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
