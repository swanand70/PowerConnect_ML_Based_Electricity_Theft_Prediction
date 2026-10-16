import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationCard } from '../common/NotificationCard';
import {
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  PanelLeftClose,
  Compass,
  LayoutDashboard,
  ClipboardList,
  MapPin,
  BarChart3,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { api } from '../../services/api';
import type { NotificationItem } from '../../types';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onStartTour: () => void;
}

interface WorkspaceNavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const workspaceNavItems: WorkspaceNavItem[] = [
  {
    name: 'Dashboard',
    to: '/employee/dashboard',
    icon: LayoutDashboard,
    exact: true
  },
  {
    name: 'Inspection Queue',
    to: '/employee/inspections',
    icon: ClipboardList,
    exact: false // Also matches /employee/inspections/:caseId
  },
  {
    name: 'Inspection Map',
    to: '/employee/map',
    icon: MapPin,
    exact: true
  },
  {
    name: 'Reports',
    to: '/employee/reports',
    icon: BarChart3,
    exact: true
  },
  {
    name: 'Model Governance',
    to: '/employee/model-governance',
    icon: ShieldCheck,
    exact: true
  }
];

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  onStartTour
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data);
      } catch {
        // silent fail
      }
    };
    fetchNotifs();
  }, []);

  // Handle outside click and Escape key dismissal for notification popover
  useEffect(() => {
    if (!showNotifMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNotifMenu]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAllRead(true);
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // silent
    } finally {
      setMarkingAllRead(false);
    }
  };

  const isNavActive = (item: WorkspaceNavItem) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <header
      className={`h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-2xs border-b transition-colors duration-150 ${
        isDark
          ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* 1. LEFT: Small Sidebar Toggle + Application Identity */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Subtle icon-only sidebar toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-md border transition-colors focus:outline-hidden focus:ring-2 cursor-pointer ${
            isDark
              ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#1A1D21] border-[#292C32] focus:ring-[#8AA8FF]/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200 focus:ring-emerald-700/50'
          }`}
          aria-label={sidebarOpen ? "Collapse navigation sidebar" : "Open navigation sidebar"}
          aria-expanded={sidebarOpen}
          title={sidebarOpen ? "Collapse Sidebar (Alt+M)" : "Expand Sidebar (Alt+M)"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className={`w-4 h-4 ${isDark ? 'text-[#9A9FA8]' : 'text-slate-600'}`} />
          ) : (
            <Menu className={`w-4 h-4 ${isDark ? 'text-[#9A9FA8]' : 'text-slate-600'}`} />
          )}
        </button>

        {/* Application Logo & Authority Identity */}
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 sm:h-8 sm:w-8 bg-emerald-700 text-white rounded flex items-center justify-center font-bold tracking-wider text-xs sm:text-sm shadow-xs shrink-0">
            V
          </div>
          <div className="min-w-0">
            <div
              className={`font-bold text-xs sm:text-sm tracking-wide uppercase truncate ${
                isDark ? 'text-[#F3F4F5]' : 'text-slate-900'
              }`}
            >
              Vigilance & Inspection Intelligence
            </div>
            <div
              className={`text-[10px] hidden xl:block leading-none truncate ${
                isDark ? 'text-[#9A9FA8]' : 'text-slate-500'
              }`}
            >
              State Electricity Distribution Transmission & Inspection Wing
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Combined Workspace Navigation Strip */}
      <nav
        aria-label="Workspace Navigation"
        className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1 min-w-0"
      >
        {workspaceNavItems.map((item) => {
          const active = isNavActive(item);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 border whitespace-nowrap focus:outline-hidden focus:ring-2 ${
                active
                  ? isDark
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80 shadow-2xs font-bold'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-bold'
                  : isDark
                    ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#1A1D21] border-transparent'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-transparent'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  active ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-[#6E737D]' : 'text-slate-400')
                }`}
              />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 3. RIGHT: Help, Tour, Theme Toggle, Notifications, User Identity & Logout */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Help Button */}
        <Link
          to="/employee/help"
          className={`p-1.5 rounded-md border transition-colors focus:outline-hidden focus:ring-2 ${
            location.pathname === '/employee/help'
              ? isDark
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : isDark
                ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#1A1D21] border-transparent hover:border-[#292C32]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200'
          }`}
          title="Help & Reference Guide"
          aria-label="Help and Reference Guide"
        >
          <HelpCircle className={`w-4 h-4 ${isDark ? 'text-[#9A9FA8]' : 'text-slate-600'}`} />
        </Link>

        {/* Guided Tour Trigger */}
        <button
          type="button"
          onClick={onStartTour}
          data-tour="header-tour-btn"
          className={`p-1.5 rounded-md border transition-colors cursor-pointer focus:outline-hidden focus:ring-2 ${
            isDark
              ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#1A1D21] border-transparent hover:border-[#292C32]'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200'
          }`}
          title="Start Interactive Guided Tour"
          aria-label="Start Interactive Guided Tour"
        >
          <Compass className={`w-4 h-4 ${isDark ? 'text-[#9A9FA8]' : 'text-slate-600'}`} />
        </button>

        {/* Visible Dark/Light Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          data-tour="header-theme-toggle"
          className={`p-1.5 rounded-md border transition-colors cursor-pointer focus:outline-hidden focus:ring-2 ${
            isDark
              ? 'bg-[#141619] border-[#292C32] text-[#9A9FA8] hover:text-[#F3F4F5] hover:border-[#3E434D] focus:ring-[#8AA8FF]/50'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 focus:ring-emerald-700/50 shadow-2xs'
          }`}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#F3F4F5] transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifMenu(prev => !prev)}
            className={`p-1.5 rounded-md relative transition-colors cursor-pointer focus:outline-hidden focus:ring-2 ${
              isDark
                ? showNotifMenu ? 'bg-[#1A1D21] text-[#F3F4F5]' : 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#1A1D21] focus:ring-[#8AA8FF]/50'
                : showNotifMenu ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:ring-emerald-700/50'
            }`}
            aria-label={`Operational Notifications (${unreadCount} unread)`}
            aria-expanded={showNotifMenu}
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifMenu && (
            <div
              role="region"
              aria-label="Notifications"
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 border ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`px-3.5 py-2 border-b flex items-center justify-between ${
                  isDark ? 'border-[#292C32]' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-[#F3F4F5]' : 'text-slate-800'
                    }`}
                  >
                    Operational Alerts
                  </span>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] tabular-nums font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">all caught up</span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markingAllRead}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 hover:underline transition-colors focus:outline-hidden disabled:opacity-50 cursor-pointer"
                  >
                    {markingAllRead ? 'Marking...' : 'Mark all as read'}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No active operational alerts</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      isDark={isDark}
                      onMarkRead={handleMarkRead}
                      onNavigate={(linkUrl) => {
                        setShowNotifMenu(false);
                        if (linkUrl) {
                          navigate(linkUrl);
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity */}
        <div className={`h-5 w-px hidden md:block ${isDark ? 'bg-[#292C32]' : 'bg-slate-200'}`}></div>
        <div className="hidden md:flex items-center space-x-2">
          <div className="text-right">
            <div
              className={`text-xs font-semibold leading-tight ${
                isDark ? 'text-[#F3F4F5]' : 'text-slate-800'
              }`}
            >
              {user?.full_name || user?.username}
            </div>
            <div
              className={`text-[10px] tabular-nums leading-tight font-medium ${
                isDark ? 'text-[#9A9FA8]' : 'text-slate-500'
              }`}
            >
              <span>{user?.employee_id || 'OFFICER'}</span>
              <span className="mx-1">•</span>
              <span className="text-emerald-600 font-semibold">{user?.zone || 'All Zones'}</span>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          data-tour="header-logout-btn"
          onClick={logout}
          className={`p-1.5 rounded transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-red-600/50 ${
            isDark
              ? 'text-[#9A9FA8] hover:text-red-400 hover:bg-red-500/10'
              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Sign Out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
