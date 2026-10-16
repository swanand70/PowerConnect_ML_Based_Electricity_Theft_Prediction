import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Wrench,
  Megaphone,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Bell,
  Check,
  ArrowRight
} from 'lucide-react';
import type { NotificationItem } from '../../types';

interface NotificationCardProps {
  notification: NotificationItem;
  isDark: boolean;
  onMarkRead?: (id: number) => void;
  onNavigate?: (linkUrl?: string) => void;
}

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const getNotificationCategoryMeta = (category: string, isDark: boolean) => {
  switch (category.toUpperCase()) {
    case 'BILL':
      return {
        label: 'Billing',
        icon: FileText,
        colorClass: isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeBg: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
      };
    case 'PAYMENT':
      return {
        label: 'Payment',
        icon: CheckCircle2,
        colorClass: isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeBg: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
      };
    case 'REMINDER':
      return {
        label: 'Reminder',
        icon: Clock,
        colorClass: isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-amber-700 border-amber-200',
        badgeBg: isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
      };
    case 'SERVICE':
      return {
        label: 'Service Desk',
        icon: Wrench,
        colorClass: isDark ? 'bg-purple-950/40 text-purple-300 border-purple-800/40' : 'bg-purple-50 text-purple-700 border-purple-200',
        badgeBg: isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
      };
    case 'ANNOUNCEMENT':
    case 'ADVISORY':
      return {
        label: 'Board Advisory',
        icon: Megaphone,
        colorClass: isDark ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeBg: isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
      };
    case 'USAGE':
      return {
        label: 'Energy Usage',
        icon: Zap,
        colorClass: isDark ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40' : 'bg-cyan-50 text-cyan-700 border-cyan-200',
        badgeBg: isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
      };
    case 'MAINTENANCE':
      return {
        label: 'Grid Maintenance',
        icon: AlertTriangle,
        colorClass: isDark ? 'bg-orange-950/40 text-orange-300 border-orange-800/40' : 'bg-orange-50 text-orange-700 border-orange-200',
        badgeBg: isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-800'
      };
    case 'ACCOUNT':
      return {
        label: 'Meter & Account',
        icon: ShieldCheck,
        colorClass: isDark ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200',
        badgeBg: isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
      };
    default:
      return {
        label: category || 'General',
        icon: Bell,
        colorClass: isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200',
        badgeBg: isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
      };
  }
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  isDark,
  onMarkRead,
  onNavigate,
}) => {
  const meta = getNotificationCategoryMeta(notification.category, isDark);
  const IconComponent = meta.icon;

  const handleClick = () => {
    if (!notification.is_read && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.link_url && onNavigate) {
      onNavigate(notification.link_url);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        notification.is_read
          ? isDark
            ? 'bg-[#141619]/60 hover:bg-[#1A1D21] border-[#292C32] text-[#9A9FA8]'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
          : isDark
            ? 'bg-[#181B22] hover:bg-[#1E232B] border-[#4338CA]/40 shadow-xs shadow-indigo-950/30 text-[#F3F4F5]'
            : 'bg-gradient-to-r from-blue-50/70 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50 border-indigo-200 shadow-xs text-slate-900'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon Badge */}
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105 ${meta.colorClass}`}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${meta.badgeBg}`}>
                {meta.label}
              </span>
              <h4
                className={`text-xs font-semibold truncate ${
                  notification.is_read
                    ? isDark ? 'text-[#9A9FA8]' : 'text-slate-700'
                    : isDark ? 'text-[#F3F4F5] font-bold' : 'text-slate-900 font-bold'
                }`}
              >
                {notification.title}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="text-[10px] font-medium text-slate-400 tabular-nums whitespace-nowrap"
                title={new Date(notification.created_at).toLocaleString()}
              >
                {formatRelativeTime(notification.created_at)}
              </span>
              {!notification.is_read && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-400/30 animate-pulse" />
              )}
            </div>
          </div>

          <p
            className={`text-[11px] leading-relaxed line-clamp-2 ${
              notification.is_read
                ? isDark ? 'text-[#717784]' : 'text-slate-500'
                : isDark ? 'text-[#C5C9D3]' : 'text-slate-700'
            }`}
          >
            {notification.message}
          </p>

          {/* Action Link indicator if present */}
          {notification.link_url && (
            <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1 text-indigo-500 dark:text-indigo-400 font-semibold group-hover:underline">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </span>

              {!notification.is_read && onMarkRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
