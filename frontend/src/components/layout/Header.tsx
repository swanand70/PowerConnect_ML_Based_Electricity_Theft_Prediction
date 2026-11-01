import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PowerConnectBrand } from '../common/PowerConnectLogo';
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
  Sun,
  Moon,
  User,
  ChevronDown,
  ExternalLink
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
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
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

  // Handle outside click and Escape key dismissal for popovers
  useEffect(() => {
    if (!showNotifMenu && !showAccountMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifMenu(false);
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNotifMenu, showAccountMenu]);

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
          ? 'bg-[#000814] border-[#003566] text-[#E0FBFC]'
          : 'bg-white border-[#C2DFE3] text-[#001D3D]'
      }`}
    >
      {/* 1. LEFT: Small Sidebar Toggle + Application Identity */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-md border transition-colors focus:outline-hidden focus:ring-2 cursor-pointer ${
            isDark
              ? 'text-[#9DB4C0] hover:text-[#E0FBFC] hover:bg-[#001D3D] border-[#003566] focus:ring-[#C2DFE3]/40'
              : 'text-[#5C6B73] hover:text-[#001D3D] hover:bg-[#E0FBFC]/50 border-[#C2DFE3] focus:ring-[#003566]/40'
          }`}
          aria-label={sidebarOpen ? "Collapse navigation sidebar" : "Open navigation sidebar"}
          aria-expanded={sidebarOpen}
          title={sidebarOpen ? "Collapse Sidebar (Alt+M)" : "Expand Sidebar (Alt+M)"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className={`w-4 h-4 ${isDark ? 'text-[#9DB4C0]' : 'text-[#5C6B73]'}`} />
          ) : (
            <Menu className={`w-4 h-4 ${isDark ? 'text-[#9DB4C0]' : 'text-[#5C6B73]'}`} />
          )}
        </button>

        {/* Application Logo & Authority Identity */}
        <PowerConnectBrand
          descriptor="Field Inspection & Operations Platform"
          badge="Staff Portal"
          linkTo="/employee/dashboard"
          size="md"
        />
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
                    ? 'bg-[#001D3D] text-[#E0FBFC] border-[#C2DFE3]/40 shadow-2xs font-bold'
                    : 'bg-[#E0FBFC] text-[#003566] border-[#C2DFE3] shadow-2xs font-bold'
                  : isDark
                    ? 'text-[#9DB4C0] hover:text-[#E0FBFC] hover:bg-[#001D3D]/50 border-transparent'
                    : 'text-[#5C6B73] hover:text-[#001D3D] hover:bg-[#E0FBFC]/40 border-transparent'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  active ? (isDark ? 'text-[#E0FBFC]' : 'text-[#003566]') : (isDark ? 'text-[#5C6B73]' : 'text-[#9DB4C0]')
                }`}
              />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 3. RIGHT: Theme Toggle, Notifications, Consolidated Account Menu */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Dark/Light Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          data-tour="header-theme-toggle"
          className={`p-1.5 rounded-md border transition-colors cursor-pointer focus:outline-hidden focus:ring-2 ${
            isDark
              ? 'bg-[#001D3D] border-[#003566] text-[#9DB4C0] hover:text-[#E0FBFC] hover:border-[#C2DFE3]/50 focus:ring-[#C2DFE3]/40'
              : 'bg-white border-[#C2DFE3] text-[#5C6B73] hover:text-[#001D3D] hover:bg-[#E0FBFC]/50 focus:ring-[#003566]/40 shadow-2xs'
          }`}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#FFD60A] transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-[#001D3D] transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifMenu(prev => !prev)}
            className={`p-1.5 rounded-md relative border transition-colors cursor-pointer focus:outline-hidden focus:ring-2 ${
              isDark
                ? showNotifMenu ? 'bg-[#001D3D] border-[#C2DFE3]/40 text-[#E0FBFC]' : 'border-[#003566] text-[#9DB4C0] hover:text-[#E0FBFC] hover:bg-[#001D3D] focus:ring-[#C2DFE3]/40'
                : showNotifMenu ? 'bg-[#E0FBFC] border-[#C2DFE3] text-[#001D3D]' : 'border-[#C2DFE3] text-[#5C6B73] hover:text-[#001D3D] hover:bg-[#E0FBFC]/50 focus:ring-[#003566]/40 shadow-2xs'
            }`}
            aria-label={`Operational Notifications (${unreadCount} unread)`}
            aria-expanded={showNotifMenu}
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white dark:ring-[#000814]"></span>
            )}
          </button>

          {showNotifMenu && (
            <div
              role="region"
              aria-label="Notifications"
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 border ${
                isDark ? 'bg-[#001D3D] border-[#003566] text-[#E0FBFC]' : 'bg-white border-[#C2DFE3] text-[#001D3D]'
              }`}
            >
              <div
                className={`px-3.5 py-2 border-b flex items-center justify-between ${
                  isDark ? 'border-[#003566]' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-[#E0FBFC]' : 'text-slate-800'
                    }`}
                  >
                    Operational Alerts
                  </span>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] tabular-nums font-bold bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-[#9DB4C0] font-medium">all caught up</span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markingAllRead}
                    className="text-[11px] font-semibold text-blue-600 dark:text-[#8AA8FF] hover:underline transition-colors focus:outline-hidden disabled:opacity-50 cursor-pointer"
                  >
                    {markingAllRead ? 'Marking...' : 'Mark all as read'}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 dark:text-[#9DB4C0]">
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

        {/* Divider */}
        <div className={`h-5 w-px hidden sm:block ${isDark ? 'bg-[#003566]' : 'bg-[#C2DFE3]'}`}></div>

        {/* Consolidated Account & Secondary Controls Dropdown */}
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu(prev => !prev)}
            aria-expanded={showAccountMenu}
            aria-haspopup="true"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer focus:outline-hidden focus:ring-2 ${
              isDark
                ? showAccountMenu ? 'bg-[#001D3D] border-[#C2DFE3]/50 text-[#E0FBFC]' : 'border-[#003566] bg-[#001D3D] hover:bg-[#002855] text-[#E0FBFC] focus:ring-[#C2DFE3]/40'
                : showAccountMenu ? 'bg-[#E0FBFC] border-slate-300 text-[#001D3D]' : 'border-[#C2DFE3] bg-white hover:bg-[#E0FBFC]/50 text-[#001D3D] focus:ring-[#003566]/40 shadow-2xs'
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-[#003566]/20 text-[#003566] dark:text-[#E0FBFC] flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="hidden md:block pr-1 leading-tight text-left">
              <div className="text-xs font-semibold truncate max-w-[130px]">{user?.full_name || user?.username}</div>
              <div className="text-[10px] text-slate-500 dark:text-[#9DB4C0] font-semibold tabular-nums">{user?.employee_id || 'OFFICER'}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-[#9DB4C0] transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
          </button>

          {showAccountMenu && (
            <div
              role="menu"
              aria-label="User Account Menu"
              className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 border ${
                isDark ? 'bg-[#001D3D] border-[#003566] text-[#E0FBFC]' : 'bg-white border-[#C2DFE3] text-[#001D3D]'
              }`}
            >
              {/* Officer Details Header */}
              <div className="px-3.5 py-2.5 border-b border-inherit">
                <p className="text-xs font-semibold leading-tight">{user?.full_name || user?.username}</p>
                <p className={`text-[11px] font-semibold tabular-nums mt-0.5 ${isDark ? 'text-[#9DB4C0]' : 'text-slate-500'}`}>
                  {user?.employee_id || 'OFFICER'} • {user?.zone || 'All Zones'}
                </p>
              </div>

              {/* Navigation & Help Links */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountMenu(false);
                    onStartTour();
                  }}
                  data-tour="header-tour-btn"
                  className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs transition-colors text-left cursor-pointer ${
                    isDark ? 'hover:bg-[#000814] text-[#9DB4C0] hover:text-[#E0FBFC]' : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-4 h-4 text-[#003566] dark:text-[#8AA8FF]" />
                  <span>Start Guided Tour</span>
                </button>

                <Link
                  to="/employee/help"
                  onClick={() => setShowAccountMenu(false)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs transition-colors ${
                    isDark ? 'hover:bg-[#000814] text-[#9DB4C0] hover:text-[#E0FBFC]' : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-slate-400 dark:text-[#9DB4C0]" />
                  <span>Help & Documentation</span>
                </Link>

                <Link
                  to="/"
                  onClick={() => setShowAccountMenu(false)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs transition-colors ${
                    isDark ? 'hover:bg-[#000814] text-[#9DB4C0] hover:text-[#E0FBFC]' : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <ExternalLink className="w-4 h-4 text-slate-400 dark:text-[#9DB4C0]" />
                  <span>Public Portal</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="pt-1 border-t border-inherit">
                <button
                  type="button"
                  data-tour="header-logout-btn"
                  onClick={() => {
                    setShowAccountMenu(false);
                    logout();
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs transition-colors text-left cursor-pointer ${
                    isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
