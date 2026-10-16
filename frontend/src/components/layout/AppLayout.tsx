import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { GuidedTourModal } from '../onboarding/GuidedTourModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tourOpen, setTourOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    // Default to false (collapsed) for clean, content-first presentation
    return (localStorage.getItem('sidebar_expanded') ?? localStorage.getItem('opgrid_sidebar_open')) === 'true';
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_expanded', String(next));
      return next;
    });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    localStorage.setItem('sidebar_expanded', 'false');
  };

  // Keyboard shortcut: Alt+M or Ctrl+B to toggle sidebar, Escape to close if open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'm') || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Auto-trigger guided tour on first login if onboarding is not completed
  useEffect(() => {
    if (user && user.onboarding_completed === false) {
      setTourOpen(true);
    }
  }, [user]);

  return (
    <div
      className={`flex h-screen overflow-hidden employee-workspace transition-colors ${
        isDark ? 'bg-[#0B0C0E] text-[#F3F4F5]' : 'bg-slate-100 text-slate-800'
      }`}
    >
      {/* Mobile/Tablet Backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 z-35 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Collapsible Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area: Reclaims 100% horizontal space when sidebar is collapsed */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          onStartTour={() => setTourOpen(true)}
        />
        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-200 ${
            isDark ? 'bg-[#0B0C0E] text-[#F3F4F5]' : 'bg-slate-50 text-slate-800'
          }`}
        >
          <Outlet />
        </main>
      </div>

      <GuidedTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
};
