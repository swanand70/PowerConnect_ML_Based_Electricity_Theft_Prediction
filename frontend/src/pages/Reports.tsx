import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { InspectionReportsData } from '../types';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  FileText,
  CheckCircle2,
  IndianRupee,
  Zap,
  Activity,
  AlertTriangle,
  HelpCircle,
  Clock,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<InspectionReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const repData = await api.getReports();
        setReports(repData);
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
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
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
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg max-w-6xl mx-auto">
        {error || 'Unable to load operational reports.'}
      </div>
    );
  }

  const conclusiveAudits = reports.theft_confirmed_count + reports.clean_count;
  const auditHitRate = conclusiveAudits > 0
    ? ((reports.theft_confirmed_count / conclusiveAudits) * 100).toFixed(1)
    : '0.0';

  const completionRate = reports.total_cases > 0
    ? ((reports.completed_inspections / reports.total_cases) * 100).toFixed(1)
    : '0.0';

  const avgPenaltyPerTheft = reports.theft_confirmed_count > 0
    ? Math.round(reports.total_penalty_assessed_inr / reports.theft_confirmed_count)
    : 0;

  const avgKwhPerTheft = reports.theft_confirmed_count > 0
    ? Math.round(reports.total_units_recovered_kwh / reports.theft_confirmed_count)
    : 0;

  // Outcome proportions for progress bar
  const totalTracked = reports.total_cases || 1;
  const theftPct = ((reports.theft_confirmed_count / totalTracked) * 100).toFixed(1);
  const cleanPct = ((reports.clean_count / totalTracked) * 100).toFixed(1);
  const inconclusivePct = ((reports.inconclusive_count / totalTracked) * 100).toFixed(1);
  const pendingPct = ((reports.pending_inspections / totalTracked) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-[#003566] pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#E0FBFC] tracking-tight flex items-center space-x-2">
          <FileText className="w-5 h-5 text-[#003566] dark:text-[#E0FBFC]" />
          <span>Vigilance & Enforcement Operations Report</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#9DB4C0] mt-0.5">
          Auditable summary of field squad verifications, enforcement actions, and revenue recoveries
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div data-tour="reports-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#9DB4C0] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Audits</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-[#E0FBFC]">
            {reports.completed_inspections}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#9DB4C0] mt-1 block">
            Out of {reports.total_cases} assigned cases ({completionRate}%)
          </span>
        </div>

        <div className="bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#9DB4C0] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Hit Rate</span>
            <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-red-700 dark:text-red-400">
            {auditHitRate}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#9DB4C0] mt-1 block" title="Calculated as Confirmed Thefts ÷ Conclusive Physical Audits">
            {reports.theft_confirmed_count} confirmed of {reports.completed_inspections} audits ({reports.clean_count} clean)
          </span>
        </div>

        <div className="bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#9DB4C0] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Assessed Penalties</span>
            <IndianRupee className="w-4 h-4 text-slate-600 dark:text-[#9DB4C0]" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-[#E0FBFC]">
            ₹{reports.total_penalty_assessed_inr.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#9DB4C0] mt-1 block">
            Section 135 provisional assessments
          </span>
        </div>

        <div className="bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#9DB4C0] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Energy Recovered</span>
            <Zap className="w-4 h-4 text-blue-600 dark:text-[#C2DFE3]" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-[#E0FBFC]">
            {reports.total_units_recovered_kwh.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-[#9DB4C0]">kWh</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#9DB4C0] mt-1 block">
            Unmetered consumption recovered
          </span>
        </div>
      </div>

      {/* Outcome Breakdown Section */}
      <div className="bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-[#003566]/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#E0FBFC] uppercase tracking-wide flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#003566] dark:text-[#E0FBFC]" />
              <span>Inspection Outcome Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#9DB4C0] mt-0.5">
              Breakdown of physical field squad verifications across assigned consumer cases
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-[#E0FBFC]/50 dark:bg-[#003566]/50 text-[#003566] dark:text-[#E0FBFC] font-semibold border border-[#003566]/20 dark:border-[#003566]">
              Coverage: {completionRate}% ({reports.completed_inspections}/{reports.total_cases})
            </span>
          </div>
        </div>

        {/* Visual Proportional Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${theftPct}%` }}
              className="bg-red-500 transition-all duration-300"
              title={`Theft Confirmed: ${reports.theft_confirmed_count} (${theftPct}%)`}
            />
            <div
              style={{ width: `${cleanPct}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Verified Clean: ${reports.clean_count} (${cleanPct}%)`}
            />
            <div
              style={{ width: `${inconclusivePct}%` }}
              className="bg-amber-400 transition-all duration-300"
              title={`Inconclusive: ${reports.inconclusive_count} (${inconclusivePct}%)`}
            />
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-blue-400/60 dark:bg-blue-500/40 transition-all duration-300"
              title={`Pending Inspection: ${reports.pending_inspections} (${pendingPct}%)`}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-[#9DB4C0] pt-1">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Theft Confirmed ({reports.theft_confirmed_count})</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Verified Clean ({reports.clean_count})</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>Inconclusive ({reports.inconclusive_count})</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400/60 dark:bg-blue-500/40 inline-block" />
              <span>Pending Squad Dispatch ({reports.pending_inspections})</span>
            </span>
          </div>
        </div>

        {/* 4 Outcome Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Confirmed Thefts */}
          <div className="p-3.5 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">Theft Confirmed</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300 tabular-nums">
              {reports.theft_confirmed_count}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              Direct physical evidence of bypass, meter tampering, or unmetered load.
            </p>
          </div>

          {/* Verified Clean */}
          <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Verified Clean</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {reports.clean_count}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              Lawful consumer operation confirmed; meter integrity verified with no theft found.
            </p>
          </div>

          {/* Inconclusive */}
          <div className="p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Inconclusive</span>
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {reports.inconclusive_count}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              Premises inaccessible or meter obstructed; earmarked for secondary follow-up.
            </p>
          </div>

          {/* Pending */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Pending Dispatch</span>
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {reports.pending_inspections}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              Flagged consumer cases assigned to vigilance queue awaiting squad visit.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Efficiency & Financial Recovery Dual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Financial & Revenue Impact */}
        <div className="bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-[#E0FBFC] border-b border-slate-100 dark:border-[#003566]/60 pb-3">
            <IndianRupee className="w-4 h-4 text-[#003566] dark:text-[#E0FBFC]" />
            <h3 className="text-xs font-bold uppercase tracking-wide">
              Financial Recovery & Enforcement Impact
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#003566]/40">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Total Provisional Assessments</span>
              <span className="font-bold text-slate-900 dark:text-[#E0FBFC] tabular-nums text-sm">
                ₹{reports.total_penalty_assessed_inr.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#003566]/40">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Estimated Stolen Energy Recovered</span>
              <span className="font-bold text-slate-900 dark:text-[#E0FBFC] tabular-nums text-sm">
                {reports.total_units_recovered_kwh.toLocaleString()} kWh
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#003566]/40">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Average Penalty per Confirmed Theft</span>
              <span className="font-semibold text-slate-800 dark:text-[#C2DFE3] tabular-nums">
                ₹{avgPenaltyPerTheft.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Average Stolen Energy per Confirmed Theft</span>
              <span className="font-semibold text-slate-800 dark:text-[#C2DFE3] tabular-nums">
                {avgKwhPerTheft.toLocaleString()} kWh
              </span>
            </div>
          </div>
        </div>

        {/* Operational Squad Performance */}
        <div className="bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-[#E0FBFC] border-b border-slate-100 dark:border-[#003566]/60 pb-3">
            <TrendingUp className="w-4 h-4 text-[#003566] dark:text-[#E0FBFC]" />
            <h3 className="text-xs font-bold uppercase tracking-wide">
              Vigilance Squad Operations Summary
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#003566]/40">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Total Vigilance Pipeline Cases</span>
              <span className="font-bold text-slate-900 dark:text-[#E0FBFC] tabular-nums text-sm">
                {reports.total_cases}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#003566]/40">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Completed On-Site Physical Audits</span>
              <span className="font-bold text-slate-900 dark:text-[#E0FBFC] tabular-nums text-sm">
                {reports.completed_inspections}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#003566]/40">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Inspection Coverage Rate</span>
              <span className="font-semibold text-slate-800 dark:text-[#C2DFE3] tabular-nums">
                {completionRate}%
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-[#9DB4C0]">Field Strike Rate (Confirmed / Audited)</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {auditHitRate}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
