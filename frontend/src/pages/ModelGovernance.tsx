import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ThreeTierMonitoringResponse } from '../types';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Lock,
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const ModelGovernance: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<ThreeTierMonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const monRes = await api.getModelMonitoring();
      setMonitoringData(monRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load model governance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !monitoringData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg">
          <h2 className="font-semibold text-base mb-1">Model Documentation Data Unavailable</h2>
          <p className="text-sm">{error || 'Unable to connect to model monitoring service.'}</p>
          <button
            onClick={loadAllData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { historical_baseline_tier1: tier1 } = monitoringData;
  const activeVersion = monitoringData.active_model_version;

  return (
    <div className="space-y-10 max-w-6xl mx-auto p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans pb-12">
      {/* ========================================================================= */}
      {/* HERO HEADER: Plain-English Mission Statement & Champion Status */}
      {/* ========================================================================= */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#E0FBFC] text-[#003566] dark:bg-[#003566]/60 dark:text-[#E0FBFC] border border-[#C2DFE3] dark:border-[#003566]">
                ML Documentation & Governance
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Decision Support System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 flex items-center space-x-2.5">
              <span>How PowerConnect AI Detects Electricity Theft</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-3xl leading-relaxed">
              A transparent, visual guide explaining the actual electricity-consumption data analysed, how our class-weighted model scores suspicious patterns, how field inspection feedback provides ground truth, and how human-governed retraining protects model reliability over time.
            </p>
          </div>

          {/* Active Model Snapshot Card */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 dark:bg-[#001D3D] border border-slate-200 dark:border-[#003566] rounded-lg px-4 py-3 text-right shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Active Production Champion
              </div>
              <div className="text-base font-bold text-[#003566] dark:text-[#E0FBFC] flex items-center justify-end space-x-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{activeVersion}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">(XGBoost, τ = {tier1.operating_threshold})</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Retraining: <span className="font-semibold text-amber-600 dark:text-amber-400">Manual & Governed</span>
              </div>
            </div>

            <button
              onClick={loadAllData}
              title="Refresh Live Data"
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: What Data Was Analysed? */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#E0FBFC] dark:bg-[#003566] text-[#003566] dark:text-[#E0FBFC] flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              What Data Was Analysed?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The real-world SGCC dataset, temporal span, class imbalance, and engineered behavioral features.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Our detection engine was developed on the verified State Grid Corporation of China (SGCC) historical smart-meter dataset. Rather than artificial or synthetic test cases, the model was trained on <strong>1,035 consecutive calendar days</strong> of actual daily kilowatt-hour readings collected from <strong>42,372 customer meters</strong> between January 1, 2014 and October 31, 2016.
        </p>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Monitoring Span</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">1,035 Days</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">2014-01-01 to 2016-10-31</div>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Consumers Analysed</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">42,372 Accounts</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">43.8 million daily readings</div>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Theft Prevalence</div>
            <div className="text-xl font-bold text-amber-600 dark:text-[#FFC300] mt-1">8.53% (3,615)</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1 theft : 10.7 normal accounts</div>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Raw Data Completeness</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">74.36% Valid</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">25.64% missing imputed</div>
          </div>
        </div>

        {/* Visual Element: Class Imbalance Representation */}
        <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Severe Class Imbalance Reality (10.7 to 1 Ratio)
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total: 42,372 Consumers</span>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="h-6 w-full rounded-md overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div
              style={{ width: '91.47%' }}
              className="bg-[#003566] dark:bg-[#001D3D] text-[#E0FBFC] flex items-center justify-start px-3 text-[11px] font-semibold"
              title="38,757 Normal Consumers (91.47%)"
            >
              Normal Consumers (38,757 · 91.5%)
            </div>
            <div
              style={{ width: '8.53%' }}
              className="bg-[#FFC300] text-[#000814] flex items-center justify-center text-[10px] font-bold"
              title="3,615 Theft Suspects (8.53%)"
            >
              Theft (8.5%)
            </div>
          </div>

          {/* Plain-English Caption */}
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700/60">
            <strong className="text-slate-900 dark:text-white">Why standard metrics fail here:</strong> Because 91.5% of accounts are completely innocent, a naive model that guesses “no theft” for everyone would falsely appear to be 91.5% accurate while catching zero thieves. To solve this, our XGBoost model is trained with a <strong>10.72x positive penalty weight</strong> (<code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">scale_pos_weight = 10.72</code>) to ensure rare theft signals are never drowned out by the normal majority.
          </p>
        </div>

        {/* Feature Engineering Table / Cards */}
        <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              The 26 Features Actually Used by the Model
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Extracted from daily time series</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The model does not make decisions on single-day spikes. Instead, it processes 26 statistical, behavioral, temporal, and data-integrity features designed to capture physical theft behaviors like meter shunting, phase bypassing, and intermittent neutral disconnection.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Quarterly Variance Ratio</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                  Top SHAP (0.455)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Measures whether seasonal changes match expected weather shifts. A sudden quarterly variance collapse without weather justification is the strongest indicator of illegal meter tampering.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Missing Reading Ratio & Quality Score</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                  SHAP (0.243 / 0.201)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Measures smart-meter transmission gaps. Physical tampering or radio-jamming frequently produces corrupted or missing bursts, quantified directly so gaps are not misconstrued as zero usage.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Daily & Weekly Autocorrelation (Lag 1 & 7)</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                  SHAP (0.223 / 0.170)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Legitimate households follow natural rhythms (cooking, evening lighting, weekend appliances). Bypassed or clamped meters show flatlined or irregular traces that destroy this normal correlation.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Recent vs. Historical 90-Day Ratio</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                  SHAP (0.110)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Compares the last 90 days against previous years. A 40%+ drop relative to an account's historical baseline flags potential initiation of a meter bypass.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
            * Additional features include trend slope, daily volatility difference, maximum single-day drop, zero-consumption ratio, coefficient of variation, and interquartile range (IQR).
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: How Does Prediction Work? */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#E0FBFC] dark:bg-[#003566] text-[#003566] dark:text-[#E0FBFC] flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              How Does Prediction Work?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              From consumption curves to inspection queues: scoring, thresholding, and the critical distinction between suspicion and proof.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Daily meter telemetry is transformed into engineered behavioral features and passed into our trained <strong>XGBoost classifier</strong> (<code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">150 decision trees, max_depth = 6, learning_rate = 0.08</code>). Rather than issuing a rigid true/false verdict, the model outputs a <strong>continuous suspicion probability between 0.0 and 1.0</strong>.
        </p>

        {/* 3 Step Card Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#003566] dark:text-[#E0FBFC] uppercase tracking-wider">
              Step 1: Probability Scoring
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The model evaluates all 26 behavioral features simultaneously to calculate the likelihood of theft. The output is a percentage reflecting pattern similarity to known theft cases.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#003566] dark:text-[#E0FBFC] uppercase tracking-wider">
              Step 2: Calibrated Threshold (τ = 0.65)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Standard 0.50 cutoffs generate too many false alarms. Tuning on validation data established <strong>0.65</strong> as the optimal threshold, ensuring field squads are only sent when risk is substantial.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#003566] dark:text-[#E0FBFC] uppercase tracking-wider">
              Step 3: Operational Queue Ranking
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Final inspection priority combines <strong className="text-slate-900 dark:text-white">70% ML Risk Score</strong> + <strong className="text-slate-900 dark:text-white">15% Volatility Anomaly</strong> + <strong className="text-slate-900 dark:text-white">15% Meter Data Reliability</strong> to maximize squad hit rates.
            </p>
          </div>
        </div>

        {/* Golden Callout Box: High Risk is Suspicion, NOT Proof */}
        <div className="p-5 rounded-lg bg-amber-50/70 dark:bg-[#001D3D]/90 border-2 border-amber-300 dark:border-[#FFC300]/60 space-y-2.5">
          <div className="flex items-center space-x-2.5 text-amber-900 dark:text-[#FFD60A]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-sm tracking-tight">
              Essential Principle: A High Risk Score is a Suspicion, Never Proof of Theft
            </h3>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            Machine learning models only analyze telemetry numbers; they cannot inspect physical wiring or interview occupants. A sudden 50% drop in electricity consumption can occur for completely innocent and legitimate reasons:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-white mb-0.5">☀️ Rooftop Solar</strong>
              Customer installed solar panels and now generates their own electricity.
            </div>
            <div className="p-2.5 rounded bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-white mb-0.5">✈️ Extended Vacancy</strong>
              The property is temporarily unoccupied or the family is traveling abroad.
            </div>
            <div className="p-2.5 rounded bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-white mb-0.5">❄️ Seasonal Shutdown</strong>
              Agricultural borewells or air conditioning turned off for winter months.
            </div>
            <div className="p-2.5 rounded bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-white mb-0.5">⚡ Meter Hardware Fault</strong>
              The physical meter is malfunctioning, not intentionally tampered with.
            </div>
          </div>
          <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 pt-1">
            Bottom Line: The model acts strictly as decision support to optimize patrol routes. Only a physical on-site audit by an authorized vigilance officer can establish the ground truth.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: Visual Closed-Loop Feedback Journey */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#E0FBFC] dark:bg-[#003566] text-[#003566] dark:text-[#E0FBFC] flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              The Closed-Loop Feedback Journey
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualizing how data flows from smart meters to field audits, into the feedback repository, and into governed model updates.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          PowerConnect implements a closed-loop operational lifecycle. Field inspection outcomes flow directly back into our governance database as verified ground truth. Notice the strict boundary between what happens <strong>automatically</strong> and what requires <strong>human review or manual retraining</strong>:
        </p>

        {/* 6-Step Visual Diagram Flow */}
        <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="relative p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Stage 1</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Automated
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Historical Consumption Data</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Smart meters transmit daily kilowatt-hour consumption. The system cleans telemetry, flags missing readings, and extracts 26 behavioral features.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Stage 2</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Automated
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Model Identifies Suspicion</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                XGBoost evaluates the feature vector and outputs a suspicion probability. Accounts crossing the calibrated <code className="font-mono text-xs">τ = 0.65</code> cutoff are flagged.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Stage 3</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Human Review
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inspection Squad Review</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Vigilance supervisors examine flagged candidate accounts, cross-reference customer billing notes and solar permits, and dispatch field officers.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Stage 4</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Field Action
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Physical On-Site Audit</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Officers inspect meter seals, terminal wiring, shunt switches, and overhead cables. Photographs and inspection evidence notes are recorded.
              </p>
            </div>

            {/* Step 5 */}
            <div className="relative p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Stage 5</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Verified Storage
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Audit Stored in Feedback DB</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Conclusive audits (<strong className="text-slate-900 dark:text-white">THEFT_CONFIRMED</strong> or <strong className="text-slate-900 dark:text-white">NO_THEFT_FOUND</strong>) are stored as ground truth. Inconclusive visits are quarantined.
              </p>
            </div>

            {/* Step 6 */}
            <div className="relative p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase">Stage 6</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                  Manual Retraining
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Controlled Candidate Update</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                When sufficient verified feedback accumulates (n ≥ 50), a supervisor triggers controlled retraining. A candidate model is promoted only if it beats the benchmark.
              </p>
            </div>
          </div>

          {/* Operational Clarity Callout */}
          <div className="p-4 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>What is Automatic vs. What is Controlled in PowerConnect Today?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Telemetry ingestion, scoring, and drift calculation run automatically.</strong> However, model retraining is <strong>NEVER automatic</strong>. Retraining without human validation causes catastrophic drift. PowerConnect enforces a strict 50-sample verified feedback gate and requires an authorized supervisor to explicitly approve any candidate model before it can replace Champion v1.0.0.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: How the Model Can Improve Over Time */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#E0FBFC] dark:bg-[#003566] text-[#003566] dark:text-[#E0FBFC] flex items-center justify-center font-bold text-sm">
            4
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              How the Model Can Improve Over Time
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Concrete examples of confirmed theft and clean outcomes feeding better training signal, plus why improvement is a goal, not a guarantee.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          AI models improve through verified examples of what theft looks like and what normal variations look like. Here is how field inspectors turn real-world observations into high-value training signal:
        </p>

        {/* 3 Outcome Example Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Confirmed Theft */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Example A: Confirmed Theft</h4>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <p>
                <strong>Field Finding:</strong> Officer finds a physical bypass wire shunting the meter during peak evening hours, causing a 45% drop in recorded daily usage.
              </p>
              <p>
                <strong>Logged Label:</strong> <code className="font-mono text-[11px] bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-1 py-0.5 rounded">THEFT_CONFIRMED (Label = 1)</code>
              </p>
              <p className="text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <strong>Training Value:</strong> Teaches the model that this exact combination of quarterly variance drop and low lag-1 autocorrelation represents verified theft, increasing sensitivity to similar signatures elsewhere.
              </p>
            </div>
          </div>

          {/* Card B: Clean Inspection */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Example B: Clean Inspection</h4>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <p>
                <strong>Field Finding:</strong> Officer finds an intact, sealed meter with zero tampering. The 50% consumption plunge occurred because the customer installed rooftop solar panels.
              </p>
              <p>
                <strong>Logged Label:</strong> <code className="font-mono text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1 py-0.5 rounded">NO_THEFT_FOUND (Label = 0)</code>
              </p>
              <p className="text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <strong>Training Value:</strong> Teaches the model that solar-style daytime drop profiles are innocent, directly reducing future false alarms and sparing innocent homeowners from repeated inspections.
              </p>
            </div>
          </div>

          {/* Card C: Inconclusive Audit */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <Lock className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Example C: Inconclusive Audit</h4>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <p>
                <strong>Field Finding:</strong> Premises locked, aggressive dog prevents entry, or meter is inaccessible behind high walls. No physical check was possible.
              </p>
              <p>
                <strong>Logged Label:</strong> <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 py-0.5 rounded">INCONCLUSIVE (Label = NULL)</code>
              </p>
              <p className="text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <strong>Quarantine Rule:</strong> Disqualified from training. Inconclusive visits must NEVER be assumed innocent or guilty, protecting training data from noise and false assumptions.
              </p>
            </div>
          </div>
        </div>

        {/* Cautionary Principle: Improvement is an Objective, Not a Guarantee */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Why Improvement is an Objective to Measure, Not a Guarantee</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            More feedback data does not automatically make an AI smarter. Because field squads naturally inspect accounts that the model already suspects, newly collected feedback suffers from <strong>selection bias</strong>. Blindly retraining on this skewed data could cause the model to overfit or lose accuracy on normal customer behavior. That is why candidate models must always be tested against the untouched benchmark before promotion.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: Model Evaluation */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#E0FBFC] dark:bg-[#003566] text-[#003566] dark:text-[#E0FBFC] flex items-center justify-center font-bold text-sm">
            5
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Model Evaluation
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Instead of relying on abstract mathematical curves, we evaluate our model based on practical questions that matter to utility operations: How many real thefts did we catch? How many innocent customers were bothered? How much more efficient are our field squads?
        </p>

        {/* 4 Outcome Matrix Breakdown in Plain English */}
        <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              The Real Test Set Story (6,356 Audited Consumer Accounts)
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Zero-leakage holdout test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* True Positives */}
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                Confirmed Thefts Caught
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {tier1.confusion_matrix.true_positives}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                True Positives: Real theft correctly identified and confirmed by field inspection. Revenue recovery achieved.
              </div>
            </div>

            {/* True Negatives */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Innocent Left Alone
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {tier1.confusion_matrix.true_negatives.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                True Negatives: Lawful customers whose normal consumption was recognized. Zero unnecessary visits dispatched.
              </div>
            </div>

            {/* False Positives */}
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">False Alarms</span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1 py-0.2 rounded">
                  5.3% of normal
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {tier1.confusion_matrix.false_positives}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                False Positives: Innocent accounts flagged (solar panels, vacations). Squad found no theft. Represents wasted visits.
              </div>
            </div>

            {/* False Negatives */}
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase">Missed Thefts</span>
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/60 px-1 py-0.2 rounded">
                  63.8% of theft
                </span>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {tier1.confusion_matrix.false_negatives}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                False Negatives: Real thefts where tampering was subtle and stayed below the 0.65 threshold. Continued revenue loss.
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded border border-slate-200 dark:border-slate-700/60">
            <strong className="text-slate-900 dark:text-white">Understanding the Trade-off:</strong> Lowering the threshold below 0.65 would catch more missed thefts, but it would dramatically increase false alarms and overwhelm inspection squads. Raising the threshold above 0.65 would eliminate false alarms, but allow more theft to slip by undetected.
          </div>
        </div>

        {/* Inspection Capacity: Top 500 Strategy Comparison */}
        <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Real-World Inspection Capacity: Auditing 500 Meters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparing traditional random audits against PowerConnect ML-assisted prioritization.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#E0FBFC] text-[#003566] dark:bg-[#003566] dark:text-[#E0FBFC] font-bold text-xs">
              4.9x Efficiency Boost
            </span>
          </div>

          {/* Side by Side Comparison Bars */}
          <div className="space-y-4 pt-1">
            {/* Strategy 1: Random Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Traditional Auditing (Random Meter Selection)
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  <strong>40 thefts confirmed</strong> out of 500 inspections (8.0% hit rate · 1.0x baseline)
                </span>
              </div>
              <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex border border-slate-200 dark:border-slate-700">
                <div style={{ width: '8.0%' }} className="bg-slate-400 text-white flex items-center justify-center text-[10px] font-bold">
                  8%
                </div>
                <div style={{ width: '92.0%' }} className="bg-slate-200 dark:bg-slate-700/60 flex items-center px-2 text-[10px] text-slate-500 dark:text-slate-400">
                  460 Wasted Inspections (Innocent Meters)
                </div>
              </div>
            </div>

            {/* Strategy 2: PowerConnect ML Risk */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#003566] dark:text-[#E0FBFC] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC300]" />
                  <span>PowerConnect AI Prioritization (Highest Risk Accounts)</span>
                </span>
                <span className="text-[#003566] dark:text-[#E0FBFC] font-bold">
                  <strong>195 thefts confirmed</strong> out of 500 inspections (39.0% hit rate · 4.9x improvement)
                </span>
              </div>
              <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex border border-[#003566]/30 dark:border-[#C2DFE3]/30">
                <div style={{ width: '39.0%' }} className="bg-[#003566] dark:bg-[#E0FBFC] text-[#E0FBFC] dark:text-[#003566] flex items-center justify-center text-[10px] font-bold">
                  39% (195 Confirmed Thefts)
                </div>
                <div style={{ width: '61.0%' }} className="bg-[#E0FBFC]/50 dark:bg-[#003566]/40 flex items-center px-2 text-[10px] text-slate-600 dark:text-slate-300">
                  305 False Dispatches (Down from 460)
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded border border-slate-200 dark:border-slate-700/60">
            <strong className="text-slate-900 dark:text-white">Operational Meaning:</strong> For the exact same budget and workforce hours (500 audits/month), deploying field teams with PowerConnect finds <strong>155 additional electricity theft cases every month</strong> compared to random patrol sweeps.
          </p>
        </div>
      </section>
    </div>
  );
};
