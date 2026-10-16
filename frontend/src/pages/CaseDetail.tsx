import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { InspectionCaseDetail, DailyReading } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { WhyFlaggedCard } from '../components/inspections/WhyFlaggedCard';
import { ConsumptionChart } from '../components/charts/ConsumptionChart';
import { AssignModal } from '../components/inspections/AssignModal';
import { OutcomeModal } from '../components/inspections/OutcomeModal';
import { generateAnomalyExplanation, type AnomalyObservation } from '../utils/anomalyExplanation';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  FileDown,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<InspectionCaseDetail | null>(null);
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Interactive State
  const [assignOpen, setAssignOpen] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<AnomalyObservation | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDetails = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError(null);
      const [detail, consumption] = await Promise.all([
        api.getCaseDetail(Number(caseId)),
        api.getCaseConsumption(Number(caseId), 60)
      ]);
      setCaseData(detail);
      setReadings(consumption.readings);
    } catch (err: any) {
      setError(err.message || 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const explanation = useMemo(() => {
    if (!caseData) return null;
    return generateAnomalyExplanation(caseData, readings);
  }, [caseData, readings]);

  const handleDownloadPdf = async () => {
    if (!caseData || !caseId) return;
    try {
      setPdfLoading(true);
      setPdfFeedback(null);
      const blob = await api.downloadCaseSuspicionReport(Number(caseId));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeCaseNum = caseData.case_number.replace(/\//g, '-').replace(/\s+/g, '_');
      link.download = `PowerConnect_Suspicion_Report_${safeCaseNum}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setPdfFeedback({ type: 'success', message: 'Suspicion report (PDF) downloaded successfully.' });
      setTimeout(() => setPdfFeedback(null), 4000);
    } catch (err: any) {
      setPdfFeedback({ type: 'error', message: err.message || 'Failed to generate suspicion report.' });
      setTimeout(() => setPdfFeedback(null), 6000);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-6 bg-slate-200 rounded w-1/5 animate-pulse"></div>
        <CardSkeleton rows={4} />
        <CardSkeleton rows={5} />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg max-w-5xl mx-auto">
        <p className="font-semibold">{error || 'Case not found.'}</p>
        <Link to="/employee/inspections" className="mt-3 inline-block text-xs font-semibold text-red-800 underline">
          ← Back to Inspection Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Contextual Navigation Breadcrumb */}
      <div className="flex items-center justify-between bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg px-4 py-2.5 shadow-2xs">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-[#9A9FA8]">
          <Link
            to="/employee/inspections"
            className="inline-flex items-center space-x-1.5 text-slate-600 dark:text-[#9A9FA8] hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-semibold group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400" />
            <span>Inspection Queue</span>
          </Link>
          <span className="text-slate-300 dark:text-[#3E434D]">/</span>
          <span className="tabular-nums text-slate-900 dark:text-[#F3F4F5] font-bold bg-slate-100 dark:bg-[#1F2329] px-2 py-0.5 rounded text-[11px] border border-slate-200 dark:border-[#292C32]">
            {caseData.case_number}
          </span>
          <span className="text-slate-300 dark:text-[#3E434D]">•</span>
          <span className="text-slate-500 dark:text-[#9A9FA8] text-xs truncate max-w-xs">
            {caseData.consumer_name}
          </span>
        </nav>
        <span className="text-[11px] text-slate-400 dark:text-[#717784] tabular-nums font-medium hidden sm:inline">
          {caseData.zone} Zone • {caseData.feeder}
        </span>
      </div>

      {/* Main Case Header Card */}
      <div className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-100 dark:border-[#292C32] pb-5">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <PriorityBadge category={caseData.risk_category} score={caseData.operational_priority_score} />
              <StatusBadge status={caseData.status} />
              <StatusBadge status={caseData.outcome} type="outcome" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#F3F4F5]">
              {caseData.consumer_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-[#9A9FA8] tabular-nums mt-1 font-medium">
              <span>Case: <strong className="text-slate-800 dark:text-[#F3F4F5]">{caseData.case_number}</strong></span>
              <span>•</span>
              <span>SGCC Meter Identifier: <strong className="text-slate-800 dark:text-[#F3F4F5]">{caseData.cons_no}</strong></span>
              <span>•</span>
              <span>Zone: <strong className="text-slate-800 dark:text-[#F3F4F5] font-semibold">{caseData.zone}</strong></span>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#1F2329] text-slate-600 dark:text-[#9A9FA8] border border-slate-200 dark:border-[#292C32]">
                Data Provenance: Real SGCC Consumption Data & Features • Demo Utility Account Metadata
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div data-tour="case-outcome-btn" className="flex flex-wrap items-center gap-2 self-start">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="bg-white dark:bg-[#181B1F] hover:bg-slate-50 dark:hover:bg-[#1F2329] text-slate-700 dark:text-[#CBD0D8] border border-slate-300 dark:border-[#292C32] text-xs font-semibold px-3 py-2 rounded-md transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Download official electricity board inspection briefing dossier"
            >
              {pdfLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 dark:text-slate-400" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Download Suspicion Report (PDF)</span>
                </>
              )}
            </button>

            {caseData.status !== 'OUTCOME_RECORDED' && (
              <>
                <button
                  onClick={() => setAssignOpen(true)}
                  className="bg-slate-100 dark:bg-[#1F2329] hover:bg-slate-200 dark:hover:bg-[#292C32] text-slate-700 dark:text-[#F3F4F5] text-xs font-semibold px-3.5 py-2 rounded-md transition-colors cursor-pointer border border-transparent dark:border-[#292C32]"
                >
                  Assign Squad
                </button>
                <button
                  onClick={() => setOutcomeOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors shadow-2xs cursor-pointer"
                >
                  Record Field Outcome
                </button>
              </>
            )}
          </div>
        </div>

        {/* PDF Download Feedback Notice */}
        {pdfFeedback && (
          <div className={`mt-3 p-2.5 rounded-md text-xs font-medium flex items-center justify-between ${
            pdfFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            <span className="flex items-center space-x-1.5">
              {pdfFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>{pdfFeedback.message}</span>
            </span>
            <button
              onClick={() => setPdfFeedback(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Operational Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          <div className="border-r border-slate-100 dark:border-[#292C32] pr-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9A9FA8] block">
              Theft Probability
            </span>
            <span className="text-xl font-bold tabular-nums text-red-700 dark:text-red-400">
              {caseData.theft_risk_percentage.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#717784] block mt-0.5 tabular-nums">
              Cutoff: {(caseData.threshold_used * 100).toFixed(0)}%
            </span>
          </div>

          <div className="border-r border-slate-100 dark:border-[#292C32] pr-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9A9FA8] block">
              Operational Priority
            </span>
            <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-[#F3F4F5]">
              {caseData.operational_priority_score.toFixed(1)} / 100
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#717784] block mt-0.5">
              Ranked on Risk + Volatility
            </span>
          </div>

          <div className="border-r border-slate-100 dark:border-[#292C32] pr-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9A9FA8] block">
              Data Quality
            </span>
            <span className={`text-base font-bold tabular-nums ${
              caseData.data_quality_category === 'High' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {caseData.data_quality_category} ({caseData.data_quality_score.toFixed(2)})
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#717784] block mt-0.5">
              Input Meter Integrity
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9A9FA8] block">
              Assigned Squad Lead
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F5] block truncate">
              {caseData.assigned_employee_name || 'Unassigned'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#717784] block mt-0.5 tabular-nums">
              {caseData.scheduled_date ? `Scheduled: ${caseData.scheduled_date}` : 'Not scheduled'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Location & Connection Context Card */}
      <div className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-[#F3F4F5] uppercase tracking-wide mb-3 flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-[#9A9FA8]" />
          <span>Grid Supply & Meter Infrastructure</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 dark:text-[#9A9FA8] block">Distribution Substation:</span>
            <strong className="text-slate-800 dark:text-[#F3F4F5]">{caseData.substation}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#9A9FA8] block">11kV Feeder:</span>
            <strong className="text-slate-800 dark:text-[#F3F4F5]">{caseData.feeder}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#9A9FA8] block">Meter Hardware:</span>
            <strong className="text-slate-800 dark:text-[#F3F4F5] tabular-nums">{caseData.meter_number || 'SMART-MTR-STD'}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#9A9FA8] block">Tariff Category:</span>
            <strong className="text-slate-800 dark:text-[#F3F4F5]">{caseData.tariff_category}</strong>
          </div>
        </div>
      </div>

      {/* Human-Readable Suspicion Analysis & Field Guidance */}
      {explanation && (
        <div data-tour="case-shap">
          <WhyFlaggedCard
            caseData={caseData}
            explanation={explanation}
            selectedObservationId={selectedObservation?.id}
            onSelectObservation={setSelectedObservation}
          />
        </div>
      )}

      {/* Real Consumption Trend Component with Suspicion Highlights */}
      {explanation && (
        <div data-tour="case-consumption" className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg p-5 shadow-xs">
          <ConsumptionChart
            readings={explanation.annotatedReadings}
            meanConsumption={explanation.baselineMean}
            graphNarrative={explanation.graphNarrative}
            selectedObservation={selectedObservation}
          />
        </div>
      )}

      {/* Physical Field Outcome Evidence Card (If Recorded) */}
      {caseData.outcome !== 'NOT_VERIFIED' && (
        <div className="bg-white dark:bg-[#141619] border-2 border-emerald-300 dark:border-emerald-600/60 rounded-lg p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-400 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wide">
              Verified Physical Audit Findings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-[#181B1F] p-4 rounded border border-slate-200 dark:border-[#292C32] mb-3">
            <div>
              <span className="text-slate-500 dark:text-[#9A9FA8] block">Physical Meter Tampering:</span>
              <strong className={caseData.meter_tampered ? 'text-red-700 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-[#CBD0D8]'}>
                {caseData.meter_tampered ? 'CONFIRMED' : 'NONE DETECTED'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#9A9FA8] block">Assessed Penalty:</span>
              <strong className="text-slate-900 dark:text-[#F3F4F5] tabular-nums">
                {caseData.penalty_amount_inr ? `₹ ${caseData.penalty_amount_inr.toLocaleString()}` : 'None'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#9A9FA8] block">Audit Recorded Date:</span>
              <strong className="text-slate-900 dark:text-[#F3F4F5] tabular-nums">
                {caseData.inspected_at ? new Date(caseData.inspected_at).toLocaleDateString() : 'Recorded'}
              </strong>
            </div>
          </div>

          {caseData.findings_summary && (
            <div className="text-xs text-slate-700 dark:text-[#CBD0D8]">
              <span className="font-semibold text-slate-900 dark:text-[#F3F4F5] block mb-0.5">Findings Summary:</span>
              <p className="bg-slate-50 dark:bg-[#181B1F] p-3 rounded border border-slate-200 dark:border-[#292C32] text-[11px] leading-relaxed text-slate-800 dark:text-[#CBD0D8]">
                {caseData.findings_summary}
              </p>
            </div>
          )}

          <div className="mt-3 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-2.5 rounded">
            ✓ This verified field record has been synchronized into the feedback repository and is eligible for future model evaluation and calibration.
          </div>
        </div>
      )}

      {/* Assign Squad Modal */}
      <AssignModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        caseId={caseData.id}
        caseNumber={caseData.case_number}
        consumerName={caseData.consumer_name}
        currentOfficerId={caseData.assigned_employee_id}
        onSuccess={fetchDetails}
      />

      {/* Record Outcome Modal */}
      <OutcomeModal
        isOpen={outcomeOpen}
        onClose={() => setOutcomeOpen(false)}
        caseId={caseData.id}
        caseNumber={caseData.case_number}
        consumerName={caseData.consumer_name}
        onSuccess={fetchDetails}
      />
    </div>
  );
};
