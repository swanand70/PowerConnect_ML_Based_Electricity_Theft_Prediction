import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { InspectionOfficer } from '../../types';
import { X, UserCheck, ShieldCheck } from 'lucide-react';

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  caseNumber: string;
  consumerName: string;
  currentOfficerId?: number | null;
  onSuccess: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  onClose,
  caseId,
  caseNumber,
  consumerName,
  currentOfficerId,
  onSuccess
}) => {
  const [officers, setOfficers] = useState<InspectionOfficer[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | ''>(currentOfficerId || '');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [instructions, setInstructions] = useState<string>('Surprise vigilance check of smart meter and incoming supply cables.');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getOfficers()
        .then(data => {
          setOfficers(data);
          if (!selectedOfficerId && data.length > 0) {
            setSelectedOfficerId(data[0].id);
          }
        })
        .catch(err => setError(err.message));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficerId || !scheduledDate) {
      setError('Please select both an officer and a scheduled date.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.assignCase(caseId, {
        employee_id: Number(selectedOfficerId),
        scheduled_date: scheduledDate,
        instructions
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign officer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#001D3D] border border-slate-300 dark:border-[#003566] rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-50 dark:bg-[#000814] border-b border-slate-200 dark:border-[#003566] px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-[#E0FBFC]">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Assign Inspection Squad</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-[#9DB4C0] dark:hover:text-[#E0FBFC] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800 dark:text-[#E0FBFC]">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-md">
              {error}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-[#000814] p-3 rounded-md border border-slate-200 dark:border-[#003566] text-xs text-slate-600 dark:text-[#9DB4C0]">
            <div>Case Number: <strong className="tabular-nums font-semibold text-slate-900 dark:text-[#E0FBFC]">{caseNumber}</strong></div>
            <div>Consumer: <strong className="text-slate-900 dark:text-[#E0FBFC]">{consumerName}</strong></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#E0FBFC] mb-1">
              Select Field Officer / Squad Lead *
            </label>
            <select
              value={selectedOfficerId}
              onChange={e => setSelectedOfficerId(Number(e.target.value))}
              className="w-full bg-white dark:bg-[#253237] border border-slate-300 dark:border-[#5C6B73] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-[#E0FBFC] focus:ring-1 focus:ring-[#003566] dark:focus:ring-[#C2DFE3] focus:outline-hidden"
              required
            >
              <option value="">-- Choose Officer --</option>
              {officers.map(o => (
                <option key={o.id} value={o.id}>
                  {o.full_name} ({o.employee_id}) — {o.zone} Zone
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#E0FBFC] mb-1">
              Scheduled Audit Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="w-full bg-white dark:bg-[#253237] border border-slate-300 dark:border-[#5C6B73] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-[#E0FBFC] focus:ring-1 focus:ring-[#003566] dark:focus:ring-[#C2DFE3] focus:outline-hidden"
              required
            >
            </input>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#E0FBFC] mb-1">
              Squad Instructions / Notes
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={3}
              className="w-full bg-white dark:bg-[#253237] border border-slate-300 dark:border-[#5C6B73] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-[#E0FBFC] focus:ring-1 focus:ring-[#003566] dark:focus:ring-[#C2DFE3] focus:outline-hidden"
            />
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
              className="bg-[#003566] hover:bg-[#001D3D] text-white text-xs font-semibold px-4 py-2 rounded-md flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer border border-[#C2DFE3]/20 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
