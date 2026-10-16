import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../services/api';
import type { DashboardMetrics, InspectionCaseSummary, MapPoint } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  ArrowRight,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [priorityCases, setPriorityCases] = useState<InspectionCaseSummary[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashData, casesData, mapData] = await Promise.all([
          api.getDashboard(),
          api.getCases(),
          api.getMapData()
        ]);
        setMetrics(dashData);
        setPriorityCases(casesData.slice(0, 4));
        setMapPoints(mapData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard operational data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mini Leaflet Map Preview initialization
  useEffect(() => {
    if (loading || !miniMapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: [13.0827, 80.2707],
        zoom: 11,
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        dragging: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers if any
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    mapPoints.forEach((p) => {
      if (p.latitude && p.longitude) {
        const latLng = L.latLng(p.latitude, p.longitude);
        bounds.extend(latLng);

        const colorBg = p.risk_category === 'HIGH'
          ? '#dc2626'
          : p.risk_category === 'MEDIUM'
            ? '#d97706'
            : '#059669';

        const miniIcon = L.divIcon({
          className: 'mini-gis-marker',
          html: `
            <div style="
              width: 12px;
              height: 12px;
              background-color: ${colorBg};
              border: 2px solid #ffffff;
              border-radius: 9999px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.35);
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        L.marker(latLng, { icon: miniIcon }).addTo(map);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [16, 16], maxZoom: 13, animate: false });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, mapPoints]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-44 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg max-w-7xl mx-auto">
        {error || 'Unable to retrieve operational metrics from backend.'}
      </div>
    );
  }

  const topCase = metrics.todays_top_priority_case;
  const completedAudits = metrics.confirmed_thefts_count + metrics.verified_clean_count;
  const totalAudits = metrics.total_cases_monitored || 1;
  const auditCompletionPct = Math.round((completedAudits / totalAudits) * 100);
  const theftConfirmedPct = completedAudits > 0 
    ? Math.round((metrics.confirmed_thefts_count / completedAudits) * 100) 
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* PRIMARY ACTION / URGENT CASE */}
      {topCase ? (
        <div
          data-tour="dashboard-action-card"
          className="bg-white border-2 border-red-300 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden"
        >
          {/* Top urgency strip */}
          <div className="flex items-center justify-between gap-2 border-b border-red-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="text-xs font-bold text-red-800 tracking-wider uppercase">
                Action Required • Highest Vigilance Priority
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold tabular-nums border border-slate-200">
                {topCase.case_number}
              </span>
              <StatusBadge status={topCase.status} />
            </div>
          </div>

          {/* Main Action Content */}
          <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {topCase.consumer_name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium mt-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {topCase.zone} Zone
                </span>
                {topCase.feeder && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">Feeder: {topCase.feeder}</span>
                  </>
                )}
              </div>
            </div>

            {/* Metrics & Action Button */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 pt-2 lg:pt-0">
              <div className="bg-red-50/70 border border-red-100 rounded-lg px-4 py-2 min-w-28">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  Theft Risk
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold tabular-nums text-red-700">
                    {(topCase.theft_risk_percentage ?? 0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-200/80 text-red-800">
                    {topCase.risk_category || 'CRITICAL'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 min-w-28">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Priority Rank
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold tabular-nums text-slate-900">
                    {topCase.priority_score.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium tabular-nums">/ 100</span>
                </div>
              </div>

              <Link
                to={`/employee/inspections/${topCase.case_id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-lg shadow-sm transition-colors uppercase tracking-wider shrink-0"
              >
                <span>Review Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">All Urgent Priorities Dispatched</h3>
              <p className="text-xs text-emerald-700">No pending candidates currently require emergency field inspection.</p>
            </div>
          </div>
          <Link to="/employee/inspections" className="text-xs font-bold text-emerald-800 hover:underline">
            View inspection queue →
          </Link>
        </div>
      )}

      {/* SECTION 3 — COMPACT OPERATIONAL STATUS */}
      <div data-tour="dashboard-kpis" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {String(metrics.pending_inspections).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
              Pending
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {String(metrics.total_cases_monitored).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
              Active Vigilance
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-red-700">
              {String(metrics.confirmed_thefts_count).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 mt-0.5">
              Confirmed Theft
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700">
              {String(metrics.verified_clean_count).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5">
              Verified Clean
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* SECTION 4 — SYMMETRICAL 2x2 OPERATIONAL WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ROW 1, COL 1: Visual Priority Queue */}
        <div
          data-tour="dashboard-queue-preview"
          className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col"
        >
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Top Priority Inspection Candidates
              </h3>
              <span className="text-[11px] text-slate-500">
                Ranked by ML theft likelihood & operational priority
              </span>
            </div>
            <Link
              to="/employee/inspections"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              <span>View all ({metrics.total_cases_monitored})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityCases.map((c) => {
              const isHigh = c.risk_category === 'HIGH';
              const isMedium = c.risk_category === 'MEDIUM';
              const dotColor = isHigh ? 'bg-red-600' : isMedium ? 'bg-amber-500' : 'bg-emerald-600';
              const riskTextColor = isHigh ? 'text-red-700' : isMedium ? 'text-amber-700' : 'text-emerald-700';

              return (
                <div
                  key={c.id}
                  className="p-3.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  {/* Left: Indicator + Name + Location */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {c.consumer_name}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-700">{c.case_number}</span>
                        <span>•</span>
                        <span>{c.zone} Zone</span>
                        {c.feeder && (
                          <>
                            <span>•</span>
                            <span>{c.feeder}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Risk %, Priority, Action */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <div className={`text-xs font-bold tabular-nums ${riskTextColor}`}>
                        {c.theft_risk_percentage.toFixed(1)}%
                      </div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">
                        {c.risk_category}
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold tabular-nums text-slate-900">
                        {c.operational_priority_score.toFixed(1)}
                      </div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">
                        Priority
                      </div>
                    </div>

                    <Link
                      to={`/employee/inspections/${c.id}`}
                      className="text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-200 px-3 py-1.5 rounded transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50/60 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Operational queue dispatched by priority rank</span>
            <Link
              to="/employee/inspections"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Open Full Queue →
            </Link>
          </div>
        </div>

        {/* ROW 1, COL 2: Distribution Zone Workload */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Distribution Zone Workload
              </h3>
              <span className="text-[11px] text-slate-500">
                Workload allocation across utility divisions
              </span>
            </div>
            <span className="text-[11px] tabular-nums font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {metrics.total_cases_monitored} active cases
            </span>
          </div>

          <div className="p-4 space-y-3.5">
            {Object.entries(metrics.zone_distribution).map(([zone, countVal]) => {
              const count = Number(countVal);
              const total = metrics.total_cases_monitored || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={zone} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 font-semibold">{zone} Zone</span>
                    <span className="tabular-nums text-slate-600 font-medium">
                      {count} {count === 1 ? 'case' : 'cases'} <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto bg-slate-50/60 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Balanced monitoring across 4 regional wings</span>
            <Link
              to="/employee/map"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Filter on Map →
            </Link>
          </div>
        </div>

        {/* ROW 2, COL 1: Operational Verification Summary */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Operational Verification Summary
              </h3>
              <span className="text-[11px] text-slate-500">
                Real-time closed-loop inspection performance
              </span>
            </div>
            <Link
              to="/employee/reports"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              <span>View Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 space-y-4">
            {/* Top Stat Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Audit Progress
                </span>
                <span className="text-lg tabular-nums font-bold text-slate-900 mt-0.5 block">
                  {completedAudits} / {totalAudits}
                </span>
                <span className="text-[10px] tabular-nums text-emerald-700 font-semibold">
                  {auditCompletionPct}% Completed
                </span>
              </div>

              <div className="bg-red-50/70 border border-red-100 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  Theft Strike Rate
                </span>
                <span className="text-lg tabular-nums font-bold text-red-700 mt-0.5 block">
                  {theftConfirmedPct}%
                </span>
                <span className="text-[10px] tabular-nums text-slate-500 font-medium">
                  {metrics.confirmed_thefts_count} of {completedAudits} Confirmed
                </span>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Pending Dispatch
                </span>
                <span className="text-lg tabular-nums font-bold text-amber-900 mt-0.5 block">
                  {metrics.pending_inspections}
                </span>
                <span className="text-[10px] tabular-nums text-slate-500 font-medium">
                  Field Queue
                </span>
              </div>
            </div>

            {/* Verification Status Breakdown Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">Verification Outcome Split</span>
                <span className="tabular-nums text-slate-500 text-[11px] font-medium">
                  {metrics.confirmed_thefts_count} Confirmed • {metrics.verified_clean_count} Clean • {metrics.pending_inspections} Pending
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-red-600 h-full transition-all"
                  style={{ width: `${(metrics.confirmed_thefts_count / totalAudits) * 100}%` }}
                  title="Confirmed Theft"
                />
                <div
                  className="bg-emerald-600 h-full transition-all"
                  style={{ width: `${(metrics.verified_clean_count / totalAudits) * 100}%` }}
                  title="Verified Clean"
                />
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${(metrics.pending_inspections / totalAudits) * 100}%` }}
                  title="Pending Inspection"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto bg-slate-50/60 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Model feedback loop updated upon each audit outcome</span>
            <Link
              to="/employee/reports"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Open Reports →
            </Link>
          </div>
        </div>

        {/* ROW 2, COL 2: Inspection Coverage Map Preview */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Inspection Coverage Map
                </h3>
              </div>
            </div>
            <span className="text-[11px] tabular-nums font-medium text-slate-500">
              {Object.keys(metrics.zone_distribution).length} zones • {mapPoints.length} locations
            </span>
          </div>

          <div className="p-4 flex flex-col flex-1">
            {/* Mini Map Container */}
            <div className="h-44 w-full rounded-md border border-slate-200 overflow-hidden relative bg-slate-100">
              <div ref={miniMapContainerRef} className="h-full w-full" />
            </div>
          </div>

          <div className="mt-auto bg-slate-50/60 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>GIS spatial coordinates with risk clustering</span>
            <Link
              to="/employee/map"
              className="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
