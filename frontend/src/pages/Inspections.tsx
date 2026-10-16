import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { InspectionCaseSummary } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { AssignModal } from '../components/inspections/AssignModal';
import { OutcomeModal } from '../components/inspections/OutcomeModal';
import {
  Search,
  X,
  ExternalLink
} from 'lucide-react';

export const Inspections: React.FC = () => {
  const [cases, setCases] = useState<InspectionCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  // Modals
  const [assignTarget, setAssignTarget] = useState<InspectionCaseSummary | null>(null);
  const [outcomeTarget, setOutcomeTarget] = useState<InspectionCaseSummary | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCases({
        zone: selectedZone || undefined,
        status: selectedStatus || undefined,
        risk: selectedRisk || undefined
      });
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inspection cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [selectedZone, selectedStatus, selectedRisk]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedZone('');
    setSelectedStatus('');
    setSelectedRisk('');
  };

  // Filter in-memory for client search bar query
  const filteredCases = cases.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.consumer_name.toLowerCase().includes(q) ||
      c.case_number.toLowerCase().includes(q) ||
      c.cons_no.toLowerCase().includes(q) ||
      c.feeder.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Prioritized Inspection Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked operational vigilance candidates sorted by theft probability & operational priority
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div data-tour="queue-filters" className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by consumer name, case number, or feeder..."
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
            />
          </div>

          {/* Zone Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
            >
              <option value="">All Zones</option>
              <option value="North">North Zone</option>
              <option value="South">South Zone</option>
              <option value="Central">Central Zone</option>
              <option value="East">East Zone</option>
              <option value="West">West Zone</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="DETECTED">Detected (Unassigned)</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="OUTCOME_RECORDED">Outcome Recorded</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
            >
              <option value="">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          {(selectedZone || selectedStatus || selectedRisk || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">No inspection cases match your filter criteria.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting filters or adjusting search parameters.</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-md"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div data-tour="queue-table" className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Priority / Consumer & Meter</th>
                  <th className="py-3 px-3">Location & Grid</th>
                  <th className="py-3 px-3 text-right">Theft Prob</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Field Outcome</th>
                  <th className="py-3 px-3">Squad Assignment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Priority & Consumer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <PriorityBadge category={c.risk_category} score={c.operational_priority_score} />
                      </div>
                      <Link
                        to={`/employee/inspections/${c.id}`}
                        className="font-bold text-slate-900 hover:text-emerald-700 text-xs block"
                      >
                        {c.consumer_name}
                      </Link>
                      <div className="tabular-nums text-[10px] text-slate-500 mt-0.5">
                        SGCC Meter ID: <span className="text-slate-700 font-semibold">{c.cons_no.length > 14 ? `${c.cons_no.substring(0, 14)}...` : c.cons_no}</span>
                      </div>
                      <div className="tabular-nums text-[9px] text-slate-400 font-medium">
                        Case: {c.case_number}
                      </div>
                    </td>

                    {/* Location & Grid */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{c.zone} Zone</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {c.feeder}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.substation}
                      </div>
                    </td>

                    {/* Risk Percentage */}
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <span className="font-bold text-sm text-red-700">
                        {c.theft_risk_percentage.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">Model Est.</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Outcome */}
                    <td className="py-3.5 px-3">
                      <StatusBadge status={c.outcome} type="outcome" />
                    </td>

                    {/* Assignment */}
                    <td className="py-3.5 px-3 text-[11px]">
                      {c.assigned_employee_name ? (
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {c.assigned_employee_name}
                          </span>
                          {c.scheduled_date && (
                            <span className="text-slate-500 tabular-nums text-[10px]">
                              {c.scheduled_date}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {c.status !== 'OUTCOME_RECORDED' ? (
                          <>
                            <button
                              onClick={() => setAssignTarget(c)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded transition-colors"
                              title="Assign Squad"
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => setOutcomeTarget(c)}
                              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-2.5 py-1.5 rounded transition-colors shadow-2xs"
                              title="Record Outcome"
                            >
                              Outcome
                            </button>
                          </>
                        ) : null}

                        <Link
                          to={`/employee/inspections/${c.id}`}
                          className="text-xs text-slate-500 hover:text-slate-900 p-1.5 rounded hover:bg-slate-100"
                          title="View Case Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <AssignModal
          isOpen={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          caseId={assignTarget.id}
          caseNumber={assignTarget.case_number}
          consumerName={assignTarget.consumer_name}
          onSuccess={fetchCases}
        />
      )}

      {/* Outcome Modal */}
      {outcomeTarget && (
        <OutcomeModal
          isOpen={!!outcomeTarget}
          onClose={() => setOutcomeTarget(null)}
          caseId={outcomeTarget.id}
          caseNumber={outcomeTarget.case_number}
          consumerName={outcomeTarget.consumer_name}
          onSuccess={fetchCases}
        />
      )}
    </div>
  );
};
