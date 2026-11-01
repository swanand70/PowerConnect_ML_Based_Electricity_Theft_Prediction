import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../services/api';
import type { DashboardMetrics, InspectionCaseSummary, MapPoint } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowRight,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [priorityCases, setPriorityCases] = useState<InspectionCaseSummary[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const createMiniTileLayer = (dark: boolean) => {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      className: dark ? 'dark-basemap' : ''
    });
  };

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

      const initialLayer = createMiniTileLayer(isDark);
      initialLayer.addTo(map);
      tileLayerRef.current = initialLayer;

      mapInstanceRef.current = map;
    } else if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      const updatedLayer = createMiniTileLayer(isDark);
      updatedLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = updatedLayer;
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
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch {
          // silent cleanup
        }
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [loading, mapPoints, isDark]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-44 bg-slate-200 dark:bg-[#1E2227] rounded-xl animate-pulse"></div>
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
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-lg max-w-7xl mx-auto">
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
      {/* PRIMARY ACTION / URGENT DISPATCH CANDIDATE */}
      {topCase ? (
        <div
          data-tour="dashboard-action-card"
          className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] border-l-4 border-l-red-600 dark:border-l-red-500 rounded-lg p-4 sm:p-5 shadow-xs transition-colors"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Case Info & Location */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                  <AlertTriangle className="w-3 h-3" />
                  Priority Field Dispatch
                </span>
                <span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-[#9DB4C0] bg-slate-100 dark:bg-[#000814] px-2 py-0.5 rounded border border-slate-200 dark:border-[#003566]">
                  {topCase.case_number}
                </span>
                <StatusBadge status={topCase.status} />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#E0FBFC] tracking-tight">
                {topCase.consumer_name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-[#9DB4C0]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-[#9DB4C0]" />
                  {topCase.zone.endsWith('Zone') ? topCase.zone : `${topCase.zone} Zone`}
                </span>
                {topCase.feeder && (
                  <>
                    <span>•</span>
                    <span>Feeder: <strong className="font-semibold text-slate-700 dark:text-[#E0FBFC]">{topCase.feeder}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Middle & Right: Key Indicators & Action Button */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 lg:pt-0 shrink-0">
              {/* Theft Likelihood */}
              <div className="pr-4 border-r border-slate-200 dark:border-[#003566] last:border-0 sm:last:border-r">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#9DB4C0]">
                  Theft Likelihood
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
                    {(topCase.theft_risk_percentage ?? 0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300">
                    {topCase.risk_category || 'CRITICAL'}
                  </span>
                </div>
              </div>

              {/* Priority Rank */}
              <div className="pr-4 sm:border-r border-slate-200 dark:border-[#003566]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#9DB4C0]">
                  Priority Rank
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-[#E0FBFC]">
                    {topCase.priority_score.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-[#9DB4C0] tabular-nums font-medium">/ 100</span>
                </div>
              </div>

              {/* Action Link */}
              <Link
                to={`/employee/inspections/${topCase.case_id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#003566] hover:bg-[#001D3D] active:bg-[#000814] text-white font-semibold text-xs px-4 py-2.5 rounded-md shadow-xs transition-colors border border-[#C2DFE3]/30"
              >
                <span>Dispatch Inspection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">All Urgent Priorities Dispatched</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">No pending candidates currently require emergency field inspection.</p>
            </div>
          </div>
          <Link to="/employee/inspections" className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline">
            View inspection queue →
          </Link>
        </div>
      )}

      {/* SECTION 3 — COMPACT OPERATIONAL STATUS */}
      <div data-tour="dashboard-kpis" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-[#E0FBFC]">
              {metrics.pending_inspections}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#9DB4C0] mt-0.5">
              Pending
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-[#FFC300]/40 flex items-center justify-center text-amber-700 dark:text-[#FFD60A]">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-[#E0FBFC]">
              {metrics.total_cases_monitored}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#9DB4C0] mt-0.5">
              Active Vigilance
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-[#E0FBFC]/50 dark:bg-[#253237] border border-[#C2DFE3] dark:border-[#5C6B73] flex items-center justify-center text-[#003566] dark:text-[#E0FBFC]">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-red-700 dark:text-red-400">
              {metrics.confirmed_thefts_count}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mt-0.5">
              Confirmed Theft
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {metrics.verified_clean_count}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-0.5">
              Verified Clean
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* SECTION 4 — SYMMETRICAL 2x2 OPERATIONAL WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ROW 1, COL 1: Visual Priority Queue */}
        <div
          data-tour="dashboard-queue-preview"
          className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg overflow-hidden shadow-xs flex flex-col"
        >
          <div className="bg-[#E0FBFC]/40 dark:bg-[#000814] border-b border-[#C2DFE3] dark:border-[#003566] px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-[#E0FBFC] uppercase tracking-wider">
                Top Priority Inspection Candidates
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-[#9DB4C0]">
                Ranked by ML theft likelihood & operational priority
              </span>
            </div>
            <Link
              to="/employee/inspections"
              className="text-xs font-semibold text-[#003566] hover:text-[#001D3D] dark:text-[#E0FBFC] dark:hover:text-white inline-flex items-center gap-1"
            >
              <span>View all ({metrics.total_cases_monitored})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#002B54]">
            {priorityCases.map((c) => {
              const isHigh = c.risk_category === 'HIGH';
              const isMedium = c.risk_category === 'MEDIUM';
              const dotColor = isHigh ? 'bg-red-600' : isMedium ? 'bg-[#FFC300]' : 'bg-emerald-600';
              const riskTextColor = isHigh ? 'text-red-700 dark:text-red-400' : isMedium ? 'text-amber-700 dark:text-[#FFD60A]' : 'text-emerald-700 dark:text-emerald-400';

              return (
                <div
                  key={c.id}
                  className="p-3.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-[#E0FBFC]/30 dark:hover:bg-[#00152E] transition-colors"
                >
                  {/* Left: Indicator + Name + Location */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-[#E0FBFC] truncate">
                          {c.consumer_name}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#9DB4C0] tabular-nums flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-[#E0FBFC]">{c.case_number}</span>
                        <span>•</span>
                        <span>{c.zone.endsWith('Zone') ? c.zone : `${c.zone} Zone`}</span>
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
                      <div className="text-[10px] font-semibold uppercase text-slate-400 dark:text-[#9DB4C0]">
                        {c.risk_category}
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold tabular-nums text-slate-900 dark:text-[#E0FBFC]">
                        {c.operational_priority_score.toFixed(1)}
                      </div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400 dark:text-[#9DB4C0]">
                        Priority
                      </div>
                    </div>

                    <Link
                      to={`/employee/inspections/${c.id}`}
                      className="text-xs font-semibold text-[#003566] dark:text-[#E0FBFC] hover:text-[#001D3D] dark:hover:text-white bg-[#E0FBFC]/50 dark:bg-[#253237] hover:bg-[#E0FBFC] dark:hover:bg-[#253237]/80 border border-[#C2DFE3] dark:border-[#5C6B73] px-3 py-1.5 rounded-md transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#E0FBFC]/20 dark:bg-[#000814] border-t border-[#C2DFE3] dark:border-[#003566] px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-[#9DB4C0]">
            <span>Operational queue dispatched by priority rank</span>
            <Link
              to="/employee/inspections"
              className="font-semibold text-[#003566] dark:text-[#E0FBFC] hover:underline"
            >
              Open Full Queue →
            </Link>
          </div>
        </div>

        {/* ROW 1, COL 2: Distribution Zone Workload */}
        <div className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-[#E0FBFC]/40 dark:bg-[#000814] border-b border-[#C2DFE3] dark:border-[#003566] px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-[#E0FBFC] uppercase tracking-wider">
                Distribution Zone Workload
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-[#9DB4C0]">
                Workload allocation across utility divisions
              </span>
            </div>
            <span className="text-[11px] tabular-nums font-semibold text-slate-700 dark:text-[#E0FBFC] bg-[#E0FBFC]/50 dark:bg-[#253237] px-2 py-0.5 rounded border border-[#C2DFE3] dark:border-[#5C6B73]">
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
                    <span className="text-slate-700 dark:text-[#E0FBFC] font-semibold">{zone.endsWith('Zone') ? zone : `${zone} Zone`}</span>
                    <span className="tabular-nums text-slate-600 dark:text-[#9DB4C0] font-medium">
                      {count} {count === 1 ? 'case' : 'cases'} <span className="text-slate-400 dark:text-[#9DB4C0]/70">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-[#253237] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#003566] dark:bg-[#0055a5] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto bg-[#E0FBFC]/20 dark:bg-[#000814] border-t border-[#C2DFE3] dark:border-[#003566] px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-[#9DB4C0]">
            <span>Balanced monitoring across 4 regional wings</span>
            <Link
              to="/employee/map"
              className="font-semibold text-[#003566] dark:text-[#E0FBFC] hover:underline"
            >
              Filter on Map →
            </Link>
          </div>
        </div>

        {/* ROW 2, COL 1: Operational Verification Summary */}
        <div className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-[#E0FBFC]/40 dark:bg-[#000814] border-b border-[#C2DFE3] dark:border-[#003566] px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-[#E0FBFC] uppercase tracking-wider">
                Operational Verification Summary
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-[#9DB4C0]">
                Real-time closed-loop inspection performance
              </span>
            </div>
            <Link
              to="/employee/reports"
              className="text-xs font-semibold text-[#003566] hover:text-[#001D3D] dark:text-[#E0FBFC] dark:hover:text-white inline-flex items-center gap-1"
            >
              <span>View Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 space-y-4">
            {/* Top Stat Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#E0FBFC]/30 dark:bg-[#000814] border border-[#C2DFE3] dark:border-[#003566] rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#9DB4C0] block">
                  Audit Progress
                </span>
                <span className="text-lg tabular-nums font-bold text-slate-900 dark:text-[#E0FBFC] mt-0.5 block">
                  {completedAudits} / {totalAudits}
                </span>
                <span className="text-[10px] tabular-nums text-[#003566] dark:text-[#C2DFE3] font-semibold">
                  {auditCompletionPct}% Completed
                </span>
              </div>

              <div className="bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                  Theft Strike Rate
                </span>
                <span className="text-lg tabular-nums font-bold text-red-700 dark:text-red-400 mt-0.5 block">
                  {theftConfirmedPct}%
                </span>
                <span className="text-[10px] tabular-nums text-slate-500 dark:text-[#9DB4C0] font-medium">
                  {metrics.confirmed_thefts_count} of {completedAudits} Confirmed
                </span>
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-[#FFC300]/40 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-[#FFD60A] block">
                  Pending Dispatch
                </span>
                <span className="text-lg tabular-nums font-bold text-amber-900 dark:text-[#FFD60A] mt-0.5 block">
                  {metrics.pending_inspections}
                </span>
                <span className="text-[10px] tabular-nums text-slate-500 dark:text-[#9DB4C0] font-medium">
                  Field Queue
                </span>
              </div>
            </div>

            {/* Verification Status Breakdown Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 dark:text-[#E0FBFC]">Verification Outcome Split</span>
                <span className="tabular-nums text-slate-500 dark:text-[#9DB4C0] text-[11px] font-medium">
                  {metrics.confirmed_thefts_count} Confirmed • {metrics.verified_clean_count} Clean • {metrics.pending_inspections} Pending
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-[#253237] rounded-full overflow-hidden flex">
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
                  className="bg-[#FFC300] h-full transition-all"
                  style={{ width: `${(metrics.pending_inspections / totalAudits) * 100}%` }}
                  title="Pending Inspection"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto bg-[#E0FBFC]/20 dark:bg-[#000814] border-t border-[#C2DFE3] dark:border-[#003566] px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-[#9DB4C0]">
            <span>Model feedback loop updated upon each audit outcome</span>
            <Link
              to="/employee/reports"
              className="font-semibold text-[#003566] dark:text-[#E0FBFC] hover:underline"
            >
              Open Reports →
            </Link>
          </div>
        </div>

        {/* ROW 2, COL 2: Inspection Coverage Map Preview */}
        <div className="bg-white dark:bg-[#001D3D] border border-[#C2DFE3] dark:border-[#003566] rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-[#E0FBFC]/40 dark:bg-[#000814] border-b border-[#C2DFE3] dark:border-[#003566] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#003566] dark:text-[#E0FBFC]" />
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-[#E0FBFC] uppercase tracking-wider">
                  Inspection Coverage Map
                </h3>
              </div>
            </div>
            <span className="text-[11px] tabular-nums font-medium text-slate-500 dark:text-[#9DB4C0]">
              {Object.keys(metrics.zone_distribution).length} zones • {mapPoints.length} locations
            </span>
          </div>

          <div className="p-4 flex flex-col flex-1">
            {/* Mini Map Container */}
            <div className="h-44 w-full rounded-md border border-[#C2DFE3] dark:border-[#003566] overflow-hidden relative bg-slate-100 dark:bg-[#000814]">
              <div ref={miniMapContainerRef} className="h-full w-full" />
            </div>
          </div>

          <div className="mt-auto bg-[#E0FBFC]/20 dark:bg-[#000814] border-t border-[#C2DFE3] dark:border-[#003566] px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-[#9DB4C0]">
            <span>GIS spatial coordinates with risk clustering</span>
            <Link
              to="/employee/map"
              className="font-semibold text-[#003566] dark:text-[#E0FBFC] hover:underline inline-flex items-center gap-1"
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
