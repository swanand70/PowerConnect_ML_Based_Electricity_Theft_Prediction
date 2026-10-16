import React from 'react';
import type { ShapFactor } from '../../types';
import { Info } from 'lucide-react';

interface ShapWaterfallChartProps {
  factors: ShapFactor[];
  theftProbability: number;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({ factors, theftProbability }) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
        No specific feature contribution factors recorded for this model version.
      </div>
    );
  }

  // Find max contribution for relative bar scaling
  const maxAbsVal = Math.max(...factors.map(f => Math.abs(f.shap_contribution)), 0.1);

  return (
    <div className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#F3F4F5] uppercase tracking-wide">
            Why was this consumer flagged?
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#9A9FA8] mt-0.5">
            Key behavioral and data-quality factors contributing to the model's prediction
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-[#9A9FA8] font-medium">Predicted Theft Probability</span>
          <div className="text-base font-bold text-red-700 dark:text-red-400 tabular-nums">
            {(theftProbability * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Responsible ML Context Note */}
      <div className="mb-5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md p-3 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
          The model's prediction is primarily influenced by consumption-pattern irregularities and data-quality signals. These factors indicate that physical verification may be useful; they do not establish theft by themselves.
        </p>
      </div>

      {/* Factor Contribution Bars */}
      <div className="space-y-4">
        {factors.map((factor, idx) => {
          const isRiskDriver = factor.shap_contribution > 0;
          const absPercent = Math.min(100, Math.round((Math.abs(factor.shap_contribution) / maxAbsVal) * 100));
          const signedValue = factor.shap_contribution > 0 
            ? `+${factor.shap_contribution.toFixed(3)}` 
            : factor.shap_contribution.toFixed(3);

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-semibold text-slate-800 dark:text-[#F3F4F5]">
                  {factor.display_name}
                </span>
                <span className={`tabular-nums font-bold ${isRiskDriver ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {signedValue}
                </span>
              </div>

              {/* Relative impact bar */}
              <div className="h-3 w-full bg-slate-100 dark:bg-[#202328] rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isRiskDriver ? 'bg-red-600 dark:bg-red-500' : 'bg-emerald-600 dark:bg-emerald-500'
                  }`}
                  style={{ width: `${absPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 dark:text-[#9A9FA8]">
                <span>Value: <strong className="tabular-nums font-semibold text-slate-700 dark:text-[#CBD0D8]">{factor.feature_value}</strong></span>
                <span className="italic">
                  {isRiskDriver ? 'Elevates theft risk probability' : 'Lowers theft risk probability'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
