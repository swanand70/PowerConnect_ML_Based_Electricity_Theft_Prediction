import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, CheckCircle2, AlertOctagon, HelpCircle, Check, ShieldAlert } from 'lucide-react';

interface OutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  caseNumber: string;
  consumerName: string;
  onSuccess: () => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  isOpen,
  onClose,
  caseId,
  caseNumber,
  consumerName,
  onSuccess
}) => {
  const [outcome, setOutcome] = useState<'THEFT_CONFIRMED' | 'NO_THEFT_FOUND' | 'INCONCLUSIVE'>('THEFT_CONFIRMED');
  const [meterTampered, setMeterTampered] = useState<boolean>(false);
  const [directHooking, setDirectHooking] = useState<boolean>(false);
  const [sealBroken, setSealBroken] = useState<boolean>(false);
  const [estimatedUnits, setEstimatedUnits] = useState<string>('');
  const [penaltyAmount, setPenaltyAmount] = useState<string>('');
  const [findingsSummary, setFindingsSummary] = useState<string>('');
  const [evidenceNotes, setEvidenceNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.recordOutcome(caseId, {
        outcome,
        meter_tampered: outcome === 'THEFT_CONFIRMED' ? meterTampered : false,
        direct_hooking_detected: outcome === 'THEFT_CONFIRMED' ? directHooking : false,
        meter_seal_broken: outcome === 'THEFT_CONFIRMED' ? sealBroken : false,
        estimated_units_stolen: outcome === 'THEFT_CONFIRMED' ? Number(estimatedUnits || 0) : 0,
        penalty_amount_inr: outcome === 'THEFT_CONFIRMED' ? Number(penaltyAmount || 0) : 0,
        findings_summary: findingsSummary,
        evidence_notes: evidenceNotes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record outcome.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#001D3D] border border-slate-300 dark:border-[#003566] rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-[#000814] border-b border-slate-200 dark:border-[#003566] px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-[#E0FBFC]">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Record Physical Field Audit Outcome
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-[#9DB4C0] dark:hover:text-[#E0FBFC] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-slate-800 dark:text-[#E0FBFC]">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-md">
              {error}
            </div>
          )}

          {/* Target Account Badge */}
          <div className="bg-slate-50 dark:bg-[#000814] p-3 rounded-md border border-slate-200 dark:border-[#003566] text-xs text-slate-600 dark:text-[#9DB4C0]">
            <div>Case Number: <strong className="tabular-nums font-semibold text-slate-900 dark:text-[#E0FBFC]">{caseNumber}</strong></div>
            <div>Consumer: <strong className="text-slate-900 dark:text-[#E0FBFC]">{consumerName}</strong></div>
          </div>

          {/* Outcome Radio Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#E0FBFC] mb-2 uppercase tracking-wide">
              Physical Verification Finding *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOutcome('THEFT_CONFIRMED')}
                className={`p-3 rounded-md border text-center transition-all cursor-pointer ${
                  outcome === 'THEFT_CONFIRMED'
                    ? 'bg-red-50 dark:bg-red-950/80 border-red-400 dark:border-red-500 text-red-900 dark:text-red-200 font-bold ring-1 ring-red-400'
                    : 'bg-white dark:bg-[#253237] border-slate-200 dark:border-[#5C6B73]/60 text-slate-700 dark:text-[#E0FBFC] hover:bg-slate-50 dark:hover:bg-[#253237]/80'
                }`}
              >
                <AlertOctagon className="w-4 h-4 mx-auto mb-1 text-red-600 dark:text-red-400" />
                <span className="text-xs block font-semibold">Theft Confirmed</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('NO_THEFT_FOUND')}
                className={`p-3 rounded-md border text-center transition-all cursor-pointer ${
                  outcome === 'NO_THEFT_FOUND'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-400'
                    : 'bg-white dark:bg-[#253237] border-slate-200 dark:border-[#5C6B73]/60 text-slate-700 dark:text-[#E0FBFC] hover:bg-slate-50 dark:hover:bg-[#253237]/80'
                }`}
              >
                <Check className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs block font-semibold">No Theft Found</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('INCONCLUSIVE')}
                className={`p-3 rounded-md border text-center transition-all cursor-pointer ${
                  outcome === 'INCONCLUSIVE'
                    ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-400 dark:border-[#FFC300] text-amber-900 dark:text-[#FFD60A] font-bold ring-1 ring-amber-400'
                    : 'bg-white dark:bg-[#253237] border-slate-200 dark:border-[#5C6B73]/60 text-slate-700 dark:text-[#E0FBFC] hover:bg-slate-50 dark:hover:bg-[#253237]/80'
                }`}
              >
                <HelpCircle className="w-4 h-4 mx-auto mb-1 text-amber-600 dark:text-[#FFC300]" />
                <span className="text-xs block font-semibold">Inconclusive</span>
              </button>
            </div>
          </div>

          {/* Detailed Evidence Checklist (Only if Theft Confirmed) */}
          {outcome === 'THEFT_CONFIRMED' && (
            <div className="bg-red-50/50 dark:bg-[#253237]/80 border border-red-200 dark:border-[#5C6B73]/60 rounded-md p-3.5 space-y-3">
              <span className="text-xs font-bold text-red-900 dark:text-red-400 block uppercase tracking-wide">
                Physical Evidence Verification Checklist
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-800 dark:text-[#E0FBFC]">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meterTampered}
                    onChange={e => setMeterTampered(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 dark:bg-[#001D3D] dark:border-[#5C6B73]"
                  />
                  <span className="font-medium">Meter Tampered</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directHooking}
                    onChange={e => setDirectHooking(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 dark:bg-[#001D3D] dark:border-[#5C6B73]"
                  />
                  <span className="font-medium">Direct Hooking</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sealBroken}
                    onChange={e => setSealBroken(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 dark:bg-[#001D3D] dark:border-[#5C6B73]"
                  />
                  <span className="font-medium">Seal Broken</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#E0FBFC] mb-1">
                    Units Stolen (kWh)
                  </label>
                  <input
                    type="number"
                    value={estimatedUnits}
                    onChange={e => setEstimatedUnits(e.target.value)}
                    className="w-full bg-white dark:bg-[#000814] border border-slate-300 dark:border-[#5C6B73] rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#E0FBFC] tabular-nums"
                    placeholder="e.g. 1500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#E0FBFC] mb-1">
                    Penalty Assessed (INR)
                  </label>
                  <input
                    type="number"
                    value={penaltyAmount}
                    onChange={e => setPenaltyAmount(e.target.value)}
                    className="w-full bg-white dark:bg-[#000814] border border-slate-300 dark:border-[#5C6B73] rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#E0FBFC] tabular-nums"
                    placeholder="e.g. 35000"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#E0FBFC] mb-1">
              Field Findings Summary *
            </label>
            <textarea
              value={findingsSummary}
              onChange={e => setFindingsSummary(e.target.value)}
              rows={2}
              placeholder="Enter detailed physical inspection observations and meter hardware conditions..."
              className="w-full bg-white dark:bg-[#253237] border border-slate-300 dark:border-[#5C6B73] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-[#E0FBFC] focus:ring-1 focus:ring-[#003566] dark:focus:ring-[#C2DFE3] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#E0FBFC] mb-1">
              Evidence Notes & Seizure Details
            </label>
            <input
              type="text"
              value={evidenceNotes}
              onChange={e => setEvidenceNotes(e.target.value)}
              className="w-full bg-white dark:bg-[#253237] border border-slate-300 dark:border-[#5C6B73] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-[#E0FBFC] focus:ring-1 focus:ring-[#003566] dark:focus:ring-[#C2DFE3] focus:outline-hidden"
              placeholder="e.g. Seized wire sample tag #892"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#000814] border border-slate-200 dark:border-[#003566] rounded-md text-[11px] text-slate-600 dark:text-[#9DB4C0] leading-relaxed">
            <strong className="text-slate-800 dark:text-[#E0FBFC]">Human-in-the-Loop Transparency:</strong> This verified physical audit outcome will be permanently linked to this inspection record and marked as eligible for future model evaluation and feedback. It will not automatically retrain the active model.
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-[#003566]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-[#9DB4C0] hover:bg-slate-100 dark:hover:bg-[#253237] hover:text-slate-900 dark:hover:text-[#E0FBFC] rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#003566] hover:bg-[#001D3D] text-white text-xs font-semibold px-4 py-2 rounded-md flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 border border-[#C2DFE3]/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Recording...' : 'Submit Verified Outcome'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
