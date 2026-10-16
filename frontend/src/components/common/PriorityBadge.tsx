import React from 'react';

interface PriorityBadgeProps {
  category: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  score?: number;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ category, score }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';

  switch (category) {
    case 'HIGH':
      badgeStyle = 'bg-red-50 text-red-800 border-red-200 font-semibold dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60';
      break;
    case 'MEDIUM':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-medium dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60';
      break;
    case 'LOW':
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60';
      break;
    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-[#1E2227] dark:text-[#C5C8CE] dark:border-[#2C3038]';
  }

  return (
    <div className="inline-flex items-center space-x-1.5">
      <span className={`px-2 py-0.5 rounded text-xs border uppercase tracking-wider ${badgeStyle}`}>
        {category}
      </span>
      {score !== undefined && (
        <span className="text-xs tabular-nums font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 dark:bg-[#1E2227] dark:text-[#C5C8CE] dark:border-[#2C3038]">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
};
