import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  CheckCircle2,
  GripHorizontal,
  Zap,
  Activity,
  CreditCard,
  AlertCircle,
  Bell
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface ConsumerGuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'overview' | 'usage' | 'billing' | 'issues') => void;
}

interface TourStep {
  id: string;
  tab: 'overview' | 'usage' | 'billing' | 'issues';
  selector: string;
  title: string;
  badge: string;
  description: string;
  preferredPlacement?: 'top' | 'bottom';
  icon: React.ComponentType<{ className?: string }>;
}

const consumerTourSteps: TourStep[] = [
  {
    id: 'account-summary',
    tab: 'overview',
    selector: '[data-tour="consumer-account-summary"]',
    title: 'Connection Identity & Smart Meter',
    badge: 'CONNECTION PROFILE',
    description: 'Review your sanctioned load (kW), distribution feeder, tariff category, and bidirectional smart meter status. All account details are certified directly by the distribution board.',
    preferredPlacement: 'bottom',
    icon: Zap
  },
  {
    id: 'overview-kpis',
    tab: 'overview',
    selector: '[data-tour="consumer-kpis"]',
    title: 'Monthly Consumption & Account Balance',
    badge: 'OPERATIONAL SUMMARY',
    description: 'Track your current billing cycle energy units (kWh), total amount due, payment due date, and count of active service grievances at a glance.',
    preferredPlacement: 'bottom',
    icon: Activity
  },
  {
    id: 'usage-trends',
    tab: 'usage',
    selector: '[data-tour="consumer-usage-section"]',
    title: 'Daily Smart Meter Time-Series',
    badge: 'HOURLY/DAILY TRENDS',
    description: 'Explore 30-day smart meter readings in kilowatt-hours. Compare daily variance against your monthly average baseline to monitor consumption efficiency and detect abnormal spikes.',
    preferredPlacement: 'top',
    icon: Activity
  },
  {
    id: 'billing-invoices',
    tab: 'billing',
    selector: '[data-tour="consumer-billing-section"]',
    title: 'Billing Statements & Settlement',
    badge: 'INVOICES & PAYMENTS',
    description: 'Review historical electricity bills, due dates, and payment statuses. You can verify bill authenticity and simulate secure instant online bill settlement with an audit record.',
    preferredPlacement: 'top',
    icon: CreditCard
  },
  {
    id: 'service-grievances',
    tab: 'issues',
    selector: '[data-tour="consumer-issues-section"]',
    title: 'Grievance Lodgment & Resolution',
    badge: 'CONSUMER GRIEVANCE CELL',
    description: 'Submit meter faults, billing inquiries, or supply disruption reports directly to board vigilance officers. Every report generates an official ticket number with transparent resolution notes.',
    preferredPlacement: 'top',
    icon: AlertCircle
  },
  {
    id: 'notifications-alerts',
    tab: 'overview',
    selector: '[data-tour="consumer-notifications-btn"]',
    title: 'Service Alerts & Public Gazette',
    badge: 'BOARD DISPATCH',
    description: 'Access official utility advisories, maintenance schedules, and public circulars issued by the State Electricity Distribution Board.',
    preferredPlacement: 'bottom',
    icon: Bell
  }
];

