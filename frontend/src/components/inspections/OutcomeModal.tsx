import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, CheckCircle2, AlertOctagon, HelpCircle, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold uppercase tracking-wide">
              Record Physical Field Audit Outcome
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600">
            <div>Case Number: <strong className="tabular-nums font-semibold text-slate-900">{caseNumber}</strong></div>
            <div>Consumer: <strong className="text-slate-900">{consumerName}</strong></div>
          </div>

          {/* Outcome Radio Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Physical Verification Finding *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOutcome('THEFT_CONFIRMED')}
                className={`p-3 rounded border text-center transition-all ${
                  outcome === 'THEFT_CONFIRMED'
                    ? 'bg-red-50 border-red-400 text-red-900 font-bold ring-1 ring-red-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertOctagon className="w-4 h-4 mx-auto mb-1 text-red-700" />
                <span className="text-xs block">Theft Confirmed</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('NO_THEFT_FOUND')}
                className={`p-3 rounded border text-center transition-all ${
                  outcome === 'NO_THEFT_FOUND'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Check className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                <span className="text-xs block">No Theft Found</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('INCONCLUSIVE')}
                className={`p-3 rounded border text-center transition-all ${
                  outcome === 'INCONCLUSIVE'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4 mx-auto mb-1 text-amber-700" />
                <span className="text-xs block">Inconclusive</span>
              </button>
            </div>
          </div>

          {/* Detailed Evidence Checklist (Only if Theft Confirmed) */}
          {outcome === 'THEFT_CONFIRMED' && (
            <div className="bg-red-50/50 border border-red-100 rounded-md p-3.5 space-y-3">
              <span className="text-xs font-bold text-red-900 block">
                Physical Evidence Verification Checklist
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={meterTampered}
                    onChange={e => setMeterTampered(e.target.checked)}
                    className="rounded text-red-700 focus:ring-red-500"
                  />
                  <span>Meter Tampered</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={directHooking}
                    onChange={e => setDirectHooking(e.target.checked)}
                    className="rounded text-red-700 focus:ring-red-500"
                  />
                  <span>Direct Hooking</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sealBroken}
                    onChange={e => setSealBroken(e.target.checked)}
                    className="rounded text-red-700 focus:ring-red-500"
                  />
                  <span>Seal Broken</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Units Stolen (kWh)
                  </label>
                  <input
                    type="number"
                    value={estimatedUnits}
                    onChange={e => setEstimatedUnits(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs tabular-nums"
                    placeholder="e.g. 1500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Penalty Assessed (INR)
                  </label>
                  <input
                    type="number"
                    value={penaltyAmount}
                    onChange={e => setPenaltyAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs tabular-nums"
                    placeholder="e.g. 35000"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Findings Summary *
            </label>
            <textarea
              value={findingsSummary}
              onChange={e => setFindingsSummary(e.target.value)}
              rows={2}
              placeholder="Enter detailed physical inspection observations and meter hardware conditions..."
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evidence Notes & Seizure Details
            </label>
            <input
              type="text"
              value={evidenceNotes}
              onChange={e => setEvidenceNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
              placeholder="e.g. Seized wire sample tag #892"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 leading-relaxed">
            <strong>Human-in-the-Loop Transparency:</strong> This verified physical audit outcome will be permanently linked to this inspection record and marked as eligible for future model evaluation and feedback. It will not automatically retrain the active model.
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded flex items-center space-x-1.5 transition-colors shadow-xs"
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
