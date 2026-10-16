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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-300 rounded-lg max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-slate-800">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold uppercase tracking-wide">Assign Inspection Squad</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600">
            <div>Case Number: <strong className="tabular-nums font-semibold text-slate-900">{caseNumber}</strong></div>
            <div>Consumer: <strong className="text-slate-900">{consumerName}</strong></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Field Officer / Squad Lead *
            </label>
            <select
              value={selectedOfficerId}
              onChange={e => setSelectedOfficerId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduled Audit Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Squad Instructions / Notes
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
            />
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
