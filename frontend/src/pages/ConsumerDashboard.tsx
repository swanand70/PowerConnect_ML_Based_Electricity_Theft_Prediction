import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PowerConnectBrand } from '../components/common/PowerConnectLogo';
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  Activity,
  Send,
  Bell,
  LogOut,
  ChevronRight,
  ChevronDown,
  Zap,
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
  Compass,
  Download,
  Receipt,
  RefreshCw,
  Lock
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
  PaymentTransactionItem,
  VerifyPaymentResponse,
  ConsumerIssueItem,
  NotificationItem,
  BoardPostItem
} from '../types';

// Razorpay Checkout Script Dynamic Loader
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const ConsumerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'billing' | 'issues'>('overview');
  const [tourOpen, setTourOpen] = useState<boolean>(false);

  // Sync activeTab and selectedBillId from URL search parameters (?tab=billing&bill_id=117)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const billIdParam = searchParams.get('bill_id');

    if (tabParam === 'billing' || billIdParam) {
      setActiveTab('billing');
      if (billIdParam) {
        const parsed = parseInt(billIdParam, 10);
        if (!isNaN(parsed)) {
          setSelectedBillId(parsed);
        }
      }
    } else if (tabParam === 'usage') {
      setActiveTab('usage');
    } else if (tabParam === 'issues') {
      setActiveTab('issues');
    } else if (tabParam === 'overview') {
      setActiveTab('overview');
    }
  }, [searchParams]);

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
  const [billsError, setBillsError] = useState<string | null>(null);
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

  // Billing & Payment States
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [billTransactions, setBillTransactions] = useState<PaymentTransactionItem[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const isProcessingPaymentRef = useRef<boolean>(false);
  const rzpInstanceRef = useRef<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<VerifyPaymentResponse | null>(null);
  const [isDownloadingBillPdf, setIsDownloadingBillPdf] = useState<boolean>(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);

  // Function to reload bills cleanly
  const reloadBills = async () => {
    try {
      const data = await api.getMyBills();
      setBills(data || []);
      setBillsError(null);
    } catch (err: any) {
      setBillsError(err.message || 'Failed to load billing records from backend.');
    }
  };

  // Load consumer records from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setBillsError(null);

    Promise.all([
      api.getConsumerProfile().catch(() => null),
      api.getConsumerUsage().catch(() => null),
      api.getMyBills()
        .then((billsData) => {
          if (isMounted) {
            setBills(billsData || []);
            setBillsError(null);
          }
          return billsData;
        })
        .catch((bErr: any) => {
          if (isMounted) {
            setBills([]);
            setBillsError(bErr.message || 'Unable to retrieve billing records from the server.');
          }
          return [];
        }),
      api.getMyIssues().catch(() => []),
      api.getNotifications().catch(() => []),
      api.getBoardPosts().catch(() => [])
    ])
      .then(([profData, usageData, _billsData, issuesData, notifData, postsData]) => {
        if (!isMounted) return;
        setProfile(profData);
        setUsage(usageData);
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

    // Extract bill_id parameter if present
    let targetBillId: number | null = null;
    const billMatch = linkUrl.match(/[?&]bill_id=(\d+)/) || linkUrl.match(/\/bills\/(\d+)/);
    if (billMatch) {
      targetBillId = parseInt(billMatch[1], 10);
    }

    if (targetBillId || linkUrl.includes('/bills') || linkUrl.includes('BILL') || linkUrl.includes('billing') || linkUrl.includes('payment') || linkUrl.includes('consumer-portal')) {
      setActiveTab('billing');
      if (targetBillId) {
        setSelectedBillId(targetBillId);
        setSearchParams({ tab: 'billing', bill_id: String(targetBillId) });
      } else {
        setSearchParams({ tab: 'billing' });
      }
    }
    else if (linkUrl.includes('/issues')) {
      setActiveTab('issues');
      setSearchParams({ tab: 'issues' });
    }
    else if (linkUrl.includes('/usage')) {
      setActiveTab('usage');
      setSearchParams({ tab: 'usage' });
    }
    else if (linkUrl.includes('/updates') || linkUrl.includes('board-communication') || linkUrl.includes('announcement')) {
      navigate('/board-communication');
    }
    else if (linkUrl.includes('/account')) {
      setActiveTab('overview');
      setSearchParams({ tab: 'overview' });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Active or most relevant unpaid bill, falling back to latest bill
  const currentBill = useMemo(() => {
    const activeUnpaid = bills.find(b => b.status === 'PENDING' || b.status === 'PARTIALLY_PAID' || b.status === 'OVERDUE');
    return activeUnpaid || bills[0] || null;
  }, [bills]);

  // Selected bill for detailed payment and inspection
  const selectedBill = useMemo(() => {
    if (selectedBillId) {
      const found = bills.find(b => b.id === selectedBillId);
      if (found) return found;
      // If a specific bill ID was requested but is not in the consumer's bills list,
      // return null so that an explicit missing bill alert is shown
      return null;
    }
    return currentBill;
  }, [bills, selectedBillId, currentBill]);

  const isRequestedBillMissing = selectedBillId !== null && selectedBill === null && bills.length > 0;

  // Fetch transaction ledger when selected bill changes
  useEffect(() => {
    if (selectedBill?.id) {
      api.getBillPayments(selectedBill.id)
        .then(setBillTransactions)
        .catch(() => setBillTransactions([]));
    }
  }, [selectedBill?.id]);

  // Download Bill PDF Handler
  const handleDownloadBillPdf = async (billId: number, billNumber: string) => {
    try {
      setIsDownloadingBillPdf(true);
      const blob = await api.downloadBillPdf(billId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanNo = billNumber.replace(/\//g, '-').replace(/\s+/g, '_');
      a.download = `PowerConnect_Bill_${cleanNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download bill PDF.');
    } finally {
      setIsDownloadingBillPdf(false);
    }
  };

  // Download Payment Receipt PDF Handler
  const handleDownloadReceiptPdf = async (paymentId: number, receiptNumber: string) => {
    try {
      setDownloadingReceiptId(paymentId);
      const blob = await api.downloadPaymentReceiptPdf(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanNo = receiptNumber.replace(/\//g, '-').replace(/\s+/g, '_');
      a.download = `PowerConnect_Receipt_${cleanNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download payment receipt PDF.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  // Razorpay Checkout Trigger Handler
  const handleStartRazorpayPayment = async (bill: BillItem) => {
    // Guard against rapid duplicate clicks or concurrent checkout openings
    if (isProcessingPaymentRef.current || isProcessingPayment) {
      return;
    }

    setPaymentError(null);
    setPaymentSuccess(null);
    const outstanding = bill.outstanding_amount_inr ?? bill.amount_inr;
    const trimmed = paymentAmount.trim();

    if (!trimmed) {
      setPaymentError('Please enter a payment amount.');
      return;
    }

    const numAmount = parseFloat(trimmed);
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (numAmount < 1.0) {
      setPaymentError('Minimum payable amount is ₹1.00 (100 paise).');
      return;
    }
    if (numAmount > outstanding) {
      setPaymentError(`Entered amount (₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) exceeds outstanding balance of ₹${outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`);
      return;
    }
    const decimalParts = trimmed.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setPaymentError('Payment amount cannot have more than 2 decimal places.');
      return;
    }

    isProcessingPaymentRef.current = true;
    setIsProcessingPayment(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      isProcessingPaymentRef.current = false;
      setIsProcessingPayment(false);
      setPaymentError('Failed to load secure Razorpay checkout gateway. Please check your internet connection.');
      return;
    }

    try {
      // Safely close any previously open instance
      if (rzpInstanceRef.current) {
        try {
          rzpInstanceRef.current.close();
        } catch (_) {}
        rzpInstanceRef.current = null;
      }

      // Generate stable idempotency key to prevent duplicate order creation on server
      const idempotencyKey = `idem_${bill.id}_${Math.round(numAmount * 100)}`;
      const orderData = await api.createPaymentOrder(bill.id, numAmount, idempotencyKey);

      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency,
        name: 'PowerConnect Utilities',
        description: `Electricity Statement #${orderData.bill_number}`,
        order_id: orderData.order_id,
        prefill: {
          name: orderData.consumer_name,
          email: orderData.consumer_email,
          contact: orderData.consumer_phone
            ? (orderData.consumer_phone.startsWith('+91')
                ? orderData.consumer_phone
                : `+91${orderData.consumer_phone.replace(/\D/g, '')}`)
            : '+919876543210'
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI / QR',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr', 'intent', 'collect']
                  }
                ]
              }
            },
            sequence: ['block.upi'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        notes: {
          bill_id: String(orderData.bill_id),
          bill_number: orderData.bill_number,
          receipt_number: orderData.receipt_number
        },
        theme: {
          color: isDark ? '#2B59FF' : '#1D4ED8'
        },
        handler: async function (response: any) {
          try {
            const verifyPayload = {
              bill_id: orderData.bill_id,
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };
            const verifyResult = await api.verifyPayment(verifyPayload);
            setPaymentSuccess(verifyResult);
            setPaymentAmount('');

            // Refresh bills list
            const freshBills = await api.getMyBills();
            setBills(freshBills);

            // Refresh transactions for this bill
            const freshTxns = await api.getBillPayments(bill.id);
            setBillTransactions(freshTxns);

            // Refresh notifications
            api.getNotifications().then(setNotifications).catch(() => {});
          } catch (err: any) {
            setPaymentError(err.message || 'Payment verification failed at server. Please contact billing support.');
          } finally {
            isProcessingPaymentRef.current = false;
            setIsProcessingPayment(false);
            rzpInstanceRef.current = null;
          }
        },
        modal: {
          ondismiss: function () {
            isProcessingPaymentRef.current = false;
            setIsProcessingPayment(false);
            rzpInstanceRef.current = null;
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzpInstanceRef.current = rzp;
      rzp.on('payment.failed', function (resp: any) {
        isProcessingPaymentRef.current = false;
        setIsProcessingPayment(false);
        rzpInstanceRef.current = null;
        setPaymentError(resp.error?.description || 'Payment was declined or cancelled at checkout.');
      });
      rzp.open();
    } catch (err: any) {
      isProcessingPaymentRef.current = false;
      setIsProcessingPayment(false);
      rzpInstanceRef.current = null;
      setPaymentError(err.message || 'Failed to create payment order with server.');
    }
  };

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
          <PowerConnectBrand
            descriptor="Consumer Services & Billing Portal"
            badge="Consumer Portal"
            linkTo="/"
            size="md"
          />

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Consumer Account Badge */}
            <div className="hidden sm:flex flex-col text-right pr-1">
              <span className="text-xs font-semibold">{profile?.name || user?.full_name || 'Consumer User'}</span>
              <span className={`text-[11px] font-medium tabular-nums ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
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
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold tabular-nums ${
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
                    <strong className="tabular-nums font-semibold">{profile?.consumer_no || 'N/A'}</strong>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-slate-500'}`}>Smart Meter</span>
                    <strong className="tabular-nums font-semibold">{profile?.meter_number || 'SMART-001'}</strong>
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

              {/* Technical Supply Specifications (Collapsible Connection Details) */}
              <details className="group pt-3 border-t border-inherit">
                <summary className="flex items-center justify-between text-xs font-semibold cursor-pointer select-none text-slate-500 hover:text-slate-700 dark:text-[#9A9FA8] dark:hover:text-[#F3F4F5] transition-colors py-1">
                  <span>Connection & Technical Specifications</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                </summary>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
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
                    <span className={`block text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-[#717784]'}`}>Meter Infrastructure</span>
                    <span className="font-semibold text-sm flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Bidirectional AMR</span>
                    </span>
                  </div>
                </div>
              </details>
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
                          : currentBill?.status === 'PARTIALLY_PAID'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : currentBill?.status === 'OVERDUE'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {currentBill?.status === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : (currentBill?.status || 'NO ACTIVE BILL')}
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    ₹{currentBill ? (currentBill.outstanding_amount_inr ?? currentBill.amount_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                  {currentBill && currentBill.paid_amount_inr !== undefined && currentBill.paid_amount_inr > 0 ? (
                    <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                      ₹{currentBill.paid_amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} settled of ₹{currentBill.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  ) : null}

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

                <div className="pt-5 mt-4 border-t border-inherit flex items-center gap-2">
                  {currentBill && (currentBill.outstanding_amount_inr ?? currentBill.amount_inr) > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBillId(currentBill.id);
                        setActiveTab('billing');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#2B59FF] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </button>
                  ) : (
                    <div className="flex-1 text-xs text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1.5 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>All dues cleared</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (currentBill) setSelectedBillId(currentBill.id);
                      setActiveTab('billing');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? 'border-[#292C32] bg-[#0B0C0E] hover:bg-[#1A1D21] text-[#9A9FA8] hover:text-[#F3F4F5]'
                        : 'border-[#E2E5E9] bg-slate-50 hover:bg-slate-100 text-[#525866] hover:text-[#0F141C]'
                    }`}
                  >
                    <span>Breakdown</span>
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
                    <AreaChart data={usage.historical_daily_sample} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                        width={45}
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
                  <AreaChart data={usage?.historical_daily_sample || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                      width={45}
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

              {/* Energy Usage Guidance */}
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                  isDark ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8]' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>
                    Understanding Your Meter Readings:
                  </span>
                </div>
                <p>
                  Readings are recorded daily from your digital electronic meter in kilowatt-hours (kWh). Tracking your regular usage helps identify peak consumption hours, lower baseline standby load, and improve monthly energy efficiency.
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
                            <td className="py-3 px-4 font-medium tabular-nums">{entry.date}</td>
                            <td className="py-3 px-4 font-semibold tabular-nums">{entry.kwh} kWh</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 font-medium tabular-nums text-[11px] ${
                                isHigh ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
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
            TAB 3: BILLS & PAYMENT INFO (Razorpay Integration & Professional Invoices)
           ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6" data-tour="consumer-billing-section">
            {/* Payment Success Alert */}
            {paymentSuccess && (
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Payment Verified & Settled Successfully</h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      Payment of <strong>₹{paymentSuccess.amount_paid_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> recorded against Receipt <span className="tabular-nums font-semibold">{paymentSuccess.receipt_number}</span>.
                      {paymentSuccess.is_fully_paid ? ' Your bill is now completely paid!' : ` Remaining outstanding balance: ₹${paymentSuccess.new_outstanding_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadReceiptPdf(paymentSuccess.payment_id, paymentSuccess.receipt_number)}
                    disabled={downloadingReceiptId === paymentSuccess.payment_id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {downloadingReceiptId === paymentSuccess.payment_id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Receipt className="w-3.5 h-3.5" />
                    )}
                    <span>Download Receipt PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSuccess(null)}
                    className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-xs opacity-70 hover:opacity-100 cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bills Loading Error Alert */}
            {billsError && (
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isDark ? 'bg-red-950/30 border-red-500/40 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs">Error Loading Billing Statements</h4>
                    <p className="text-[11px] opacity-90 mt-0.5">{billsError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reloadBills}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {/* Requested Bill Missing / Stale Notification Alert */}
            {isRequestedBillMissing && (
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isDark ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs">Requested Bill Not Available</h4>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      The bill referenced in your link or alert (Bill ID #{selectedBillId}) does not belong to this meter account or has been updated.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBillId(null);
                    setSearchParams({ tab: 'billing' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                >
                  View Active Statement
                </button>
              </div>
            )}

            {/* Current Active / Selected Bill Card */}
            {selectedBill ? (
              <div
                className={`p-6 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
                }`}
              >
                {/* Header: Bill Ref, Due Date & Download PDF Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-inherit">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-wider uppercase text-[#8AA8FF]">
                        {selectedBill.id === bills[0]?.id ? 'Active Electricity Statement' : 'Statement Details'}
                      </span>
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          selectedBill.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : selectedBill.status === 'PARTIALLY_PAID'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : selectedBill.status === 'OVERDUE'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {selectedBill.status === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : selectedBill.status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold font-mono tracking-tight mt-1">
                      {selectedBill.bill_number}
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                      Billing Period: {selectedBill.billing_period_start} to {selectedBill.billing_period_end}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadBillPdf(selectedBill.id, selectedBill.bill_number)}
                      disabled={isDownloadingBillPdf}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isDark
                          ? 'border-[#292C32] bg-[#0B0C0E] hover:bg-[#1A1D21] text-[#F3F4F5]'
                          : 'border-[#E2E5E9] bg-slate-50 hover:bg-slate-100 text-[#0F141C] shadow-2xs'
                      } disabled:opacity-50`}
                      title="Download Official PDF Invoice"
                    >
                      {isDownloadingBillPdf ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#8AA8FF]" />
                      ) : (
                        <Download className="w-4 h-4 text-[#8AA8FF]" />
                      )}
                      <span>Download PDF Bill</span>
                    </button>
                    <span className={`text-[11px] ${isDark ? 'text-[#6E737D]' : 'text-[#717784]'}`}>
                      Payment Due Date: <strong className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>{selectedBill.due_date}</strong>
                    </span>
                  </div>
                </div>

                {/* Core Financial Accounting Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
                  {/* Metric 1: Original Bill Amount */}
                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>Original Bill Amount</span>
                    <div className="text-xl font-bold tabular-nums mt-1">
                      ₹{selectedBill.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-[#6E737D] mt-0.5">Energy charge + regulatory tariff</div>
                  </div>

                  {/* Metric 2: Paid to Date */}
                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}>Total Settled to Date</span>
                    <div className="text-xl font-bold tabular-nums mt-1 text-emerald-600 dark:text-emerald-400">
                      ₹{(selectedBill.paid_amount_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-[#6E737D] mt-0.5">Verified gateway remittances</div>
                  </div>

                  {/* Metric 3: Remaining Amount Due */}
                  <div
                    className={`p-4 rounded-xl border ${
                      (selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr) > 0
                        ? isDark
                          ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                          : 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : isDark
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <span className="font-semibold text-[11px]">Outstanding Balance Due</span>
                    <div className="text-2xl font-extrabold tabular-nums mt-1">
                      ₹{(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr) <= 0
                        ? 'Account fully reconciled'
                        : `Payable by ${selectedBill.due_date}`}
                    </div>
                  </div>
                </div>

                {/* Partial Payment Terminal or Fully Settled Notice */}
                {(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr) > 0 ? (
                  <div
                    className={`mt-6 p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#8AA8FF]" />
                          <span>Flexible Bill Payment (Partial or Full)</span>
                        </h3>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                          You may pay the full balance or enter any smaller partial amount (minimum ₹1.00). Secured by Razorpay Standard Checkout.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>256-Bit SSL Encrypted</span>
                      </div>
                    </div>

                    {/* Amount Input & Quick Shortcuts */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="1.00"
                            max={selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr}
                            placeholder={`e.g. ${(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr).toFixed(2)}`}
                            value={paymentAmount}
                            onChange={(e) => {
                              setPaymentAmount(e.target.value);
                              setPaymentError(null);
                            }}
                            className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-semibold tabular-nums transition-all outline-hidden ${
                              isDark
                                ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5] focus:border-[#8AA8FF] focus:ring-1 focus:ring-[#8AA8FF]'
                                : 'bg-white border-[#E2E5E9] text-[#0F141C] focus:border-[#2B59FF] focus:ring-1 focus:ring-[#2B59FF]'
                            }`}
                          />
                        </div>

                        {/* Pay with Razorpay Button */}
                        <button
                          type="button"
                          onClick={() => handleStartRazorpayPayment(selectedBill)}
                          disabled={isProcessingPayment}
                          className="px-5 py-2.5 rounded-xl bg-[#2B59FF] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                        >
                          {isProcessingPayment ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Opening Razorpay Checkout...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              <span>
                                Pay {paymentAmount && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) > 0 ? `₹${parseFloat(paymentAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'with Razorpay'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Quick Amount Selection Shortcuts */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`text-[11px] font-medium mr-1 ${isDark ? 'text-[#6E737D]' : 'text-[#717784]'}`}>
                          Quick Shortcuts:
                        </span>
                        {/* Full Payment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount(String(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr));
                            setPaymentError(null);
                          }}
                          className={`px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors cursor-pointer ${
                            isDark
                              ? 'border-[#292C32] bg-[#141619] hover:bg-[#1A1D21] text-[#8AA8FF]'
                              : 'border-[#E2E5E9] bg-white hover:bg-slate-100 text-[#2B59FF]'
                          }`}
                        >
                          Pay Full (₹{(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                        </button>
                        {/* ₹100 Partial Shortcut */}
                        {(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr) >= 100 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentAmount('100.00');
                              setPaymentError(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors cursor-pointer ${
                              isDark
                                ? 'border-[#292C32] bg-[#141619] hover:bg-[#1A1D21] text-[#F3F4F5]'
                                : 'border-[#E2E5E9] bg-white hover:bg-slate-100 text-[#0F141C]'
                            }`}
                          >
                            ₹100
                          </button>
                        )}
                        {/* ₹500 Partial Shortcut */}
                        {(selectedBill.outstanding_amount_inr ?? selectedBill.amount_inr) >= 500 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentAmount('500.00');
                              setPaymentError(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors cursor-pointer ${
                              isDark
                                ? 'border-[#292C32] bg-[#141619] hover:bg-[#1A1D21] text-[#F3F4F5]'
                                : 'border-[#E2E5E9] bg-white hover:bg-slate-100 text-[#0F141C]'
                            }`}
                          >
                            ₹500
                          </button>
                        )}
                      </div>

                      {/* Error Message */}
                      {paymentError && (
                        <div
                          className="p-3 rounded-xl border text-xs flex items-center gap-2 bg-red-500/10 border-red-500/30 text-red-400"
                          role="alert"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{paymentError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 rounded-xl border flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>This electricity statement has been completely settled. No outstanding payment is due.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadBillPdf(selectedBill.id, selectedBill.bill_number)}
                      className="text-xs underline hover:no-underline font-bold text-emerald-300 cursor-pointer"
                    >
                      Download Settled Statement PDF
                    </button>
                  </div>
                )}

                {/* Compact Expandable Payment Receipts & Remittance History */}
                {billTransactions.length > 0 && (
                  <details className="mt-6 border border-slate-200 dark:border-[#292C32] rounded-xl overflow-hidden group">
                    <summary className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer bg-slate-50/70 dark:bg-[#181B1F] hover:bg-slate-100/70 dark:hover:bg-[#1E2227] transition-colors select-none">
                      <div className="flex items-center gap-2.5">
                        <Receipt className="w-4 h-4 text-blue-600 dark:text-[#8AA8FF]" />
                        <span className="text-xs font-bold text-slate-800 dark:text-[#F3F4F5]">
                          Payment Receipts & Remittance History
                        </span>
                        <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-[#8AA8FF] border border-blue-200 dark:border-blue-900/40">
                          {billTransactions.length} {billTransactions.length === 1 ? 'record' : 'records'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#9A9FA8]">
                        <span className="text-[11px] group-open:hidden">View receipts</span>
                        <span className="text-[11px] hidden group-open:inline">Hide receipts</span>
                        <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" />
                      </div>
                    </summary>

                    <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#292C32] bg-white dark:bg-[#141619] overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className={isDark ? 'bg-[#0B0C0E] text-[#9A9FA8]' : 'bg-slate-50 text-[#525866]'}>
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Receipt Number</th>
                            <th className="py-2.5 px-3 font-semibold">Amount</th>
                            <th className="py-2.5 px-3 font-semibold">Payment Mode</th>
                            <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                            <th className="py-2.5 px-3 font-semibold">Status</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Official Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#202328]">
                          {billTransactions.map((t) => (
                            <tr
                              key={t.id}
                              className={`transition-colors ${
                                isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-medium">{t.receipt_number}</td>
                              <td className="py-2.5 px-3 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                ₹{t.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 capitalize text-[#6E737D]">{t.payment_method || 'Online / NetBanking'}</td>
                              <td className="py-2.5 px-3 text-[#6E737D] tabular-nums">
                                {t.verified_at ? new Date(t.verified_at).toLocaleString() : new Date(t.created_at).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    t.status === 'SUCCESS'
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : t.status === 'FAILED'
                                      ? 'bg-red-500/10 text-red-400'
                                      : 'bg-amber-500/10 text-amber-400'
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {t.status === 'SUCCESS' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadReceiptPdf(t.id, t.receipt_number)}
                                    disabled={downloadingReceiptId === t.id}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-[#8AA8FF] hover:underline cursor-pointer disabled:opacity-50"
                                  >
                                    {downloadingReceiptId === t.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Receipt className="w-3 h-3" />
                                    )}
                                    <span>Download PDF</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-[#6E737D]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div
                className={`p-8 text-center rounded-2xl border ${
                  isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9]'
                }`}
              >
                <FileText className="w-8 h-8 text-[#9A9FA8] mx-auto mb-2" />
                <h3 className="font-semibold text-sm">
                  {bills.length === 0 ? 'No Bills Issued Yet' : 'No Active Bill Selected'}
                </h3>
                <p className="text-xs text-[#6E737D] mt-1">
                  {bills.length === 0
                    ? 'No bills have been issued for this account. Your meter account is current.'
                    : 'Select any statement from the ledger below to review breakdown, pay balance, or download official PDF.'}
                </p>
              </div>
            )}

            {/* Past Invoices & Statements Table */}
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-white border-[#E2E5E9] shadow-2xs'
              }`}
            >
              <div className="p-5 border-b border-inherit flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Billing & Statement Ledger</h3>
                  <p className={`text-xs ${isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'}`}>
                    Historical electricity statements issued to this consumer account
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={isDark ? 'bg-[#0B0C0E] text-[#9A9FA8]' : 'bg-slate-50 text-[#525866]'}>
                    <tr>
                      <th className="py-3 px-4 font-semibold">Bill Number</th>
                      <th className="py-3 px-4 font-semibold">Billing Period</th>
                      <th className="py-3 px-4 font-semibold">Units (kWh)</th>
                      <th className="py-3 px-4 font-semibold">Amount (₹)</th>
                      <th className="py-3 px-4 font-semibold">Paid (₹)</th>
                      <th className="py-3 px-4 font-semibold">Balance Due (₹)</th>
                      <th className="py-3 px-4 font-semibold">Due Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {bills.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                          {billsError ? 'Unable to load bills due to a server connection issue.' : 'No bills have been issued for this account.'}
                        </td>
                      </tr>
                    ) : (
                      bills.map((b) => {
                        const outstanding = b.outstanding_amount_inr ?? (b.status === 'PAID' ? 0 : b.amount_inr);
                        const isSelected = selectedBill?.id === b.id;
                        return (
                          <tr
                            key={b.id}
                            onClick={() => {
                              setSelectedBillId(b.id);
                              setSearchParams({ tab: 'billing', bill_id: String(b.id) });
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? isDark ? 'bg-[#1A1D21]/80 ring-1 ring-inset ring-indigo-500/30' : 'bg-blue-50/70 ring-1 ring-inset ring-blue-500/30'
                                : isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
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
                            <td className="py-3 px-4 tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                              ₹{(b.paid_amount_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 tabular-nums font-bold">
                              ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4">{b.due_date}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  b.status === 'PAID'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : b.status === 'PARTIALLY_PAID'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : b.status === 'OVERDUE'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {b.status === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : b.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBillId(b.id);
                                    setSearchParams({ tab: 'billing', bill_id: String(b.id) });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:underline cursor-pointer"
                                  title="View Statement Details"
                                >
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadBillPdf(b.id, b.bill_number)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8AA8FF] hover:underline cursor-pointer"
                                  title="Download PDF Statement"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                                {outstanding > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBillId(b.id);
                                      setSearchParams({ tab: 'billing', bill_id: String(b.id) });
                                      setPaymentAmount(String(outstanding));
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-[#2B59FF] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer"
                                  >
                                    <span>Pay</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
                <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-[#8AA8FF]/10 text-[#8AA8FF]">
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

