import React, { useState } from 'react';
import type { InspectionCaseDetail } from '../../types';
import type { AnomalyExplanationResult, AnomalyObservation } from '../../utils/anomalyExplanation';
import { ShapWaterfallChart } from '../charts/ShapWaterfallChart';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckCircle2
} from 'lucide-react';

interface WhyFlaggedCardProps {
  caseData: InspectionCaseDetail;
  explanation: AnomalyExplanationResult;
  selectedObservationId?: string | null;
  onSelectObservation?: (obs: AnomalyObservation | null) => void;
}

export const WhyFlaggedCard: React.FC<WhyFlaggedCardProps> = ({
  caseData,
  explanation,
  selectedObservationId,
  onSelectObservation
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-amber-100 text-amber-800">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Suspicion Analysis & Field Briefing
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Plain-language operational explanation derived from smart meter telemetry and statistical analysis
          </p>
        </div>

        {/* Priority Status Pill */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-[11px] font-medium text-slate-500">Inspection Priority:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
            caseData.risk_category === 'HIGH'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {caseData.theft_risk_percentage.toFixed(1)}% Confidence
          </span>
        </div>
      </div>

      {/* Part A: Why this meter needs attention */}
      <div className="bg-gradient-to-r from-amber-50/80 via-slate-50 to-white border-l-4 border-l-amber-600 border border-slate-200 rounded-r-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900 mb-1.5 flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          <span>Why this meter needs attention</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
          {explanation.summaryReason}
        </p>
        <p className="text-[11px] text-slate-500 mt-2 italic flex items-center space-x-1">
          <Info className="w-3 h-3 text-slate-400 shrink-0 inline mr-1" />
          <span>
            Notice: This assessment prioritizes on-site verification. It does not establish electricity theft without physical inspection evidence.
          </span>
        </p>
      </div>

      {/* Part B: Main observations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Key Telemetry Observations (Maximum 3)
          </h3>
          <span className="text-[11px] text-slate-400">
            Click an observation to highlight on graph
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {explanation.observations.map((obs) => {
            const isSelected = selectedObservationId === obs.id;
            return (
              <button
                key={obs.id}
                type="button"
                onClick={() => {
                  if (onSelectObservation) {
                    onSelectObservation(isSelected ? null : obs);
                  }
                }}
                className={`text-left p-3.5 rounded-lg border transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {obs.title}
                    </h4>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isSelected ? 'Active' : 'Highlight'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {obs.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center space-x-1 truncate max-w-[85%] font-medium">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{obs.period}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Part C: What the inspector should check */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 mb-2.5 flex items-center space-x-1.5">
          <ClipboardCheck className="w-4 h-4 text-emerald-700" />
          <span>Practical Field Verification Guidance (On-Site Checklist)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {explanation.fieldChecklist.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-md p-2.5 flex items-start space-x-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  {item.area}
                </span>
                <span className="text-slate-600 leading-snug block mt-0.5">
                  {item.procedure}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progressive Disclosure: Technical Details (Auditability) */}
      <div className="pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
        >
          <span className="flex items-center space-x-1.5">
            <span className="font-semibold">Auditor View: Technical Model & SHAP Factor Breakdown</span>
            <span className="text-[11px] text-slate-400">
              ({caseData.top_contributing_factors.length} mathematical features)
            </span>
          </span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Model Champion:</span>
                <strong className="text-slate-800">{caseData.model_version} (XGBoost)</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Operating Cutoff:</span>
                <strong className="text-slate-800">{(caseData.threshold_used * 100).toFixed(0)}%</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Raw Theft Probability:</span>
                <strong className="text-red-700 font-bold">{caseData.theft_risk_percentage.toFixed(2)}%</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Data Quality Score:</span>
                <strong className="text-emerald-700">{caseData.data_quality_score.toFixed(2)} ({caseData.data_quality_category})</strong>
              </div>
            </div>

            <ShapWaterfallChart
              factors={caseData.top_contributing_factors}
              theftProbability={caseData.theft_probability}
            />
          </div>
        )}
      </div>
    </div>
  );
};
