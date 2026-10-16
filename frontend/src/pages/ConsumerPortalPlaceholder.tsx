import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PublicFooter } from '../components/layout/PublicFooter';
import { Users, ArrowLeft, ArrowRight, Clock, ShieldCheck, Zap, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ConsumerPortalPlaceholder: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#0B0C0E] text-[#F3F4F5] selection:bg-[#8AA8FF]/20 selection:text-[#F3F4F5]'
          : 'bg-[#F8F9FA] text-[#0F141C] selection:bg-[#2B59FF]/20 selection:text-[#0F141C]'
      }`}
    >
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full flex flex-col justify-center">
        {/* Status Chip */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold self-start mb-6 border ${
            isDark
              ? 'bg-[#8AA8FF]/10 border-[#8AA8FF]/30 text-[#8AA8FF]'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Phase 5 Module • Scheduled Release</span>
        </div>

        {/* Header Block */}
        <div
          className={`rounded-xl p-6 sm:p-8 shadow-xs border transition-colors ${
            isDark
              ? 'bg-[#141619] border-[#292C32]'
              : 'bg-white border-[#E2E5E9]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${
              isDark
                ? 'bg-[#0B0C0E] border-[#292C32] text-[#8AA8FF]'
                : 'bg-[#F4F5F7] border-[#E2E5E9] text-[#2B59FF]'
            }`}
          >
            <Users className="w-6 h-6" />
          </div>

          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
            }`}
          >
            Consumer Services Portal
          </h1>
          <p
            className={`text-sm mt-2 leading-relaxed ${
              isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
            }`}
          >
            The dedicated digital interface for electricity consumers to monitor energy consumption, inspect monthly billing statements, and submit service inquiries.
          </p>

          <div
            className={`my-6 p-5 rounded-lg space-y-3 border ${
              isDark
                ? 'bg-[#0B0C0E] border-[#292C32]'
                : 'bg-[#F8F9FA] border-[#E2E5E9]'
            }`}
          >
            <h2
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
              }`}
            >
              Upcoming Phase 5 Consumer Features:
            </h2>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${
                isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Zap className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                <span>
                  <strong className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>Usage Analytics:</strong> Daily smart meter kWh curves and comparison with historical consumption.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                <span>
                  <strong className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>Billing & Invoices:</strong> Itemized tariff charges, energy duties, due dates, and payment history.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                <span>
                  <strong className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>Grievance Redressal:</strong> Register metering disputes, voltage complaints, or service requests.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                <span>
                  <strong className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>Outage Alerts:</strong> Feeder-level scheduled maintenance updates and emergency supply alerts.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-xs ${
                isDark
                  ? 'bg-[#F3F4F5] hover:bg-white text-[#0B0C0E]'
                  : 'bg-[#0F141C] hover:bg-black text-white'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Portal</span>
            </Link>
            <Link
              to="/login"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors border ${
                isDark
                  ? 'bg-[#1A1D21] hover:bg-[#22262B] text-[#F3F4F5] border-[#292C32] hover:border-[#3E434D]'
                  : 'bg-white hover:bg-[#F4F5F7] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8]'
              }`}
            >
              <span>Employee Sign In</span>
              <ArrowRight className={`w-4 h-4 ${isDark ? 'text-[#9A9FA8]' : 'text-[#717784]'}`} />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
