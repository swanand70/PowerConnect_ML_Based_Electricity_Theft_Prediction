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
        colorStyles = 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60';
        break;
      case 'NO_THEFT_FOUND':
        colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60';
        break;
      case 'INCONCLUSIVE':
        colorStyles = 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60';
        break;
      case 'NOT_VERIFIED':
      default:
        colorStyles = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1E2227] dark:text-[#9A9FA8] dark:border-[#2C3038]';
        break;
    }
  } else {
    switch (status) {
      case 'DETECTED':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60';
        break;
      case 'REVIEWED':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60';
        break;
      case 'ASSIGNED':
        colorStyles = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900/60';
        break;
      case 'SCHEDULED':
        colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/60';
        break;
      case 'OUTCOME_RECORDED':
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60';
        break;
      case 'CLOSED':
        colorStyles = 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-[#1E2227] dark:text-[#7A808C] dark:border-[#2C3038]';
        break;
      default:
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1E2227] dark:text-[#C5C8CE] dark:border-[#2C3038]';
    }
  }

  const formatText = (text: string) => text.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles}`}>
      {formatText(status)}
    </span>
  );
};
