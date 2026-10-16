import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { InspectionReportsData, FeedbackSummary } from '../types';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  FileText,
  CheckCircle2,
  IndianRupee,
  Zap,
  Activity,
  ShieldCheck
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<InspectionReportsData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [repData, fbData] = await Promise.all([
          api.getReports(),
          api.getFeedbackSummary()
        ]);
        setReports(repData);
        setFeedback(fbData);
      } catch (err: any) {
        setError(err.message || 'Failed to generate operational reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !reports) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg max-w-6xl mx-auto">
        {error || 'Unable to load operational reports.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-700" />
          <span>Vigilance & Enforcement Operations Report</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable summary of field squad verifications, financial recoveries, and feedback synchronization
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div data-tour="reports-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Audits</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">
            {reports.completed_inspections}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Out of {reports.total_cases} assigned cases
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Hit Rate</span>
            <Activity className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-red-700">
            {feedback?.physical_verification_confirmation_rate_pct.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block" title="Calculated as Confirmed Thefts ÷ Completed Physical Audits">
            {reports.theft_confirmed_count} confirmed of {reports.completed_inspections} audits ({reports.clean_count} clean)
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Assessed Penalties</span>
            <IndianRupee className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">
            ₹{reports.total_penalty_assessed_inr.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Section 135 provisional assessments
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Energy Recovered</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">
            {reports.total_units_recovered_kwh.toLocaleString()} <span className="text-sm font-normal">kWh</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Estimated unmetered consumption
          </span>
        </div>
      </div>

      {/* Closed-Loop Human-in-the-Loop Feedback Status Card */}
      <div data-tour="reports-feedback-loop" className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex items-center space-x-2 text-slate-900 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-bold uppercase tracking-wide">
            Model Feedback Repository Status
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded border border-slate-200">
          <div>
            <span className="text-slate-500 block">Eligible Retraining Records:</span>
            <strong className="text-emerald-700 tabular-nums text-sm font-semibold">
              {feedback?.eligible_for_future_retraining_count || 0}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Uninspected Candidates (Not Ground Truth):</span>
            <strong className="text-slate-700 tabular-nums text-sm font-semibold">
              {feedback?.uninspected_candidates_not_verified || 0}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Repository Synchronization:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mt-0.5">
              {feedback?.feedback_loop_status || 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Operational Audit Activity Log */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Recent Vigilance Audit Trail
          </h3>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {reports.recent_activity.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No recent audit trail entries logged.
            </div>
          ) : (
            reports.recent_activity.map((a: any) => (
              <div key={a.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {a.action}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    {JSON.stringify(a.details)}
                  </div>
                </div>
                <div className="text-[11px] tabular-nums text-slate-400 text-right">
                  {new Date(a.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
