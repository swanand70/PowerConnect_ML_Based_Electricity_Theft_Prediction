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
        colorStyles = 'bg-red-50 text-red-700 border-red-300';
        break;
      case 'NO_THEFT_FOUND':
        colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-300';
        break;
      case 'INCONCLUSIVE':
        colorStyles = 'bg-amber-50 text-amber-700 border-amber-300';
        break;
      case 'NOT_VERIFIED':
      default:
        colorStyles = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else {
    switch (status) {
      case 'DETECTED':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'REVIEWED':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'ASSIGNED':
        colorStyles = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'SCHEDULED':
        colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'OUTCOME_RECORDED':
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
        break;
      case 'CLOSED':
        colorStyles = 'bg-slate-100 text-slate-500 border-slate-300';
        break;
      default:
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  const formatText = (text: string) => text.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles}`}>
      {formatText(status)}
    </span>
  );
};
