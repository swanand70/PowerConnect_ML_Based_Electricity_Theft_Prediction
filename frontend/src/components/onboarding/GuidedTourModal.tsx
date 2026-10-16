import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  CheckCircle2,
  ExternalLink,
  GripHorizontal
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  id: string;
  route: string;
  selector: string;
  title: string;
  badge: string;
  description: string;
  preferredPlacement?: 'top' | 'bottom';
}

const getTourSteps = (caseId: number): TourStep[] => [
  {
    id: 'dashboard-action',
    route: '/employee/dashboard',
    selector: '[data-tour="dashboard-action-card"]',
    title: 'Top Priority Inspection Candidate',
    badge: 'HIGHEST VIGILANCE PRIORITY',
    description: 'The single highest-risk candidate requiring immediate action, ranked by combined ML theft probability and grid volatility.',
    preferredPlacement: 'bottom'
  },
  {
    id: 'dashboard-kpis',
    route: '/employee/dashboard',
    selector: '[data-tour="dashboard-kpis"]',
    title: 'Operational Status Counters',
    badge: 'WORKLOAD OVERVIEW',
    description: 'Track today\'s pending field inspections, active monitored accounts, confirmed theft detections, and verified clean audits at a glance.',
    preferredPlacement: 'bottom'
  },
  {
    id: 'dashboard-queue-preview',
    route: '/employee/dashboard',
    selector: '[data-tour="dashboard-queue-preview"]',
    title: 'Priority Candidate Preview',
    badge: 'DYNAMIC RANKING',
    description: 'Immediate visual summary of top candidate accounts. Notice how the visual indicators make risk levels immediately distinguishable.',
    preferredPlacement: 'top'
  },
  {
    id: 'queue-filters',
    route: '/employee/inspections',
    selector: '[data-tour="queue-filters"]',
    title: 'Queue Filtering & Search Controls',
    badge: 'OPERATIONAL FILTERING',
    description: 'Filter candidates by distribution zone, lifecycle status, or risk tier. Use the real-time search bar to look up consumers by name, meter ID, or feeder.',
    preferredPlacement: 'bottom'
  },
  {
    id: 'queue-table',
    route: '/employee/inspections',
    selector: '[data-tour="queue-table"]',
    title: 'Prioritized Inspection Queue',
    badge: 'CLOSED-LOOP WORKLIST',
    description: 'Consumers ranked dynamically by theft likelihood. From here, assign flying squad officers, schedule inspection dates, or review full case details.',
    preferredPlacement: 'top'
  },
  {
    id: 'map-view',
    route: '/employee/map',
    selector: '[data-tour="map-container"]',
    title: 'Interactive GIS Distribution Map',
    badge: 'SPATIAL INTELLIGENCE',
    description: 'Geographic view of vigilance candidates color-coded by risk. Plan efficient squad travel routes and inspect spatial clusters across 11kV distribution feeders.',
    preferredPlacement: 'bottom'
  },
  {
    id: 'case-shap',
    route: `/employee/inspections/${caseId}`,
    selector: '[data-tour="case-shap"]',
    title: 'SHAP Feature Contribution Analysis',
    badge: 'TRANSPARENT DECISION SUPPORT',
    description: 'Review statistical drivers behind each flagged meter—such as variance drops, abnormal autocorrelation, and consumption drift. Model scores serve as decision support, not legal proof.',
    preferredPlacement: 'top'
  },
  {
    id: 'case-consumption',
    route: `/employee/inspections/${caseId}`,
    selector: '[data-tour="case-consumption"]',
    title: 'Daily Consumption Profile Trend',
    badge: 'TIME-SERIES EVIDENCE',
    description: 'Examine 60-day daily smart meter readings against historical baseline consumption to detect sudden unmetered load drops and bypass patterns.',
    preferredPlacement: 'top'
  },
  {
    id: 'case-outcome',
    route: `/employee/inspections/${caseId}`,
    selector: '[data-tour="case-outcome-btn"]',
    title: 'Field Audit Outcome Verification',
    badge: 'HUMAN-IN-THE-LOOP FEEDBACK',
    description: 'Following on-site inspection, capture the physical audit outcome (Theft Confirmed, No Theft, or Inconclusive). Physical verifications feed future model evaluation and calibration.',
    preferredPlacement: 'bottom'
  },
  {
    id: 'reports-kpis',
    route: '/employee/reports',
    selector: '[data-tour="reports-kpis"]',
    title: 'Vigilance & Enforcement Reports',
    badge: 'AUDIT METRICS & RECOVERIES',
    description: 'Track overall squad audit hit rate, Section 135 provisional penalty assessments, and unmetered energy units recovered across regional divisions.',
    preferredPlacement: 'bottom'
  },
  {
    id: 'help-guide',
    route: '/employee/help',
    selector: '[data-tour="help-guide"]',
    title: 'SOP Protocols & Tour Replay',
    badge: 'REFERENCE & SUPPORT',
    description: 'Access standard operating procedures for physical audits, legal outcome criteria, and replay this interactive walkthrough whenever needed.',
    preferredPlacement: 'bottom'
  }
];

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({ isOpen, onClose }) => {
  const { updateOnboardingStatus } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCaseId, setActiveCaseId] = useState<number>(6);

  // -1: Welcome Intro Dialog, 0 to N-1: Interactive step walkthrough
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetFound, setTargetFound] = useState<boolean>(true);
  const [isResolving, setIsResolving] = useState<boolean>(false);
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

  // Dragging state: offset is temporary per step and resets on navigation
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  // Derive case ID: if user is currently on an inspection case detail route, use that ID
  const routeCaseMatch = location.pathname.match(/\/employee\/inspections\/(\d+)/);
  const effectiveCaseId = routeCaseMatch ? Number(routeCaseMatch[1]) : activeCaseId;

  const tourSteps = getTourSteps(effectiveCaseId);
  const totalSteps = tourSteps.length;
  const currentStep = currentStepIndex >= 0 && currentStepIndex < totalSteps ? tourSteps[currentStepIndex] : null;

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

  // Fetch active case IDs on open
  useEffect(() => {
    if (isOpen) {
      const match = location.pathname.match(/\/employee\/inspections\/(\d+)/);
      if (match) {
        setActiveCaseId(Number(match[1]));
      } else {
        api.getCases()
          .then(cases => {
            if (cases && cases.length > 0) {
              setActiveCaseId(cases[0].id);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, location.pathname]);

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
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        setTargetFound(true);
      } else {
        setTargetRect(null);
        setTargetFound(false);
      }
    } else {
      setTargetRect(null);
      setTargetFound(false);
    }
  }, [currentStep]);

  // Synchronize target element on step transition or route change
  useEffect(() => {
    if (!isOpen || currentStepIndex < 0 || !currentStep) {
      setTargetRect(null);
      return;
    }

    setDragOffset(null);

    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }

    setIsResolving(true);
    let attempts = 0;
    const maxAttempts = 35; // 35 * 100ms = 3.5s timeout

    pollingTimerRef.current = window.setInterval(() => {
      attempts += 1;
      const el = document.querySelector(currentStep.selector);
      if (el) {
        if (pollingTimerRef.current) {
          window.clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
        setIsResolving(false);
        const winH = window.innerHeight;
        el.scrollIntoView({
          behavior: 'smooth',
          block: (el as HTMLElement).offsetHeight > winH * 0.45 ? 'start' : 'center',
          inline: 'nearest'
        });

        // Multi-interval check to track smooth-scroll settling
        [100, 250, 450].forEach(delay => {
          window.setTimeout(() => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setTargetRect(rect);
              setTargetFound(true);
            }
          }, delay);
        });
      } else if (attempts >= maxAttempts) {
        if (pollingTimerRef.current) {
          window.clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
        setIsResolving(false);
        setTargetRect(null);
        setTargetFound(false);
      }
    }, 100);

    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [isOpen, currentStepIndex, currentStep, location.pathname, navigate]);

  // Recalculate target rect on scroll (capture-phase for main scroll container) and resize
  useEffect(() => {
    if (!isOpen || currentStepIndex < 0) return;

    const handleWindowChange = () => {
      updateTargetRect();
    };

    window.addEventListener('scroll', handleWindowChange, true);
    window.addEventListener('resize', handleWindowChange);

    return () => {
      window.removeEventListener('scroll', handleWindowChange, true);
      window.removeEventListener('resize', handleWindowChange);
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Step navigation with explicit drag offset reset
  const handleNextStep = useCallback(() => {
    setDragOffset(null);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleCompleteOrSkip();
    }
  }, [currentStepIndex, totalSteps, handleCompleteOrSkip]);

  const handlePrevStep = useCallback(() => {
    setDragOffset(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      setCurrentStepIndex(-1);
    }
  }, [currentStepIndex]);

  // Keyboard navigation: Escape (Skip), Right (Next), Left (Back)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCompleteOrSkip();
      } else if (e.key === 'ArrowRight' && currentStepIndex >= 0) {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        e.preventDefault();
        handlePrevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, handleNextStep, handlePrevStep, handleCompleteOrSkip]);

  // Positioning calculations
  const pad = 6;
  const rectX = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const rectY = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const rectW = targetRect ? targetRect.width + pad * 2 : 0;
  const rectH = targetRect ? targetRect.height + pad * 2 : 0;

  const winW = viewportSize.width;
  const winH = viewportSize.height;
  const margin = 16;
  const cardW = Math.min(420, Math.max(280, winW - margin * 2));
  const cardH = Math.min(cardSize.height || 260, winH - margin * 2);

  const computeDefaultPosition = useCallback((): { left: number; top: number } => {
    if (!targetRect) {
      return {
        left: Math.round(Math.max(margin, (winW - cardW) / 2)),
        top: Math.round(Math.max(margin, (winH - cardH) / 2))
      };
    }

    const spaceBelow = winH - targetRect.bottom - margin;
    const spaceAbove = targetRect.top - margin;
    const spaceRight = winW - targetRect.right - margin;
    const spaceLeft = targetRect.left - margin;

    const preferred = currentStep?.preferredPlacement || 'bottom';
    let chosenPlacement: 'bottom' | 'top' | 'right' | 'left' = preferred;

    const fitsBelow = spaceBelow >= cardH + 12;
    const fitsAbove = spaceAbove >= cardH + 12;
    const fitsRight = spaceRight >= cardW + 12;
    const fitsLeft = spaceLeft >= cardW + 12;

    if (preferred === 'bottom' && fitsBelow) {
      chosenPlacement = 'bottom';
    } else if (preferred === 'top' && fitsAbove) {
      chosenPlacement = 'top';
    } else if (fitsBelow) {
      chosenPlacement = 'bottom';
    } else if (fitsAbove) {
      chosenPlacement = 'top';
    } else if (fitsRight) {
      chosenPlacement = 'right';
    } else if (fitsLeft) {
      chosenPlacement = 'left';
    } else {
      const maxVertical = Math.max(spaceBelow, spaceAbove);
      const maxHorizontal = Math.max(spaceRight, spaceLeft);
      if (maxVertical >= maxHorizontal) {
        chosenPlacement = spaceBelow >= spaceAbove ? 'bottom' : 'top';
      } else {
        chosenPlacement = spaceRight >= spaceLeft ? 'right' : 'left';
      }
    }

    let candidateLeft = targetRect.left + (targetRect.width - cardW) / 2;
    let candidateTop = targetRect.bottom + 12;

    if (chosenPlacement === 'bottom') {
      candidateTop = targetRect.bottom + 12;
      candidateLeft = targetRect.left + (targetRect.width - cardW) / 2;
    } else if (chosenPlacement === 'top') {
      candidateTop = targetRect.top - cardH - 12;
      candidateLeft = targetRect.left + (targetRect.width - cardW) / 2;
    } else if (chosenPlacement === 'right') {
      candidateLeft = targetRect.right + 12;
      candidateTop = targetRect.top + Math.max(0, (targetRect.height - cardH) / 2);
    } else if (chosenPlacement === 'left') {
      candidateLeft = targetRect.left - cardW - 12;
      candidateTop = targetRect.top + Math.max(0, (targetRect.height - cardH) / 2);
    }

    const clampedLeft = Math.max(margin, Math.min(candidateLeft, winW - cardW - margin));
    const clampedTop = Math.max(margin, Math.min(candidateTop, winH - cardH - margin));

    return {
      left: Math.round(clampedLeft),
      top: Math.round(clampedTop)
    };
  }, [targetRect, winW, winH, cardW, cardH, margin, currentStep]);

  const defaultPos = computeDefaultPosition();

  let cardLeft = defaultPos.left;
  let cardTop = defaultPos.top;

  // Viewport bounds clamping
  cardLeft = Math.max(margin, Math.min(cardLeft, winW - cardW - margin));
  cardTop = Math.max(margin, Math.min(cardTop, winH - cardH - margin));

  // Apply user drag offset if active
  if (dragOffset) {
    cardLeft = Math.max(margin, Math.min(cardLeft + dragOffset.x, winW - cardW - margin));
    cardTop = Math.max(margin, Math.min(cardTop + dragOffset.y, winH - cardH - margin));
  }

  // Drag handling with pointer capture (exact match with consumer portal)
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
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // silent
    }
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

  // CONDITIONAL RENDERING: ALL HOOKS HAVE BEEN EXECUTED BEFORE THIS POINT
  if (!isOpen) return null;

  // STEP 0: Initial Welcome Choice Modal
  if (currentStepIndex === -1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white dark:bg-[#141619] border border-slate-200 dark:border-[#292C32] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden p-6 sm:p-7">
          <div className="flex justify-between items-start">
            <div className="h-11 w-11 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <button
              onClick={handleCompleteOrSkip}
              className="text-slate-400 dark:text-[#7A808C] hover:text-slate-600 dark:hover:text-[#F3F4F5] p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#1E2227] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-[#F3F4F5] tracking-tight">
            Vigilance & Inspection Interactive Tour
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#9A9FA8] mt-2 leading-relaxed">
            Welcome to the operational workspace. This guided walkthrough moves through the live application, spotlighting key operational controls across the Priority Dashboard, Inspection Queue, GIS Map, Case Analysis, and Verified Field Audits.
          </p>

          <div className="mt-4 bg-slate-50 dark:bg-[#181B1F] border border-slate-200 dark:border-[#292C32] rounded-lg p-3 text-[11px] text-slate-600 dark:text-[#9A9FA8] space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-[#F3F4F5] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Interactive Cross-Page Walkthrough:</span>
            </div>
            <p className="text-slate-500 dark:text-[#7A808C] pl-5">
              Advances through the actual portal, highlighting real controls and data without modifying operational records. You can drag the tour dialog anytime to view obscured content.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCurrentStepIndex(0)}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors shadow-xs"
            >
              <span>Start Guided Tour</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCompleteOrSkip}
              className="flex-1 bg-slate-100 dark:bg-[#1E2227] hover:bg-slate-200 dark:hover:bg-[#252A30] text-slate-700 dark:text-[#D1D4DC] font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors"
            >
              I'm Familiar With The System
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1-N: Active Interactive Step Walkthrough
  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* 1. Full-screen Spotlight Mask SVG Cutout */}
      {targetRect && (
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-200"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={rectX}
                y={rectY}
                width={rectW}
                height={rectH}
                rx="8"
                ry="8"
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
            fill="rgba(15, 23, 42, 0.60)"
            mask="url(#tour-spotlight-mask)"
          />
          {/* Primary emerald highlight border around real element */}
          <rect
            x={rectX}
            y={rectY}
            width={rectW}
            height={rectH}
            rx="8"
            ry="8"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            className="filter drop-shadow-md"
          />
          {/* Secondary pulse ring */}
          <rect
            x={rectX - 3}
            y={rectY - 3}
            width={rectW + 6}
            height={rectH + 6}
            rx="11"
            ry="11"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            opacity="0.35"
          />
        </svg>
      )}

      {/* Dimmed backdrop when target is resolving */}
      {!targetRect && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity duration-200" />
      )}

      {/* 2. Draggable, Viewport-Clamped Tour Panel Card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-label={`Guided Tour: ${currentStep?.title}`}
        style={{
          position: 'fixed',
          left: `${cardLeft}px`,
          top: `${cardTop}px`,
          width: `${cardW}px`,
          maxHeight: `${Math.min(winH - margin * 2, 540)}px`,
          zIndex: 60,
          userSelect: isDragging ? 'none' : 'auto'
        }}
        className={`border rounded-xl shadow-2xl flex flex-col transition-shadow duration-150 animate-in fade-in zoom-in-95 ${
          isDark ? 'bg-[#141619] text-[#F3F4F5]' : 'bg-white text-slate-800'
        } ${
          isDragging
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-3xl'
            : isDark
              ? 'border-[#292C32]'
              : 'border-slate-200'
        }`}
      >
        {/* Dedicated Drag Handle Bar — Exact match with Consumer Portal */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`h-7 flex items-center justify-center cursor-grab active:cursor-grabbing border-b select-none transition-colors ${
            isDark
              ? 'bg-[#0B0C0E] border-[#292C32] text-[#6E737D] hover:text-[#9A9FA8]'
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
          }`}
          title="Drag to reposition tour window"
        >
          <GripHorizontal className="w-4 h-4 opacity-75" />
          <span className="text-[10px] uppercase font-mono tracking-wider ml-1.5 opacity-60">
            DRAG TO MOVE
          </span>
        </div>

        {/* Tooltip Header Strip */}
        <div className={`border-b px-4 py-2.5 flex items-center justify-between shrink-0 select-none ${
          isDark ? 'bg-[#181B1F] border-[#292C32]' : 'bg-slate-50/70 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            <span className={`text-[11px] tabular-nums font-bold px-2 py-0.5 rounded shrink-0 border ${
              isDark ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/60' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}>
              STEP {currentStepIndex + 1} OF {totalSteps}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider truncate ${
              isDark ? 'text-[#9A9FA8]' : 'text-slate-500'
            }`}>
              {currentStep?.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCompleteOrSkip}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isDark ? 'text-[#7A808C] hover:text-[#F3F4F5] hover:bg-[#1E2227]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/70'
            }`}
            title="Exit Tour (Escape)"
            aria-label="Exit tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Tooltip Content Body (Keeps buttons accessible) */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={`text-sm sm:text-base font-bold tracking-tight ${
              isDark ? 'text-[#F3F4F5]' : 'text-slate-900'
            }`}>
              {currentStep?.title}
            </h4>
            {location.pathname !== currentStep?.route && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 flex items-center gap-1 ${
                isDark ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
              }`}>
                <span>Navigating</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>

          <p className={`text-xs leading-relaxed min-h-[44px] ${
            isDark ? 'text-[#9A9FA8]' : 'text-slate-600'
          }`}>
            {currentStep?.description}
          </p>

          {/* Fallback note if element could not be spotted */}
          {!targetFound && !isResolving && (
            <div className={`mt-2.5 p-2 rounded text-[11px] ${
              isDark ? 'bg-[#1E2227] text-[#9A9FA8]' : 'bg-slate-100 text-slate-500'
            }`}>
              Target element is loading or out of view on this display resolution.
            </div>
          )}

          {/* Progress Indicator Bar */}
          <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
            isDark ? 'border-[#202328]' : 'border-slate-100'
          }`}>
            <div className="flex space-x-1">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-150 ${
                    idx === currentStepIndex
                      ? 'w-5 bg-emerald-600 dark:bg-emerald-500'
                      : idx < currentStepIndex
                        ? 'w-1.5 bg-emerald-300 dark:bg-emerald-800'
                        : isDark
                          ? 'w-1.5 bg-[#292C32]'
                          : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <span className={`text-[10px] tabular-nums font-medium ${
              isDark ? 'text-[#7A808C]' : 'text-slate-400'
            }`}>
              {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Completed
            </span>
          </div>
        </div>

        {/* Tooltip Action Buttons Footer — Always visible at bottom */}
        <div className={`border-t px-4 py-3 flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#181B1F] border-[#292C32]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={handlePrevStep}
            onPointerDown={e => e.stopPropagation()}
            className={`text-xs font-semibold flex items-center space-x-1 px-2.5 py-1.5 rounded transition-colors ${
              isDark ? 'text-[#9A9FA8] hover:text-[#F3F4F5] hover:bg-[#1E2227]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCompleteOrSkip}
              onPointerDown={e => e.stopPropagation()}
              className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                isDark ? 'text-[#7A808C] hover:text-[#F3F4F5] hover:bg-[#1E2227]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              Skip
            </button>
            <button
              onClick={handleNextStep}
              onPointerDown={e => e.stopPropagation()}
              className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <span>{currentStepIndex === totalSteps - 1 ? 'Finish Tour' : 'Next Step'}</span>
              {currentStepIndex === totalSteps - 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
