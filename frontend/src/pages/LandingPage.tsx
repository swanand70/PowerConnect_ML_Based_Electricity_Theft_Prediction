import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PublicFooter } from '../components/layout/PublicFooter';
import {
  Users,
  Shield,
  Building2,
  ArrowRight,
  ArrowDown,
  Calendar,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import type { BoardPostItem } from '../types';
import { AtmosphericBackground } from '../components/common/AtmosphericBackground';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [recentUpdates, setRecentUpdates] = useState<BoardPostItem[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState<boolean>(true);
  const [selectedPost, setSelectedPost] = useState<BoardPostItem | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    api.getBoardPosts()
      .then(posts => {
        setRecentUpdates((posts || []).slice(0, 3));
      })
      .catch(() => {
        setRecentUpdates([]);
      })
      .finally(() => setUpdatesLoading(false));
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerHeight = 64; // height of sticky header
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const formatCategory = (cat: string) => {
    switch (cat) {
      case 'ENERGY_SAVING': return 'Energy Saving';
      case 'ENFORCEMENT_UPDATE': return 'Enforcement Update';
      case 'MAINTENANCE': return 'Grid Maintenance';
      case 'POLICY': return 'Board Policy';
      default: return cat.replace('_', ' ');
    }
  };

  const getCategoryColor = (cat: string) => {
    if (isDark) {
      switch (cat) {
        case 'ENERGY_SAVING': return 'bg-[#8AA8FF]/10 text-[#8AA8FF] border-[#8AA8FF]/30';
        case 'ENFORCEMENT_UPDATE': return 'bg-amber-400/10 text-amber-300 border-amber-400/30';
        case 'MAINTENANCE': return 'bg-sky-400/10 text-sky-300 border-sky-400/30';
        case 'POLICY': return 'bg-purple-400/10 text-purple-300 border-purple-400/30';
        default: return 'bg-[#1A1D21] text-[#9A9FA8] border-[#292C32]';
      }
    } else {
      switch (cat) {
        case 'ENERGY_SAVING': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'ENFORCEMENT_UPDATE': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'MAINTENANCE': return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'POLICY': return 'bg-purple-50 text-purple-700 border-purple-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#0B0C0E] text-[#F3F4F5] selection:bg-[#8AA8FF]/20 selection:text-[#F3F4F5]'
          : 'bg-[#F8F9FA] text-[#0F141C] selection:bg-[#2B59FF]/20 selection:text-[#0F141C]'
      }`}
    >
      {/* 1. Header with PowerConnect Branding & Theme Toggle */}
      <PublicHeader />

      <main className="flex-1">
        {/* 2. Hero Section: Dedicated Initial Viewport with Local Electricity Infrastructure Background (Permanently Dark Cinematic) */}
        <section
          className="relative min-h-[calc(100vh-4rem)] flex items-center border-b border-[#292C32] bg-[#0B0C0E] text-[#F3F4F5] overflow-hidden"
          style={{
            backgroundImage: "url('/images/power-grid.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Permanent Dark Cinematic Directional Gradient Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#0B0C0E]/75 via-[#0B0C0E]/85 to-[#0B0C0E] pointer-events-none"
            aria-hidden="true"
          />

          {/* Atmospheric Indigo/Violet Light Trails & Luminous Accents */}
          <AtmosphericBackground intensity="medium" className="opacity-70" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-24 lg:py-28">
            <div className="max-w-3xl space-y-6 text-left">
              {/* Main Heading: Confident, Large Typography */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#F3F4F5] tracking-tight leading-[1.12]">
                Better Electricity Services.
                <br />
                <span>Smarter Grid Operations.</span>
              </h1>

              {/* Supporting Statement */}
              <p className="text-base sm:text-lg lg:text-xl text-[#9A9FA8] max-w-2xl leading-relaxed">
                A unified digital gateway for consumers, utility employees and official board updates.
              </p>

              {/* Hero Actions: Clear Primary & Secondary Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => scrollToSection('portals')}
                  className="inline-flex items-center justify-center gap-2 bg-[#F3F4F5] hover:bg-white text-[#0B0C0E] text-sm font-semibold px-6 py-3 rounded-lg shadow-xs transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#8AA8FF]/60"
                >
                  <span>Explore Services</span>
                  <ArrowDown className="w-4 h-4 text-[#0B0C0E]" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('updates')}
                  className="inline-flex items-center justify-center gap-2 bg-[#141619] hover:bg-[#1A1D21] text-[#F3F4F5] text-sm font-semibold px-6 py-3 rounded-lg border border-[#292C32] hover:border-[#3E434D] transition-colors cursor-pointer shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#8AA8FF]/40"
                >
                  <span>View Official Updates</span>
                  <ArrowRight className="w-4 h-4 text-[#9A9FA8]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Three Portal Entry Points: Dedicated Full-Viewport Destination */}
        <section
          id="portals"
          className={`relative scroll-mt-16 min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 lg:py-0 border-b overflow-hidden transition-colors duration-200 ${
            isDark
              ? 'bg-[#0B0C0E] border-[#292C32]'
              : 'bg-[#F8F9FA] border-[#E2E5E9]'
          }`}
        >
          <AtmosphericBackground
            intensity="subtle"
            showRays={false}
            className={isDark ? 'opacity-30' : 'opacity-10'}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 lg:py-12">
            <div className="mb-8 lg:mb-10 text-left">
              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                }`}
              >
                Choose Your Portal
              </h2>
              <p
                className={`text-sm sm:text-base mt-2 ${
                  isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                }`}
              >
                Access the services relevant to you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* PORTAL 1: Consumer Portal */}
              <div
                className={`rounded-xl p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between border ${
                  isDark
                    ? 'bg-[#141619]/95 backdrop-blur-xs border-[#292C32] hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-950/20'
                    : 'bg-white/95 backdrop-blur-xs border-[#E2E5E9] hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5'
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-5 ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#8AA8FF]'
                        : 'bg-[#F4F5F7] border-[#E2E5E9] text-[#2B59FF]'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>

                  <h3
                    className={`text-lg font-bold tracking-tight ${
                      isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                    }`}
                  >
                    Consumer Portal
                  </h3>
                  <p
                    className={`text-xs font-medium mt-1 mb-3 ${
                      isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                    }`}
                  >
                    For Electricity Consumers
                  </p>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                    }`}
                  >
                    View electricity usage, check bills and due dates, and raise service or metering issues.
                  </p>
                </div>

                <div
                  className={`mt-8 pt-4 border-t ${
                    isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
                  }`}
                >
                  <Link
                    to="/consumer-portal"
                    className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors border shadow-2xs focus:outline-hidden focus:ring-2 ${
                      isDark
                        ? 'bg-[#1A1D21] hover:bg-[#22262B] text-[#F3F4F5] hover:text-white border-[#292C32] hover:border-[#3E434D] focus:ring-[#8AA8FF]/50'
                        : 'bg-[#F4F5F7] hover:bg-[#E9EBEF] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8] focus:ring-[#2B59FF]/30'
                    }`}
                  >
                    <span>Enter Consumer Portal</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#717784]'}`} />
                  </Link>
                </div>
              </div>

              {/* PORTAL 2: Employee Workspace */}
              <div
                className={`rounded-xl p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between border ${
                  isDark
                    ? 'bg-[#141619]/95 backdrop-blur-xs border-[#292C32] hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-950/20'
                    : 'bg-white/95 backdrop-blur-xs border-[#E2E5E9] hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5'
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-5 ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#8AA8FF]'
                        : 'bg-[#F4F5F7] border-[#E2E5E9] text-[#2B59FF]'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>

                  <h3
                    className={`text-lg font-bold tracking-tight ${
                      isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                    }`}
                  >
                    Employee Workspace
                  </h3>
                  <p
                    className={`text-xs font-medium mt-1 mb-3 ${
                      isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                    }`}
                  >
                    For Authorized Vigilance Officers
                  </p>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                    }`}
                  >
                    Manage inspection cases, review risk assessments and record verified field findings.
                  </p>
                </div>

                <div
                  className={`mt-8 pt-4 border-t ${
                    isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
                  }`}
                >
                  {user?.role === 'INSPECTION_EMPLOYEE' ? (
                    <Link
                      to="/employee/dashboard"
                      className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors border shadow-2xs focus:outline-hidden focus:ring-2 ${
                        isDark
                          ? 'bg-[#1A1D21] hover:bg-[#22262B] text-[#8AA8FF] hover:text-[#A6BCFF] border-[#292C32] hover:border-[#8AA8FF]/40 focus:ring-[#8AA8FF]/50'
                          : 'bg-[#F4F5F7] hover:bg-[#E9EBEF] text-[#2B59FF] border-[#E2E5E9] hover:border-[#2B59FF]/40 focus:ring-[#2B59FF]/30'
                      }`}
                    >
                      <span>Open Employee Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors border shadow-2xs focus:outline-hidden focus:ring-2 ${
                        isDark
                          ? 'bg-[#1A1D21] hover:bg-[#22262B] text-[#F3F4F5] hover:text-white border-[#292C32] hover:border-[#3E434D] focus:ring-[#8AA8FF]/50'
                          : 'bg-[#F4F5F7] hover:bg-[#E9EBEF] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8] focus:ring-[#2B59FF]/30'
                      }`}
                    >
                      <span>Employee Sign In</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#717784]'}`} />
                    </Link>
                  )}
                </div>
              </div>

              {/* PORTAL 3: Board Communication */}
              <div
                className={`rounded-xl p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between border ${
                  isDark
                    ? 'bg-[#141619]/95 backdrop-blur-xs border-[#292C32] hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-950/20'
                    : 'bg-white/95 backdrop-blur-xs border-[#E2E5E9] hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5'
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-5 ${
                      isDark
                        ? 'bg-[#0B0C0E] border-[#292C32] text-[#8AA8FF]'
                        : 'bg-[#F4F5F7] border-[#E2E5E9] text-[#2B59FF]'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>

                  <h3
                    className={`text-lg font-bold tracking-tight ${
                      isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                    }`}
                  >
                    Board Communication
                  </h3>
                  <p
                    className={`text-xs font-medium mt-1 mb-3 ${
                      isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                    }`}
                  >
                    Official Utility Bulletins
                  </p>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                    }`}
                  >
                    Read official announcements, electricity schemes, service notices and board updates.
                  </p>
                </div>

                <div
                  className={`mt-8 pt-4 border-t ${
                    isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
                  }`}
                >
                  <Link
                    to="/board-communication"
                    className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors border shadow-2xs focus:outline-hidden focus:ring-2 ${
                      isDark
                        ? 'bg-[#1A1D21] hover:bg-[#22262B] text-[#F3F4F5] hover:text-white border-[#292C32] hover:border-[#3E434D] focus:ring-[#8AA8FF]/50'
                        : 'bg-[#F4F5F7] hover:bg-[#E9EBEF] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8] focus:ring-[#2B59FF]/30'
                    }`}
                  >
                    <span>View Official Updates</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#717784]'}`} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Concise Public-Service Section */}
        <section
          className={`py-14 border-y transition-colors duration-200 ${
            isDark
              ? 'bg-[#141619] border-[#292C32]'
              : 'bg-white border-[#E2E5E9]'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-8">
              <h2
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                }`}
              >
                One Platform. Three Essential Services.
              </h2>
              <p
                className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${
                  isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                }`}
              >
                Engineered to coordinate public consumer services, official distribution announcements, and verified grid vigilance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div
                className={`p-5 rounded-xl border space-y-2 ${
                  isDark
                    ? 'bg-[#0B0C0E] border-[#292C32]'
                    : 'bg-[#F8F9FA] border-[#E2E5E9]'
                }`}
              >
                <div
                  className={`font-semibold flex items-center gap-2 ${
                    isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                  }`}
                >
                  <Users className={`w-4 h-4 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                  <span>Consumer Services</span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                  }`}
                >
                  Access usage, billing and service requests from a central self-service interface.
                </p>
              </div>

              <div
                className={`p-5 rounded-xl border space-y-2 ${
                  isDark
                    ? 'bg-[#0B0C0E] border-[#292C32]'
                    : 'bg-[#F8F9FA] border-[#E2E5E9]'
                }`}
              >
                <div
                  className={`font-semibold flex items-center gap-2 ${
                    isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                  <span>Official Communication</span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                  }`}
                >
                  Find board announcements and service information verified by distribution authorities.
                </p>
              </div>

              <div
                className={`p-5 rounded-xl border space-y-2 ${
                  isDark
                    ? 'bg-[#0B0C0E] border-[#292C32]'
                    : 'bg-[#F8F9FA] border-[#E2E5E9]'
                }`}
              >
                <div
                  className={`font-semibold flex items-center gap-2 ${
                    isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                  }`}
                >
                  <Shield className={`w-4 h-4 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
                  <span>Inspection Operations</span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                  }`}
                >
                  Support authorised staff with organised inspection workflows and transparent decision support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Official Updates Section */}
        <section
          id="updates"
          className={`py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${
            isDark ? 'bg-[#0B0C0E]' : 'bg-[#F8F9FA]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-10">
            <div>
              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                }`}
              >
                Official Electricity Board Updates
              </h2>
              <p
                className={`text-xs sm:text-sm mt-1.5 ${
                  isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                }`}
              >
                Announcements, schemes and service notices from the electricity board.
              </p>
            </div>

            <Link
              to="/board-communication"
              className={`text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors ${
                isDark
                  ? 'text-[#8AA8FF] hover:text-[#A6BCFF]'
                  : 'text-[#2B59FF] hover:text-[#1E40AF]'
              }`}
            >
              <span>View All Updates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {updatesLoading ? (
            <div
              className={`p-10 text-center text-xs rounded-xl border ${
                isDark
                  ? 'text-[#9A9FA8] bg-[#141619] border-[#292C32]'
                  : 'text-[#525866] bg-white border-[#E2E5E9]'
              }`}
            >
              Loading official notices...
            </div>
          ) : recentUpdates.length === 0 ? (
            <div
              className={`p-10 rounded-xl text-center text-xs border ${
                isDark
                  ? 'bg-[#141619] border-[#292C32] text-[#9A9FA8]'
                  : 'bg-white border-[#E2E5E9] text-[#525866]'
              }`}
            >
              No active announcements currently posted.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentUpdates.map(post => (
                <div
                  key={post.id}
                  className={`rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-colors border ${
                    isDark
                      ? 'bg-[#141619] border-[#292C32] hover:border-[#3E434D]'
                      : 'bg-white border-[#E2E5E9] hover:border-[#CBD1D8] shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getCategoryColor(
                          post.category
                        )}`}
                      >
                        {formatCategory(post.category)}
                      </span>
                      <span
                        className={`text-[10px] tabular-nums font-medium flex items-center gap-1 ${
                          isDark ? 'text-[#6E737D]' : 'text-[#717784]'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-bold tracking-tight leading-snug line-clamp-2 ${
                        isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                      }`}
                    >
                      {post.title}
                    </h4>
                    <p
                      className={`text-xs mt-2.5 line-clamp-3 leading-relaxed ${
                        isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                      }`}
                    >
                      {post.summary || post.content}
                    </p>
                  </div>

                  <div
                    className={`mt-5 pt-3.5 border-t flex items-center justify-between text-[11px] ${
                      isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
                    }`}
                  >
                    <span
                      className={`font-medium truncate max-w-[140px] ${
                        isDark ? 'text-[#6E737D]' : 'text-[#717784]'
                      }`}
                    >
                      Source: {post.author_name}
                    </span>
                    <button
                      onClick={() => setSelectedPost(post)}
                      className={`text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                        isDark
                          ? 'text-[#8AA8FF] hover:text-[#A6BCFF]'
                          : 'text-[#2B59FF] hover:text-[#1E40AF]'
                      }`}
                    >
                      <span>Read Notice</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Reader Modal for Circulars */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className={`border rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 max-h-[85vh] flex flex-col ${
              isDark
                ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]'
                : 'bg-white border-[#E2E5E9] text-[#0F141C]'
            }`}
          >
            <div
              className={`flex items-start justify-between border-b pb-4 mb-4 ${
                isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getCategoryColor(
                    selectedPost.category
                  )}`}
                >
                  {formatCategory(selectedPost.category)}
                </span>
                <h2
                  className={`text-lg font-bold mt-2 tracking-tight ${
                    isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                  }`}
                >
                  {selectedPost.title}
                </h2>
                <div
                  className={`text-[11px] tabular-nums mt-1 ${
                    isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                  }`}
                >
                  Published: {new Date(selectedPost.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} • Authority: {selectedPost.author_name}
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#1A1D21]'
                    : 'text-[#525866] hover:text-[#0F141C] hover:bg-[#F4F5F7]'
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed pr-2 ${
                isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
              }`}
            >
              <div
                className={`p-3.5 border rounded-lg text-xs font-medium italic leading-relaxed ${
                  isDark
                    ? 'bg-[#1A1D21] border-[#292C32] text-[#F3F4F5]'
                    : 'bg-[#F8F9FA] border-[#E2E5E9] text-[#0F141C]'
                }`}
              >
                {selectedPost.summary}
              </div>
              <div className="whitespace-pre-line leading-relaxed">
                {selectedPost.content}
              </div>
            </div>

            <div
              className={`pt-4 mt-4 border-t flex justify-end ${
                isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'
              }`}
            >
              <button
                onClick={() => setSelectedPost(null)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1A1D21] hover:bg-[#22262B] text-[#F3F4F5] border-[#292C32] hover:border-[#3E434D]'
                    : 'bg-[#0F141C] hover:bg-black text-white border-transparent'
                }`}
              >
                Dismiss Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Minimal Footer */}
      <PublicFooter />
    </div>
  );
};
