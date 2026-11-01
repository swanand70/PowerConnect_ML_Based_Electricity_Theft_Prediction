import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'outcome';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-300';

  if (type === 'outcome') {
    switch (status) {
      case 'THEFT_CONFIRMED':
        colorStyles = 'bg-red-50 text-red-700 border-red-200 font-semibold dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
        break;
      case 'NO_THEFT_FOUND':
        colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
        break;
      case 'INCONCLUSIVE':
        colorStyles = 'bg-amber-50 text-amber-700 border-amber-200 font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
        break;
      case 'NOT_VERIFIED':
      default:
        colorStyles = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1A1D22] dark:text-[#9A9FA8] dark:border-[#292C32]';
        break;
    }
  } else {
    switch (status) {
      case 'DETECTED':
        colorStyles = 'bg-amber-50 text-amber-800 border-amber-200 font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
        break;
      case 'REVIEWED':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
        break;
      case 'ASSIGNED':
      case 'SCHEDULED':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200 font-medium dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
        break;
      case 'OUTCOME_RECORDED':
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
        break;
      case 'CLOSED':
        colorStyles = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1A1D22] dark:text-[#9A9FA8] dark:border-[#292C32]';
        break;
      default:
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1A1D22] dark:text-[#C5C8CE] dark:border-[#292C32]';
    }
  }

  const formatText = (text: string) => text.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colorStyles}`}>
      {formatText(status)}
    </span>
  );
};
