import React from 'react';

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-5 animate-pulse space-y-4">
    <div className="h-5 bg-slate-200 rounded w-1/3"></div>
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-100 rounded w-full"></div>
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ columns?: number; rows?: number }> = ({ columns = 6, rows = 5 }) => (
  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden animate-pulse">
    <div className="bg-slate-50 border-b border-slate-200 p-4">
      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
    </div>
    <div className="divide-y divide-slate-100 p-4 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-100 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
