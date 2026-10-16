import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Activity,
  Send,
  Bell,
  LogOut,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  X,
  CreditCard,
  Sun,
  Moon,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Compass
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { ConsumerGuidedTourModal } from '../components/onboarding/ConsumerGuidedTourModal';
import { NotificationCard } from '../components/common/NotificationCard';
import type {
  ConsumerProfile,
  ConsumerUsage,
  BillItem,
  ConsumerIssueItem,
  NotificationItem,
  BoardPostItem
} from '../types';

export const ConsumerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'billing' | 'issues'>('overview');
  const [tourOpen, setTourOpen] = useState<boolean>(false);

  // Auto-trigger guided tour on first login if onboarding is not completed
  useEffect(() => {
    if (user && user.onboarding_completed === false) {
      setTourOpen(true);
    }
  }, [user]);

  // Data states
  const [profile, setProfile] = useState<ConsumerProfile | null>(null);
  const [usage, setUsage] = useState<ConsumerUsage | null>(null);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [issues, setIssues] = useState<ConsumerIssueItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<BoardPostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Issue reporting form state
  const [issueCategory, setIssueCategory] = useState<string>('METER_FAULT');
  const [issueSubject, setIssueSubject] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [submittingIssue, setSubmittingIssue] = useState<boolean>(false);
  const [issueSuccessMessage, setIssueSuccessMessage] = useState<string | null>(null);
  const [issueErrorMessage, setIssueErrorMessage] = useState<string | null>(null);

  // Notifications drawer modal
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Load consumer records from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getConsumerProfile().catch(() => null),
      api.getConsumerUsage().catch(() => null),
      api.getMyBills().catch(() => []),
      api.getMyIssues().catch(() => []),
      api.getNotifications().catch(() => []),
      api.getBoardPosts().catch(() => [])
    ])
      .then(([profData, usageData, billsData, issuesData, notifData, postsData]) => {
        if (!isMounted) return;
        setProfile(profData);
        setUsage(usageData);
        setBills(billsData || []);
        setIssues(issuesData || []);
        setNotifications(notifData || []);
        setAnnouncements(postsData?.slice(0, 3) || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load consumer records from backend.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Submit Issue Handler
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSubject.trim() || !issueDescription.trim()) {
      setIssueErrorMessage('Please provide both subject and detailed description.');
      return;
    }

    setSubmittingIssue(true);
    setIssueSuccessMessage(null);
    setIssueErrorMessage(null);

    try {
      const created = await api.reportIssue({
        category: issueCategory,
        subject: issueSubject.trim(),
        description: issueDescription.trim()
      });
      setIssues(prev => [created, ...prev]);
      setIssueSuccessMessage(`Service grievance lodged successfully. Ticket ID: ${created.ticket_number}`);
      setIssueSubject('');
      setIssueDescription('');
    } catch (err: any) {
      setIssueErrorMessage(err.message || 'Failed to submit issue. Please try again.');
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // safe fallback
    }
  };

  // Mark single notification read
  const handleMarkOneRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // safe fallback
    }
  };

  // Navigate when notification action is clicked
  const handleNotificationNavigate = (linkUrl?: string) => {
    setShowNotificationsModal(false);
    if (!linkUrl) return;
    if (linkUrl.includes('/bills')) setActiveTab('billing');
    else if (linkUrl.includes('/issues')) setActiveTab('issues');
    else if (linkUrl.includes('/usage')) setActiveTab('usage');
    else if (linkUrl.includes('/updates') || linkUrl.includes('board-communication') || linkUrl.includes('announcement')) {
      navigate('/board-communication');
    }
    else if (linkUrl.includes('/account')) setActiveTab('overview');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Active or most recent bill
  const currentBill = bills[0] || null;

  // Computed usage statistics
  const usageStats = useMemo(() => {
    const samples = usage?.historical_daily_sample || [];
    if (samples.length === 0) {
      return { peak: 0, min: 0, avg: 0, total: 0 };
    }
    const values = samples.map(s => s.kwh);
    const peak = Math.max(...values);
    const min = Math.min(...values);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = Number((total / values.length).toFixed(1));
    return { peak, min, avg, total: Math.round(total) };
  }, [usage]);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-sans ${
          isDark ? 'bg-[#0B0C0E] text-[#F3F4F5]' : 'bg-[#F8F9FA] text-[#0F141C]'
        }`}
      >
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#2B59FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`text-xs font-medium ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
            Retrieving authenticated consumer records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#0B0C0E] text-[#F3F4F5] selection:bg-[#8AA8FF]/20 selection:text-[#F3F4F5]'
          : 'bg-[#F8F9FA] text-[#0F141C] selection:bg-[#2B59FF]/20 selection:text-[#0F141C]'
      }`}
    >
      {/* 1. Institutional Top Navigation Bar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#0B0C0E]/92 border-[#292C32]'
            : 'bg-[#F8F9FA]/92 border-[#E2E5E9]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Portal Wordmark */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-2xs transition-colors ${
                  isDark
                    ? 'border-[#292C32] bg-[#141619] text-[#8AA8FF] group-hover:border-[#8AA8FF]/40'
                    : 'border-[#E2E5E9] bg-white text-[#2B59FF] group-hover:border-[#2B59FF]/40'
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight">PowerConnect</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#8AA8FF]' : 'bg-[#2B59FF]'}`}></span>
              </div>
            </Link>

            <span className={`text-xs ${isDark ? 'text-[#3E434D]' : 'text-slate-300'}`}>|</span>

            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                isDark
                  ? 'bg-[#141619] border-[#292C32] text-[#8AA8FF]'
                  : 'bg-blue-50/70 border-blue-200/80 text-[#2B59FF]'
              }`}
            >
              Consumer Portal
            </span>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Consumer Account Badge */}
            <div className="hidden sm:flex flex-col text-right pr-1">
              <span className="text-xs font-semibold">{profile?.name || user?.full_name || 'Consumer User'}</span>
              <span className={`text-[11px] font-mono ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                {profile?.consumer_no ? `Acc: ${profile.consumer_no}` : 'Verified Account'}
              </span>
            </div>

            {/* Notifications Button */}
            <button
              type="button"
              data-tour="consumer-notifications-btn"
              onClick={() => setShowNotificationsModal(true)}
              className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#292C32] bg-[#141619] hover:bg-[#1A1D21] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'border-[#E2E5E9] bg-white hover:bg-[#F4F5F7] text-[#525866] hover:text-[#0F141C] shadow-2xs'
              }`}
              title="Notifications & Alerts"
              aria-label="Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Guided Tour Replay Button */}
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#292C32] bg-[#141619] hover:bg-[#1A1D21] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'border-[#E2E5E9] bg-white hover:bg-[#F4F5F7] text-[#525866] hover:text-[#0F141C] shadow-2xs'
              }`}
              title="Interactive Guided Tour"
              aria-label="Interactive Guided Tour"
            >
              <Compass className="w-3.5 h-3.5 text-[#2B59FF] dark:text-[#8AA8FF]" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#292C32] bg-[#141619] hover:bg-[#1A1D21] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'border-[#E2E5E9] bg-white hover:bg-[#F4F5F7] text-[#525866] hover:text-[#0F141C] shadow-2xs'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Return to Public Gateway */}
            <Link
              to="/"
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isDark
                  ? 'border-[#292C32] bg-[#141619] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'border-[#E2E5E9] bg-white text-[#525866] hover:text-[#0F141C] shadow-2xs'
              }`}
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Public Gateway</span>
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={logout}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#292C32] bg-[#141619] hover:bg-[#1A1D21] text-[#9A9FA8] hover:text-red-400'
                  : 'border-[#E2E5E9] bg-white hover:bg-[#F4F5F7] text-[#525866] hover:text-red-600 shadow-2xs'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-inherit scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? isDark
                  ? 'border-[#8AA8FF] text-[#F3F4F5]'
                  : 'border-[#2B59FF] text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'usage'
                ? isDark
                  ? 'border-[#8AA8FF] text-[#F3F4F5]'
                  : 'border-[#2B59FF] text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            Electricity Usage
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'billing'
                ? isDark
                  ? 'border-[#8AA8FF] text-[#F3F4F5]'
                  : 'border-[#2B59FF] text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            Bills & Statements
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'issues'
                ? isDark
                  ? 'border-[#8AA8FF] text-[#F3F4F5]'
                  : 'border-[#2B59FF] text-[#0F141C]'
                : isDark
                ? 'border-transparent text-[#9A9FA8] hover:text-[#F3F4F5]'
                : 'border-transparent text-[#525866] hover:text-[#0F141C]'
            }`}
          >
            <span>Service Requests</span>
            {issues.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isDark ? 'bg-[#1E232B] text-[#8AA8FF]' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {issues.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {error && (
          <div
            className="p-4 rounded-xl border text-xs flex items-start gap-3 bg-red-500/10 border-red-500/30 text-red-400"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: OVERVIEW DASHBOARD
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Account & Connection Verified Status Banner */}
            <div
              data-tour="consumer-account-summary"
              className={`p-6 rounded-2xl border transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-inherit">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#8AA8FF] uppercase tracking-wider">
                      Electricity Supply Account
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Active Grid Connection</span>
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                    {profile?.name || 'Authorized Consumer'}
                  </h1>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    {profile?.address || 'Service address registered with State Electricity Board'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                  <div
                    className={`px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-slate-500'}`}>Consumer ID</span>
                    <strong className="font-mono">{profile?.consumer_no || 'N/A'}</strong>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-slate-500'}`}>Smart Meter</span>
                    <strong className="font-mono">{profile?.meter_number || 'SMART-001'}</strong>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-slate-500'}`}>Tariff Category</span>
                    <strong>{profile?.tariff_category || 'DOMESTIC'}</strong>
                  </div>
                </div>
              </div>

              {/* Technical Supply Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                <div>
                  <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-[#717784]'}`}>Sanctioned Load</span>
                  <span className="font-semibold text-sm">{profile?.sanctioned_load_kw || 5.0} kW</span>
                </div>
                <div>
                  <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-[#717784]'}`}>Distribution Feeder</span>
                  <span className="font-semibold text-sm">{profile?.feeder || 'Feeder-11'}</span>
                </div>
                <div>
                  <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-[#717784]'}`}>Substation Zone</span>
                  <span className="font-semibold text-sm">{profile?.substation} • {profile?.zone}</span>
                </div>
                <div>
                  <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-[#717784]'}`}>Data Transmission</span>
                  <span className="font-semibold text-sm flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Bidirectional AMR</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Core Information Cards (Answering Questions 2, 3, 4) */}
            <div
              data-tour="consumer-kpis"
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {/* Card 1: Current Bill & Due Date */}
              <div
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-colors ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      Current Statement
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        currentBill?.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : currentBill?.status === 'OVERDUE'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {currentBill?.status || 'NO ACTIVE BILL'}
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    ₹{currentBill ? currentBill.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>

                  <div className={`text-xs mt-3 space-y-1 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8AA8FF]" />
                      <span>Due Date: <strong>{currentBill?.due_date || 'N/A'}</strong></span>
                    </div>
                    {currentBill && (
                      <div className="text-[11px] text-[#6E737D]">
                        Billing Period: {currentBill.billing_period_start} to {currentBill.billing_period_end}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-inherit">
                  <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#8AA8FF] hover:underline cursor-pointer"
                  >
                    <span>View Bill Breakdown & Payment Info</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Electricity Usage Summary */}
              <div
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-colors ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      Recent Consumption
                    </span>
                    <Activity className="w-4 h-4 text-[#8AA8FF]" />
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    {usage?.current_month_kwh ? `${usage.current_month_kwh} kWh` : `${usageStats.total} kWh`}
                  </div>

                  <div className={`text-xs mt-3 space-y-1 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    <div>
                      Daily Average: <strong>{usage?.mean_consumption_kwh || usageStats.avg} kWh/day</strong>
                    </div>
                    <div className="text-[11px] text-[#6E737D]">
                      Peak Day: {usageStats.peak} kWh • Min Day: {usageStats.min} kWh
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-inherit">
                  <button
                    type="button"
                    onClick={() => setActiveTab('usage')}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#8AA8FF] hover:underline cursor-pointer"
                  >
                    <span>Inspect Daily Consumption Curve</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Service & Meter Inquiries */}
              <div
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-colors ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      Service Inquiries & Grievances
                    </span>
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    {issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length} Open
                  </div>

                  <div className={`text-xs mt-3 space-y-1 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    <div>
                      Total Tickets Recorded: <strong>{issues.length}</strong>
                    </div>
                    <div className="text-[11px] text-[#6E737D]">
                      Meter fault & billing disputes tracked
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-inherit">
                  <button
                    type="button"
                    onClick={() => setActiveTab('issues')}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#8AA8FF] hover:underline cursor-pointer"
                  >
                    <span>Lodge New Service Request</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Daily Consumption Trend Preview */}
            <div
              className={`p-6 rounded-2xl border transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-bold tracking-tight">Recent Daily Electricity Consumption</h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Daily kilowatt-hour (kWh) readings logged by your digital electronic meter
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('usage')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8AA8FF] hover:underline cursor-pointer self-start sm:self-auto"
                >
                  <span>Detailed Analytics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {usage?.historical_daily_sample && usage.historical_daily_sample.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usage.historical_daily_sample} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="usageGradientPreview" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDark ? '#8AA8FF' : '#2B59FF'} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={isDark ? '#8AA8FF' : '#2B59FF'} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#292C32' : '#F0F2F5'} vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke={isDark ? '#6E737D' : '#8C95A6'}
                        fontSize={10}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis
                        stroke={isDark ? '#6E737D' : '#8C95A6'}
                        fontSize={10}
                        tickLine={false}
                        unit=" kWh"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#141619' : '#FFFFFF',
                          borderColor: isDark ? '#292C32' : '#E2E5E9',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: isDark ? '#F3F4F5' : '#0F141C',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="kwh"
                        name="Daily Usage"
                        stroke={isDark ? '#8AA8FF' : '#2B59FF'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#usageGradientPreview)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-[#9A9FA8]">
                  No daily interval readings recorded for this billing cycle.
                </div>
              )}
            </div>

            {/* Official Board Advisories & Announcements */}
            <div
              className={`p-6 rounded-2xl border transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8AA8FF]" />
                  <h2 className="text-base font-bold tracking-tight">Official Board Bulletins & Announcements</h2>
                </div>
                <Link
                  to="/board-communication"
                  className="text-xs font-semibold text-[#8AA8FF] hover:underline flex items-center gap-1"
                >
                  <span>All Bulletins</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {announcements.map((post) => (
                  <div
                    key={post.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition-colors ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8AA8FF]/10 text-[#8AA8FF]">
                      {post.category.replace('_', ' ')}
                    </span>
                    <h3 className="font-semibold text-sm line-clamp-1">{post.title}</h3>
                    <p className={`line-clamp-2 text-xs leading-relaxed ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      {post.summary}
                    </p>
                    <div className="text-[10px] text-[#6E737D] pt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Published: {new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: USAGE & CONSUMPTION ANALYTICS
           ========================================================================= */}
        {activeTab === 'usage' && (
          <div className="space-y-6" data-tour="consumer-usage-section">
            <div
              className={`p-6 rounded-2xl border space-y-6 transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div>
                <h2 className="text-lg font-bold tracking-tight">Electricity Usage & Interval Analytics</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                  Smart digital meter interval recordings calibrated in kilowatt-hours (kWh)
                </p>
              </div>

              {/* 4 Key Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Billing Cycle Total
                  </span>
                  <div className="text-xl font-bold mt-1 text-[#8AA8FF]">
                    {usage?.current_month_kwh || usageStats.total} kWh
                  </div>
                  <span className="text-[11px] text-[#6E737D]">Recorded aggregate</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Daily Average
                  </span>
                  <div className="text-xl font-bold mt-1 text-emerald-400">
                    {usage?.mean_consumption_kwh || usageStats.avg} kWh/d
                  </div>
                  <span className="text-[11px] text-[#6E737D]">30-day baseline</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Peak Daily Energy
                  </span>
                  <div className="text-xl font-bold mt-1 text-amber-400">
                    {usageStats.peak} kWh
                  </div>
                  <span className="text-[11px] text-[#6E737D]">Maximum registered draw</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs block ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Minimum Standby
                  </span>
                  <div className="text-xl font-bold mt-1 text-sky-400">
                    {usageStats.min} kWh
                  </div>
                  <span className="text-[11px] text-[#6E737D]">Off-peak baseline load</span>
                </div>
              </div>

              {/* Full Width Area Chart */}
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usage?.historical_daily_sample || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usageGradientFull" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? '#8AA8FF' : '#2B59FF'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isDark ? '#8AA8FF' : '#2B59FF'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#292C32' : '#F0F2F5'} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={isDark ? '#6E737D' : '#8C95A6'}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#6E737D' : '#8C95A6'}
                      fontSize={11}
                      tickLine={false}
                      unit=" kWh"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#141619' : '#FFFFFF',
                        borderColor: isDark ? '#292C32' : '#E2E5E9',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: isDark ? '#F3F4F5' : '#0F141C',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="kwh"
                      name="Daily Energy (kWh)"
                      stroke={isDark ? '#8AA8FF' : '#2B59FF'}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#usageGradientFull)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Provenance & Institutional Guidance */}
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                  isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8]' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>
                    Understanding Your Smart Meter Interval Readings:
                  </span>
                </div>
                <p>
                  Readings are transmitted through smart digital meter interval registers calibrated in kilowatt-hours (kWh). Historical consumption trends help consumers identify seasonal surges, baseline standby loads, and peak energy periods. Internal utility vigilance metrics, predictive algorithms, and physical inspection scheduling remain strictly confidential to authorized utility squads.
                </p>
                <p className="text-[11px] text-[#6E737D]">
                  Demonstration Dataset Provenance: Account consumption profiles reflect benchmark State Electricity Board interval sequences.
                </p>
              </div>
            </div>

            {/* Granular Interval Readings Ledger */}
            {usage?.historical_daily_sample && usage.historical_daily_sample.length > 0 && (
              <div
                className={`rounded-2xl border overflow-hidden transition-colors ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
                }`}
              >
                <div className="p-5 border-b border-inherit">
                  <h3 className="text-sm font-bold tracking-tight">Recent Daily Interval Log</h3>
                  <p className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Logged smart electronic meter readings for the active billing cycle
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={isDark ? 'bg-[#0B0C0E] text-[#9A9FA8]' : 'bg-slate-50 text-[#525866]'}>
                      <tr>
                        <th className="py-3 px-4 font-semibold">Reading Date</th>
                        <th className="py-3 px-4 font-semibold">Units Consumed (kWh)</th>
                        <th className="py-3 px-4 font-semibold">Variance vs Average</th>
                        <th className="py-3 px-4 font-semibold">Transmission Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      {usage.historical_daily_sample.slice(-15).reverse().map((entry) => {
                        const variance = usageStats.avg > 0 ? ((entry.kwh - usageStats.avg) / usageStats.avg) * 100 : 0;
                        const isHigh = variance > 10;
                        return (
                          <tr
                            key={entry.date}
                            className={`transition-colors ${
                              isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-medium">{entry.date}</td>
                            <td className="py-3 px-4 font-semibold">{entry.kwh} kWh</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                                isHigh ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {isHigh ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{variance > 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#6E737D]">
                              Verified Digital Reading
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: BILLS & PAYMENT INFO
           ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6" data-tour="consumer-billing-section">
            {/* Current Active Bill Highlight */}
            {currentBill ? (
              <div
                className={`p-6 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-inherit">
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase text-[#8AA8FF]">
                      Active Electricity Statement
                    </span>
                    <h2 className="text-xl font-bold font-mono tracking-tight mt-1">
                      {currentBill.bill_number}
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      Billing Period: {currentBill.billing_period_start} to {currentBill.billing_period_end}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 ${
                        currentBill.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : currentBill.status === 'OVERDUE'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {currentBill.status}
                    </span>
                    <div className="text-3xl font-extrabold text-[#2B59FF] dark:text-[#8AA8FF]">
                      ₹{currentBill.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      Payment Due Date: <strong>{currentBill.due_date}</strong>
                    </div>
                  </div>
                </div>

                {/* Bill Breakdown Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>Energy Consumed</span>
                    <div className="text-base font-bold mt-1">{currentBill.units_consumed_kwh} kWh</div>
                    <div className="text-[11px] text-[#6E737D] mt-0.5">Calculated from net meter recording</div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>Tariff Category</span>
                    <div className="text-base font-bold mt-1">{profile?.tariff_category || 'DOMESTIC'}</div>
                    <div className="text-[11px] text-[#6E737D] mt-0.5">Regulatory approved slab structure</div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>Receipt / Clearance Date</span>
                    <div className="text-base font-bold mt-1">
                      {currentBill.paid_at ? new Date(currentBill.paid_at).toLocaleDateString() : 'Pending Remittance'}
                    </div>
                    <div className="text-[11px] text-[#6E737D] mt-0.5">Recorded in utility billing ledger</div>
                  </div>
                </div>

                {/* Official Remittance Channels */}
                <div
                  className={`mt-6 p-4 rounded-xl border text-xs space-y-2 ${
                    isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8]' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-[#8AA8FF]">
                    <CreditCard className="w-4 h-4" />
                    <span>Official Electricity Board Payment Channels</span>
                  </div>
                  <p className="leading-relaxed">
                    Electricity dues may be remitted through official utility-authorized payment counters, designated nationalized bank branches, and certified Bharat Bill Payment System (BBPS) providers using your 12-digit Consumer ID.
                  </p>
                  <p className="text-[11px] text-[#6E737D]">
                    Note: Direct credit card simulation is disabled on this informational portal to protect transaction integrity.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`p-8 text-center rounded-2xl border ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
                }`}
              >
                <FileText className="w-8 h-8 text-[#9A9FA8] mx-auto mb-2" />
                <h3 className="font-semibold text-sm">No Active Bill Available</h3>
                <p className="text-xs text-[#6E737D] mt-1">Your meter is current for this billing cycle.</p>
              </div>
            )}

            {/* Past Invoices Table */}
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div className="p-5 border-b border-inherit">
                <h3 className="text-sm font-bold tracking-tight">Billing & Statement History</h3>
                <p className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                  Historical utility statements issued to this consumer account
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={isDark ? 'bg-[#0B0C0E] text-[#9A9FA8]' : 'bg-slate-50 text-[#525866]'}>
                    <tr>
                      <th className="py-3 px-4 font-semibold">Bill Number</th>
                      <th className="py-3 px-4 font-semibold">Billing Period</th>
                      <th className="py-3 px-4 font-semibold">Units (kWh)</th>
                      <th className="py-3 px-4 font-semibold">Amount (₹)</th>
                      <th className="py-3 px-4 font-semibold">Due Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {bills.map((b) => (
                      <tr
                        key={b.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold">{b.bill_number}</td>
                        <td className="py-3 px-4 text-[#6E737D]">
                          {b.billing_period_start} – {b.billing_period_end}
                        </td>
                        <td className="py-3 px-4 font-medium">{b.units_consumed_kwh}</td>
                        <td className="py-3 px-4 font-bold">
                          ₹{b.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">{b.due_date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              b.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : b.status === 'OVERDUE'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: SERVICE & GRIEVANCES (ISSUE REPORTING)
           ========================================================================= */}
        {activeTab === 'issues' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-tour="consumer-issues-section">
            {/* Form Column */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div>
                <h2 className="text-base font-bold tracking-tight">Lodge a Service Request</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                  Submit an official grievance regarding meter display, billing disputes, or grid power supply.
                </p>
              </div>

              {issueSuccessMessage && (
                <div
                  className="p-3.5 rounded-xl border text-xs flex items-start gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{issueSuccessMessage}</span>
                </div>
              )}

              {issueErrorMessage && (
                <div
                  className="p-3.5 rounded-xl border text-xs flex items-start gap-2 bg-red-500/10 border-red-500/30 text-red-400"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{issueErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleReportIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Issue Category
                  </label>
                  <select
                    value={issueCategory}
                    onChange={e => setIssueCategory(e.target.value)}
                    disabled={submittingIssue}
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-[#8AA8FF]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#2B59FF]'
                    }`}
                  >
                    <option value="METER_FAULT">Meter Reading / Display Fault</option>
                    <option value="BILLING_DISPUTE">Billing & Tariff Dispute</option>
                    <option value="VOLTAGE_FLUCTUATION">Voltage Fluctuation / Power Quality</option>
                    <option value="SUPPLY_OUTAGE">Service Connection / Power Outage</option>
                    <option value="SERVICE_REQUEST">General Inquiry / Service Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Subject / Summary
                  </label>
                  <input
                    type="text"
                    value={issueSubject}
                    onChange={e => setIssueSubject(e.target.value)}
                    required
                    disabled={submittingIssue}
                    placeholder="e.g. Digital meter LCD is flashing error code"
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-[#8AA8FF]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#2B59FF]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Detailed Description
                  </label>
                  <textarea
                    rows={4}
                    value={issueDescription}
                    onChange={e => setIssueDescription(e.target.value)}
                    required
                    disabled={submittingIssue}
                    placeholder="Provide specific details, observed dates, or meter display codes..."
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-colors focus:outline-hidden border ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] focus:border-[#8AA8FF]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#2B59FF]'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#2B59FF] hover:bg-[#1E45DB] text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingIssue ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Service Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Issues List Column */}
            <div
              className={`lg:col-span-2 rounded-2xl border p-6 space-y-4 transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold tracking-tight">Your Submitted Service Requests</h2>
                  <p className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Track resolution status and official utility board feedback notes
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#8AA8FF]/10 text-[#8AA8FF]">
                  {issues.length} Recorded
                </span>
              </div>

              {issues.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold">No Open Service Requests</p>
                  <p className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    You have not reported any active meter faults or billing discrepancies.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 transition-colors ${
                        isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#8AA8FF]">{item.ticket_number}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              item.status === 'RESOLVED' || item.status === 'CLOSED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : item.status === 'IN_PROGRESS'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6E737D]">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm">{item.subject}</h3>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                        {item.description}
                      </p>

                      {/* Official Response Notes */}
                      {item.response_notes && (
                        <div
                          className={`mt-2 p-3 rounded-lg border text-xs space-y-1 ${
                            isDark ? 'bg-[#141619] border-[#292C32] text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Official Board Resolution Remark</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">{item.response_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Notifications Drawer Modal */}
      {showNotificationsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowNotificationsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl transition-all animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] ${
              isDark
                ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]'
                : 'bg-white border-[#E2E5E9] text-[#0F141C]'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Account Notifications & Alerts</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time operational alerts for meter <span className="font-mono">{profile?.meter_number || 'SMART-MTR'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#292C32] text-[#9A9FA8]' : 'hover:bg-slate-100 text-[#525866]'
                }`}
                aria-label="Close notifications modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Quick Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0B0C0E] p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setNotifFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    notifFilter === 'all'
                      ? isDark
                        ? 'bg-[#1A1D21] text-white shadow-2xs'
                        : 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('unread')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    notifFilter === 'unread'
                      ? isDark
                        ? 'bg-[#1A1D21] text-white shadow-2xs'
                        : 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[16rem]">
              {(() => {
                const displayed = notifFilter === 'unread'
                  ? notifications.filter(n => !n.is_read)
                  : notifications;

                if (displayed.length === 0) {
                  return (
                    <div className="py-12 text-center space-y-2">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Bell className="w-5 h-5 opacity-60" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {notifFilter === 'unread' ? 'All caught up!' : 'No notifications received.'}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        {notifFilter === 'unread'
                          ? 'You have reviewed all current operational notifications.'
                          : 'Contextual updates regarding your smart meter and billing will appear here.'}
                      </p>
                      {notifFilter === 'unread' && notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setNotifFilter('all')}
                          className="text-xs text-indigo-500 font-semibold hover:underline pt-1 cursor-pointer"
                        >
                          View all notifications
                        </button>
                      )}
                    </div>
                  );
                }

                return displayed.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    isDark={isDark}
                    onMarkRead={handleMarkOneRead}
                    onNavigate={handleNotificationNavigate}
                  />
                ));
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts acknowledged'}
              </span>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Consumer Guided Tour Modal */}
      <ConsumerGuidedTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

