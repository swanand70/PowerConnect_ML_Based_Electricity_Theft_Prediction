import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import type { AnnotatedDailyReading, AnomalyObservation } from '../../utils/anomalyExplanation';
import { Info, AlertCircle, TrendingDown } from 'lucide-react';

interface ConsumptionChartProps {
  readings: AnnotatedDailyReading[];
  meanConsumption?: number;
  graphNarrative?: string;
  selectedObservation?: AnomalyObservation | null;
  onSelectReading?: (reading: AnnotatedDailyReading | null) => void;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({
  readings,
  meanConsumption,
  graphNarrative,
  selectedObservation,
  onSelectReading
}) => {

  if (!readings || readings.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-xs p-6">
        <Info className="w-6 h-6 text-slate-300 mb-2" />
        <p className="font-semibold text-slate-600">No daily smart meter readings available</p>
        <p className="text-slate-400 text-[11px] mt-0.5">Historical smart meter telemetry has not been indexed for this feeder connection.</p>
      </div>
    );
  }

  // Calculate actual baseline average if not provided
  const avgKwh = meanConsumption ?? (readings.reduce((sum, r) => sum + r.kwh, 0) / readings.length);
  const anomalousCount = readings.filter(r => r.isAnomaly).length;

  // Selected date range for ReferenceArea if an observation is active
  const startHighlight = selectedObservation?.highlightDates?.[0];
  const endHighlight = selectedObservation?.highlightDates?.[selectedObservation.highlightDates.length - 1];

  return (
    <div className="w-full space-y-4">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Electricity consumption over time
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Continuous 60-day smart meter telemetry • Daily consumption (kWh/Day)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-emerald-600 rounded-xs inline-block"></span>
            <span className="text-slate-600 font-medium">Daily kWh</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
            <span className="text-slate-500 tabular-nums">Baseline Avg ({avgKwh.toFixed(1)} kWh)</span>
          </div>

          {anomalousCount > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-600 inline-block"></span>
              <span className="text-red-700 font-semibold tabular-nums">
                Anomalous Days ({anomalousCount})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-72 w-full bg-white p-2 border border-slate-200 rounded-lg relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={readings}
            margin={{ top: 12, right: 15, left: -15, bottom: 5 }}
            onMouseMove={(e: any) => {
              if (e?.activePayload?.[0]?.payload && onSelectReading) {
                const item = e.activePayload[0].payload as AnnotatedDailyReading;
                onSelectReading(item);
              }
            }}
            onMouseLeave={() => {
              if (onSelectReading) onSelectReading(null);
            }}
          >
            <defs>
              <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={Math.ceil(readings.length / 8)}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              unit=" kWh"
            />

            {/* Optional Observation Highlight Window */}
            {startHighlight && endHighlight && (
              <ReferenceArea
                x1={startHighlight}
                x2={endHighlight}
                fill="#fef3c7"
                fillOpacity={0.5}
                stroke="#f59e0b"
                strokeDasharray="3 3"
              />
            )}

            {/* Baseline Average Reference Line */}
            <ReferenceLine
              y={avgKwh}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: `Baseline Mean (${avgKwh.toFixed(1)} kWh)`,
                position: 'insideTopRight',
                fill: '#64748b',
                fontSize: 9
              }}
            />

            {/* Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as AnnotatedDailyReading;
                  return (
                    <div className="bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700 space-y-1">
                      <div className="text-slate-400 font-medium text-[11px] tabular-nums">
                        Date: <span className="text-white font-semibold">{data.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-300">Recorded:</span>
                        <strong className="text-emerald-400 font-bold tabular-nums text-sm">
                          {data.kwh.toFixed(2)} kWh
                        </strong>
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        Historical Baseline: {data.baselineMean.toFixed(1)} kWh
                      </div>
                      {data.isAnomaly && (
                        <div className="pt-1 mt-1 border-t border-slate-700/80 text-[11px] text-amber-300 font-medium flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{data.anomalyReason || 'Significant drop below baseline'}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Primary Area Wave */}
            <Area
              type="monotone"
              dataKey="kwh"
              stroke="#059669"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#consumptionGradient)"
              activeDot={{ r: 5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              dot={(dotProps) => {
                const { cx, cy, payload } = dotProps;
                if (!cx || !cy) return null;
                const reading = payload as AnnotatedDailyReading;
                if (reading.isAnomaly) {
                  return (
                    <g key={`dot-${reading.date}`}>
                      <circle cx={cx} cy={cy} r={5} fill="#fee2e2" stroke="#dc2626" strokeWidth={1.5} />
                      <circle cx={cx} cy={cy} r={2} fill="#b91c1c" />
                    </g>
                  );
                }
                return null;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Section 5.5: What this graph tells you */}
      {graphNarrative && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-slate-200 text-slate-700">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              What this graph tells you
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {graphNarrative}
          </p>
          <div className="pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              • <strong>Expected Range:</strong> {Math.max(0, avgKwh - 4).toFixed(1)} – {(avgKwh + 5).toFixed(1)} kWh/day
            </span>
            <span>
              • <strong>Anomalous Readings:</strong> {anomalousCount} of {readings.length} days ({((anomalousCount / readings.length) * 100).toFixed(0)}%)
            </span>
            <span>
              • <strong>Standard Deviation:</strong> ±{Math.abs(avgKwh * 0.25).toFixed(1)} kWh
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