export const ConsumerGuidedTourModal: React.FC<ConsumerGuidedTourModalProps> = ({
  isOpen,
  onClose,
  onSelectTab
}) => {
  const { updateOnboardingStatus } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // -1: Welcome Intro Dialog, 0 to N-1: Interactive step walkthrough
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const pollingTimerRef = useRef<number | null>(null);

  // Card reference & dynamic dimension tracking for viewport safety
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardSize, setCardSize] = useState<{ width: number; height: number }>({
    width: 400,
    height: 260
  });

  // Viewport dimensions
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Dragging state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const totalSteps = consumerTourSteps.length;
  const currentStep = currentStepIndex >= 0 && currentStepIndex < totalSteps
    ? consumerTourSteps[currentStepIndex]
    : null;

  // Complete or Skip Tour
  const handleCompleteOrSkip = useCallback(async () => {
    try {
      await api.completeOnboarding('v1.0');
      updateOnboardingStatus(true);
    } catch {
      // silent
    }
    setDragOffset(null);
    setCurrentStepIndex(-1);
    setTargetRect(null);
    onClose();
  }, [updateOnboardingStatus, onClose]);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track actual rendered card dimensions via ResizeObserver
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCardSize(prev => {
            if (Math.abs(prev.width - width) < 2 && Math.abs(prev.height - height) < 2) return prev;
            return { width: Math.round(width), height: Math.round(height) };
          });
        }
      }
    });

    ro.observe(cardEl);
    return () => ro.disconnect();
  }, [currentStepIndex, isOpen]);

  // Reset temporary drag offset on step advance or reverse
  useEffect(() => {
    setDragOffset(null);
  }, [currentStepIndex]);

  // Measure and update target bounding rectangle
  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  // Switch tab and find element when step changes
  useEffect(() => {
    if (!isOpen || currentStepIndex < 0 || !currentStep) {
      setTargetRect(null);
      return;
    }

    // Switch active tab in Consumer Dashboard
    onSelectTab(currentStep.tab);

    let attempts = 0;
    const maxAttempts = 20;

    const checkElement = () => {
      attempts++;
      const el = document.querySelector(currentStep.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        }, 150);
        return;
      }

      if (attempts < maxAttempts) {
        pollingTimerRef.current = window.setTimeout(checkElement, 100);
      } else {
        setTargetRect(null);
      }
    };

    const initialTimer = window.setTimeout(checkElement, 100);

    return () => {
      clearTimeout(initialTimer);
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, [isOpen, currentStepIndex, currentStep, onSelectTab]);

  // Re-measure on window scroll or resize during step walkthrough
  useEffect(() => {
    if (!isOpen || currentStepIndex < 0) return;

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    setDragOffset(prev => ({
      x: (prev?.x || 0) + dx,
      y: (prev?.y || 0) + dy
    }));

    dragStartRef.current.pointerX = e.clientX;
    dragStartRef.current.pointerY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // silent
      }
    }
  };

  // Keyboard navigation: Escape closes/skips, Arrow keys navigate
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCompleteOrSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex === -1) {
          setCurrentStepIndex(0);
        } else if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          handleCompleteOrSkip();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, totalSteps, handleCompleteOrSkip]);

  if (!isOpen) return null;

  // WELCOME INTRO CARD
  if (currentStepIndex === -1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className={`border rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl transition-colors ${
            isDark
              ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]'
              : 'bg-white border-[#E2E5E9] text-[#0F141C]'
          }`}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
                Interactive Onboarding
              </span>
              <h2 className="text-lg font-bold tracking-tight">
                Welcome to PowerConnect Consumer Portal
              </h2>
            </div>
          </div>

          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
            }`}
          >
            This interactive walkthrough highlights key digital services available for your electricity connection—including hourly smart meter usage trends, official billing statements, and online grievance lodgment.
          </p>

          <div
            className={`mt-4 border rounded-xl p-3.5 text-xs leading-relaxed space-y-1.5 ${
              isDark
                ? 'bg-[#0B0C0E] border-[#292C32] text-[#9A9FA8]'
                : 'bg-slate-50 border-slate-200 text-[#525866]'
            }`}
          >
            <div className="flex items-center space-x-2 font-semibold text-blue-500">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Guided Feature Walkthrough:</span>
            </div>
            <p className="pl-6">
              Advances through the live portal sections, demonstrating real controls without making changes to your account or payment balance.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setCurrentStepIndex(0)}
              className="flex-1 bg-[#2B59FF] hover:bg-[#1E45DB] text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors shadow-xs cursor-pointer"
            >
              <span>Start Interactive Walkthrough</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCompleteOrSkip}
              className={`flex-1 font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-[#141619] border-[#292C32] text-[#9A9FA8] hover:text-[#F3F4F5] hover:border-[#3E434D]'
                  : 'bg-slate-100 border-slate-200 text-[#525866] hover:text-[#0F141C] hover:bg-slate-200'
              }`}
            >
              Skip & Explore Directly
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate clamped positioning for spotlight cutout and dialog card
  const padding = 10;
  const rectX = targetRect ? Math.max(0, targetRect.left - padding) : 0;
  const rectY = targetRect ? Math.max(0, targetRect.top - padding) : 0;
  const rectW = targetRect ? targetRect.width + padding * 2 : 0;
  const rectH = targetRect ? targetRect.height + padding * 2 : 0;

  // Placement calculation for the floating tour panel
  let cardLeft = 24;
  let cardTop = 80;

  if (targetRect) {
    const centerTargetX = targetRect.left + targetRect.width / 2;
    cardLeft = centerTargetX - cardSize.width / 2;

    const spaceAbove = targetRect.top;
    const spaceBelow = viewportSize.height - targetRect.bottom;

    if (currentStep?.preferredPlacement === 'top' && spaceAbove >= cardSize.height + 24) {
      cardTop = targetRect.top - cardSize.height - 16;
    } else if (spaceBelow >= cardSize.height + 24) {
      cardTop = targetRect.bottom + 16;
    } else if (spaceAbove >= cardSize.height + 24) {
      cardTop = targetRect.top - cardSize.height - 16;
    } else {
      cardTop = Math.max(20, (viewportSize.height - cardSize.height) / 2);
    }
  } else {
    cardLeft = Math.max(20, (viewportSize.width - cardSize.width) / 2);
    cardTop = Math.max(20, (viewportSize.height - cardSize.height) / 2);
  }

  // Viewport bounds clamping
  const margin = 16;
  cardLeft = Math.max(margin, Math.min(cardLeft, viewportSize.width - cardSize.width - margin));
  cardTop = Math.max(margin, Math.min(cardTop, viewportSize.height - cardSize.height - margin));

  // Apply user drag offset if active
  if (dragOffset) {
    cardLeft = Math.max(margin, Math.min(cardLeft + dragOffset.x, viewportSize.width - cardSize.width - margin));
    cardTop = Math.max(margin, Math.min(cardTop + dragOffset.y, viewportSize.height - cardSize.height - margin));
  }

  const StepIcon = currentStep?.icon || Zap;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* Spotlight Mask SVG Cutout */}
      {targetRect && (
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-200"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="consumer-tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={rectX}
                y={rectY}
                width={rectW}
                height={rectH}
                rx="10"
                ry="10"
                fill="black"
              />
            </mask>
          </defs>
          {/* Dimmed backdrop covering everywhere except the cutout */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(11, 12, 14, 0.65)"
            mask="url(#consumer-tour-spotlight-mask)"
          />
          {/* Primary blue highlight border around real element */}
          <rect
            x={rectX}
            y={rectY}
            width={rectW}
            height={rectH}
            rx="10"
            ry="10"
            fill="none"
            stroke="#2B59FF"
            strokeWidth="2.5"
            className="filter drop-shadow-md"
          />
          {/* Secondary subtle pulse ring */}
          <rect
            x={rectX - 3}
            y={rectY - 3}
            width={rectW + 6}
            height={rectH + 6}
            rx="13"
            ry="13"
            fill="none"
            stroke="#8AA8FF"
            strokeWidth="1.5"
            opacity="0.4"
          />
        </svg>
      )}

      {/* Dimmed backdrop when target is resolving */}
      {!targetRect && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity duration-200" />
      )}

      {/* Draggable, Viewport-Clamped Tour Panel Card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-label={`Guided Tour: ${currentStep?.title}`}
        style={{
          position: 'fixed',
          left: `${cardLeft}px`,
          top: `${cardTop}px`,
          width: 'min(420px, calc(100vw - 32px))'
        }}
        className={`border rounded-2xl shadow-2xl overflow-hidden transition-colors z-50 ${
          isDark
            ? 'bg-[#141619] border-[#292C32] text-[#F3F4F5]'
            : 'bg-white border-[#E2E5E9] text-[#0F141C]'
        }`}
      >
        {/* Drag Handle Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`h-7 flex items-center justify-center cursor-grab active:cursor-grabbing border-b select-none transition-colors ${
            isDark
              ? 'bg-[#0B0C0E] border-[#292C32] text-[#6E737D] hover:text-[#9A9FA8]'
              : 'bg-slate-50 border-[#E2E5E9] text-slate-400 hover:text-slate-600'
          }`}
          title="Drag to reposition tour window"
        >
          <GripHorizontal className="w-4 h-4 opacity-75" />
          <span className="text-[10px] uppercase font-mono tracking-wider ml-1.5 opacity-60">
            DRAG TO MOVE
          </span>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 space-y-3.5">
          {/* Header Row: Badge, Step Counter & Close */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  isDark
                    ? 'bg-blue-950/40 text-blue-400 border-blue-900/50'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {currentStep?.badge}
              </span>
              <span
                className={`text-xs font-mono font-medium ${
                  isDark ? 'text-[#9A9FA8]' : 'text-[#6E737D]'
                }`}
              >
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCompleteOrSkip}
              className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#292C32] bg-[#0B0C0E] text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'border-[#E2E5E9] bg-slate-50 text-[#525866] hover:text-[#0F141C]'
              }`}
              aria-label="Exit tour"
              title="Skip Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title and Icon */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
              <StepIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                {currentStep?.title}
              </h3>
            </div>
          </div>

          {/* Step Description */}
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-[#9A9FA8]' : 'text-[#525866]'
            }`}
          >
            {currentStep?.description}
          </p>

          {/* Step Progress Dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {consumerTourSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-[#2B59FF]'
                    : isDark
                    ? 'w-2 bg-[#292C32] hover:bg-[#3E434D]'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Navigation Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-inherit">
            <button
              type="button"
              onClick={handleCompleteOrSkip}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#9A9FA8] hover:text-[#F3F4F5]'
                  : 'text-[#6E737D] hover:text-[#0F141C]'
              }`}
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(prev => prev - 1)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#0B0C0E] border-[#292C32] text-[#F3F4F5] hover:border-[#3E434D]'
                      : 'bg-white border-[#E2E5E9] text-[#0F141C] hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {currentStepIndex < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(prev => prev + 1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#2B59FF] hover:bg-[#1E45DB] text-white transition-colors cursor-pointer shadow-xs"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteOrSkip}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finish Tour</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
