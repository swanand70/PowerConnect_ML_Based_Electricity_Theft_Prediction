import React from 'react';
import { api } from '../services/api';
import {
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Cpu,
  BookOpen
} from 'lucide-react';

export const Help: React.FC = () => {
  const handleReplayTour = async () => {
    try {
      await api.resetOnboarding();
    } catch {
      // silent
    }
    window.dispatchEvent(new CustomEvent('open-employee-tour'));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-[#292C32] pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#F3F4F5] tracking-tight flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Operational Reference & User Tour</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#9A9FA8] mt-0.5">
            Field protocols, explainability guidelines, and system walkthrough controls
          </p>
        </div>

        <button
          onClick={handleReplayTour}
          data-tour="help-guide"
          className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay Guided Tour</span>
        </button>
      </div>

      {/* Workflow Reference Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-[#F3F4F5] uppercase tracking-wide flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Field Investigation Protocol</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#9A9FA8] leading-relaxed">
            The platform functions as an operational decision-support tool. A high theft risk score signals statistically suspicious consumption behavior (e.g. sharp variance drops, unnatural autocorrelation), but physical on-site audit by the squad is required to confirm tampering.
          </p>
          <div className="text-[11px] bg-slate-50 dark:bg-[#181B1F] p-3 rounded border border-slate-200 dark:border-[#292C32] text-slate-700 dark:text-[#D1D4DC] space-y-1">
            <div>1. Check physical meter seal & terminal cover.</div>
            <div>2. Inspect service drop cables for hidden underground/overhead shunts.</div>
            <div>3. Compare optical port meter logs with feeder totalizers.</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-[#F3F4F5] uppercase tracking-wide flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Closed-Loop Model Feedback</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#9A9FA8] leading-relaxed">
            Every verified physical audit outcome recorded through the portal feeds the human-in-the-loop retraining dataset. Only physically inspected accounts become ground-truth training records; uninspected candidates are never assumed to be negative.
          </p>
          <div className="text-[11px] bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300">
            <strong>Active Model Version:</strong> XGBoost v1.0.0 (Trained on SGCC Smart Meter Clean Time-Series; Optimal Decision Threshold: 0.65).
          </div>
        </div>
      </div>

      {/* Field Outcome Standards */}
      <div className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-[#F3F4F5] uppercase tracking-wide mb-3 flex items-center space-x-1.5">
          <BookOpen className="w-4 h-4 text-slate-600 dark:text-[#9A9FA8]" />
          <span>Operational Verification Outcome Definitions</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-red-50/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md space-y-1">
            <strong className="text-red-900 dark:text-red-300 block">THEFT CONFIRMED</strong>
            <p className="text-slate-600 dark:text-[#9A9FA8] text-[11px]">
              Direct physical evidence of bypass, CT shunt, broken seal, or internal microcontroller tampering was discovered and recorded.
            </p>
          </div>
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-md space-y-1">
            <strong className="text-emerald-900 dark:text-emerald-300 block">NO THEFT FOUND</strong>
            <p className="text-slate-600 dark:text-[#9A9FA8] text-[11px]">
              Complete inspection verified meter wiring and integrity. Low consumption was substantiated (e.g. vacant premises, solar net-metering).
            </p>
          </div>
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md space-y-1">
            <strong className="text-amber-900 dark:text-amber-300 block">INCONCLUSIVE</strong>
            <p className="text-slate-600 dark:text-[#9A9FA8] text-[11px]">
              Premises locked, aggressive interference, or meter requires secondary lab testing before determination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
