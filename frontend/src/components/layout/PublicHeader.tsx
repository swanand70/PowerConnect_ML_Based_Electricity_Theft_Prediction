import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, Menu, X, Users, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export interface PublicHeaderProps {
  actionOverride?: {
    label: string;
    to: string;
    icon?: React.ReactNode;
  };
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ actionOverride }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isEmployeeAuth = location.pathname === '/login' || location.pathname === '/employee/login';
  const isConsumerAuth = location.pathname === '/consumer/login' || location.pathname === '/consumer-portal';

  const renderAuthAction = (isMobile = false) => {
    if (actionOverride) {
      return (
        <Link
          to={actionOverride.to}
          onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
          className={
            isMobile
              ? `w-full flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg text-xs border ${
                  isDark
                    ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5] hover:border-[#3E434D]'
                    : 'bg-white border-[#E2E5E9] text-[#0F141C] hover:border-[#CBD1D8]'
                }`
              : `inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-2xs border ${
                  isDark
                    ? 'bg-[#141619] hover:bg-[#1A1D21] text-[#F3F4F5] hover:text-white border-[#292C32] hover:border-[#3E434D]'
                    : 'bg-white hover:bg-[#F4F5F7] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8]'
                }`
          }
        >
          {actionOverride.icon || (isEmployeeAuth ? <Users className={`w-3.5 h-3.5 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} /> : <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />)}
          <span>{actionOverride.label}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#717784]'}`} />
        </Link>
      );
    }

    if (user?.role === 'INSPECTION_EMPLOYEE' && !isEmployeeAuth) {
      return (
        <Link
          to="/employee/dashboard"
          onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
          className={
            isMobile
              ? `w-full flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg text-xs border ${
                  isDark
                    ? 'bg-[#141619] border-[#292C32] text-[#8AA8FF]'
                    : 'bg-white border-[#E2E5E9] text-[#2B59FF]'
                }`
              : `inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-2xs border ${
                  isDark
                    ? 'bg-[#141619] hover:bg-[#1A1D21] text-[#8AA8FF] border-[#292C32] hover:border-[#8AA8FF]/40'
                    : 'bg-white hover:bg-[#F4F5F7] text-[#2B59FF] border-[#E2E5E9] hover:border-[#2B59FF]/40'
                }`
          }
        >
          <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      );
    }

    if (user?.role === 'CONSUMER' && !isConsumerAuth) {
      return (
        <Link
          to="/consumer/dashboard"
          onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
          className={
            isMobile
              ? `w-full flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg text-xs border ${
                  isDark
                    ? 'bg-[#141619] border-[#292C32] text-[#8AA8FF]'
                    : 'bg-white border-[#E2E5E9] text-[#2B59FF]'
                }`
              : `inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-2xs border ${
                  isDark
                    ? 'bg-[#141619] hover:bg-[#1A1D21] text-[#8AA8FF] border-[#292C32] hover:border-[#8AA8FF]/40'
                    : 'bg-white hover:bg-[#F4F5F7] text-[#2B59FF] border-[#E2E5E9] hover:border-[#2B59FF]/40'
                }`
          }
        >
          <Users className={`w-3.5 h-3.5 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
          <span>Consumer Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      );
    }

    // Contextual button based on page
    if (isEmployeeAuth) {
      return (
        <Link
          to="/consumer/login"
          onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
          className={
            isMobile
              ? `w-full flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg text-xs border ${
                  isDark
                    ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5] hover:border-[#3E434D]'
                    : 'bg-white border-[#E2E5E9] text-[#0F141C] hover:border-[#CBD1D8]'
                }`
              : `inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-2xs border ${
                  isDark
                    ? 'bg-[#141619] hover:bg-[#1A1D21] text-[#F3F4F5] hover:text-white border-[#292C32] hover:border-[#3E434D]'
                    : 'bg-white hover:bg-[#F4F5F7] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8]'
                }`
          }
        >
          <Users className={`w-3.5 h-3.5 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
          <span>Consumer Sign In</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#717784]'}`} />
        </Link>
      );
    }

    // Default: Employee Sign In
    return (
      <Link
        to="/login"
        onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
        className={
          isMobile
            ? `w-full flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg text-xs border ${
                isDark
                  ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5] hover:border-[#3E434D]'
                  : 'bg-white border-[#E2E5E9] text-[#0F141C] hover:border-[#CBD1D8]'
              }`
            : `inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-2xs border ${
                isDark
                  ? 'bg-[#141619] hover:bg-[#1A1D21] text-[#F3F4F5] hover:text-white border-[#292C32] hover:border-[#3E434D]'
                  : 'bg-white hover:bg-[#F4F5F7] text-[#0F141C] border-[#E2E5E9] hover:border-[#CBD1D8]'
              }`
        }
      >
        <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
        <span>Employee Sign In</span>
        <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#9A9FA8]' : 'text-[#717784]'}`} />
      </Link>
    );
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const executeScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const headerHeight = 64; // height of header
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    };

    if (location.pathname === '/') {
      executeScroll();
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b ${
        isDark
          ? 'bg-[#0B0C0E]/90 backdrop-blur-md border-[#292C32]'
          : 'bg-[#F8F9FA]/90 backdrop-blur-md border-[#E2E5E9]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand mark and wordmark */}
          <div className="flex-1 flex items-center justify-start min-w-0">
            <Link
              to="/"
              className={`flex items-center space-x-3 group focus:outline-hidden focus:ring-2 rounded-lg pr-2 ${
                isDark ? 'focus:ring-[#8AA8FF]/50' : 'focus:ring-[#2B59FF]/30'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-xs transition-colors shrink-0 ${
                  isDark
                    ? 'bg-[#141619] border-[#292C32] text-[#8AA8FF] group-hover:border-[#8AA8FF]/50'
                    : 'bg-white border-[#E2E5E9] text-[#2B59FF] group-hover:border-[#2B59FF]/50'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`w-4 h-4 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span
                    className={`text-base sm:text-lg font-bold tracking-tight ${
                      isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'
                    }`}
                  >
                    PowerConnect
                  </span>
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mb-0.5 ${
                      isDark ? 'bg-[#8AA8FF]' : 'bg-[#2B59FF]'
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium block leading-tight truncate ${
                    isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
                  }`}
                >
                  Electricity Services & Vigilance
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav
            aria-label="Public Navigation"
            className="hidden md:flex items-center space-x-8 text-xs font-medium shrink-0"
          >
            <Link
              to="/"
              className={`transition-colors py-1 ${
                location.pathname === '/' && !location.hash
                  ? isDark
                    ? 'text-[#F3F4F5] font-semibold'
                    : 'text-[#0F141C] font-semibold'
                  : isDark
                    ? 'text-[#9A9FA8] hover:text-[#F3F4F5]'
                    : 'text-[#525866] hover:text-[#0F141C]'
              }`}
            >
              Home
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection('portals')}
              className={`transition-colors py-1 cursor-pointer focus:outline-hidden ${
                isDark
                  ? 'text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'text-[#525866] hover:text-[#0F141C]'
              }`}
            >
              Portals & Services
            </button>

            <Link
              to="/board-communication"
              className={`transition-colors py-1 ${
                location.pathname === '/board-communication'
                  ? isDark
                    ? 'text-[#8AA8FF] font-semibold'
                    : 'text-[#2B59FF] font-semibold'
                  : isDark
                    ? 'text-[#9A9FA8] hover:text-[#F3F4F5]'
                    : 'text-[#525866] hover:text-[#0F141C]'
              }`}
            >
              Official Updates
            </Link>
          </nav>

          {/* Right: Theme Toggle & Auth Action */}
          <div className="flex-1 hidden md:flex items-center justify-end space-x-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors flex items-center justify-center cursor-pointer focus:outline-hidden focus:ring-2 ${
                isDark
                  ? 'bg-[#141619] border-[#292C32] text-[#9A9FA8] hover:text-[#F3F4F5] hover:border-[#3E434D] focus:ring-[#8AA8FF]/50'
                  : 'bg-white border-[#E2E5E9] text-[#525866] hover:text-[#0F141C] hover:border-[#CBD1D8] focus:ring-[#2B59FF]/30 shadow-2xs'
              }`}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#F3F4F5] transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-[#0F141C] transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Contextual Auth Action */}
            {renderAuthAction(false)}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors focus:outline-hidden ${
                isDark
                  ? 'bg-[#141619] border-[#292C32] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'bg-white border-[#E2E5E9] text-[#525866] hover:text-[#0F141C]'
              }`}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors focus:outline-hidden focus:ring-2 ${
                isDark
                  ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#141619] focus:ring-[#8AA8FF]/50'
                  : 'text-[#525866] hover:text-[#0F141C] hover:bg-white focus:ring-[#2B59FF]/30'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-t px-4 pt-3 pb-5 space-y-3 animate-in fade-in duration-150 ${
            isDark ? 'bg-[#0B0C0E] border-[#292C32]' : 'bg-[#F8F9FA] border-[#E2E5E9]'
          }`}
        >
          <div className="flex flex-col space-y-1.5 text-xs font-medium">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-[#F3F4F5] hover:bg-[#141619]'
                  : 'text-[#0F141C] hover:bg-white'
              }`}
            >
              Home
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection('portals')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#141619]'
                  : 'text-[#525866] hover:text-[#0F141C] hover:bg-white'
              }`}
            >
              Portals & Services
            </button>

            <Link
              to="/board-communication"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#141619]'
                  : 'text-[#525866] hover:text-[#0F141C] hover:bg-white'
              }`}
            >
              Official Updates & Circulars
            </Link>

            <Link
              to="/consumer-portal"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isDark
                  ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#141619]'
                  : 'text-[#525866] hover:text-[#0F141C] hover:bg-white'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${isDark ? 'text-[#8AA8FF]' : 'text-[#2B59FF]'}`} />
              <span>Consumer Portal</span>
            </Link>
          </div>

          {/* Mobile Theme Toggle Row */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#141619] border-[#292C32]' : 'bg-[#F4F5F7] border-[#E2E5E9]'
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
              }`}
            >
              Theme: <strong className={isDark ? 'text-[#F3F4F5]' : 'text-[#0F141C]'}>{isDark ? 'Dark' : 'Light'}</strong>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5]'
                  : 'bg-white border-[#E2E5E9] text-[#0F141C]'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div
            className={`pt-3 border-t ${isDark ? 'border-[#292C32]' : 'border-[#E2E5E9]'}`}
          >
            {renderAuthAction(true)}
          </div>
        </div>
      )}
    </header>
  );
};
