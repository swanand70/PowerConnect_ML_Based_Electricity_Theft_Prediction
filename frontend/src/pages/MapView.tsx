import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { api } from '../services/api';
import type { MapPoint } from '../types';
import { MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const MapView: React.FC = () => {
  const { isDark } = useTheme();
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [zoneFilter, setZoneFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        setLoading(true);
        const data = await api.getMapData();
        setPoints(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load map data.');
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
  }, []);

  const createTileLayer = (dark: boolean) => {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: dark ? 'dark-basemap' : ''
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Standard center around metropolitan utility district (e.g. 13.0827, 80.2707)
    const map = L.map(mapContainerRef.current, {
      center: [13.0827, 80.2707],
      zoom: 12,
      zoomControl: true
    });

    const initialLayer = createTileLayer(isDark);
    initialLayer.addTo(map);
    tileLayerRef.current = initialLayer;

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      try {
        map.stop();
        map.remove();
      } catch {
        // silent cleanup guard
      }
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Sync CartoDB Tile Layer with Theme (Dark Matter in dark mode, Voyager in light mode)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const updatedLayer = createTileLayer(isDark);
    updatedLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = updatedLayer;
  }, [isDark]);

  // Render markers when points or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = points.filter(p => {
      if (zoneFilter && p.zone !== zoneFilter) return false;
      if (riskFilter && p.risk_category !== riskFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });

    const bounds = L.latLngBounds([]);

    filtered.forEach(p => {
      const latLng = L.latLng(p.latitude, p.longitude);
      bounds.extend(latLng);

      // Custom DivIcon for clean utility aesthetics
      const colorBg = p.risk_category === 'HIGH' 
        ? '#dc2626' 
        : p.risk_category === 'MEDIUM' 
          ? '#d97706' 
          : '#059669';

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background-color: ${colorBg};
            color: white;
            font-weight: 700;
            font-size: 10px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-variant-numeric: tabular-nums;
            padding: 3px 6px;
            border-radius: 9999px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${p.operational_priority_score.toFixed(0)}
          </div>
        `,
        iconSize: [32, 22],
        iconAnchor: [16, 11]
      });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; min-width: 200px; padding: 4px;">
          <div style="font-weight: bold; color: #000814; margin-bottom: 2px;">${p.consumer_name}</div>
          <div style="font-size: 11px; color: #5C6B73; font-variant-numeric: tabular-nums; margin-bottom: 6px;">Case: ${p.case_number}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Risk Score:</span>
            <strong style="color: ${colorBg}; font-variant-numeric: tabular-nums;">${p.theft_risk_percentage.toFixed(1)}% (${p.risk_category})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Priority:</span>
            <strong style="font-variant-numeric: tabular-nums;">${p.operational_priority_score.toFixed(1)} / 100</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Grid Feeder:</span>
            <span style="font-weight: 500;">${p.feeder}</span>
          </div>
          <a href="/employee/inspections/${p.case_id}" style="
            display: block;
            text-align: center;
            background-color: #003566;
            color: #ffffff;
            padding: 6px 10px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 11px;
          ">Review Case Details</a>
        </div>
      `;

      const marker = L.marker(latLng, { icon }).bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });

    if (filtered.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [points, zoneFilter, riskFilter, statusFilter]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E0FBFC] tracking-tight flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#003566] dark:text-[#E0FBFC]" />
            <span>Inspection Candidate GIS Map</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#9DB4C0] mt-0.5">
            Geographic distribution of vigilance candidates with risk clustering across substations & feeders
          </p>
        </div>

        {/* Map Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
            className="bg-white dark:bg-[#000814] border border-slate-200 dark:border-[#003566] rounded-md px-2.5 py-1.5 text-xs text-slate-700 dark:text-[#E0FBFC] shadow-xs focus:ring-1 focus:ring-[#003566] focus:outline-hidden"
          >
            <option value="">All Zones</option>
            <option value="North">North Zone</option>
            <option value="South">South Zone</option>
            <option value="Central">Central Zone</option>
            <option value="East">East Zone</option>
            <option value="West">West Zone</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-white dark:bg-[#000814] border border-slate-200 dark:border-[#003566] rounded-md px-2.5 py-1.5 text-xs text-slate-700 dark:text-[#E0FBFC] shadow-xs focus:ring-1 focus:ring-[#003566] focus:outline-hidden"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#000814] border border-slate-200 dark:border-[#003566] rounded-md px-2.5 py-1.5 text-xs text-slate-700 dark:text-[#E0FBFC] shadow-xs focus:ring-1 focus:ring-[#003566] focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="DETECTED">Detected</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="OUTCOME_RECORDED">Outcome Recorded</option>
          </select>
        </div>
      </div>

      {/* Map Canvas */}
      <div data-tour="map-container" className="flex-1 bg-white dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg overflow-hidden shadow-xs relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-[#000814]/70 z-20 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-[#9DB4C0]">
            Loading geographical points...
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-4 z-20 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
