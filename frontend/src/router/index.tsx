import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';

// Route-level code splitting for performance and bundle size reduction
const LandingPage = lazy(() => import('../pages/LandingPage').then(m => ({ default: m.LandingPage })));
const ConsumerLogin = lazy(() => import('../pages/ConsumerLogin').then(m => ({ default: m.ConsumerLogin })));
const ConsumerDashboard = lazy(() => import('../pages/ConsumerDashboard').then(m => ({ default: m.ConsumerDashboard })));
const BoardCommunicationPage = lazy(() => import('../pages/BoardCommunicationPage').then(m => ({ default: m.BoardCommunicationPage })));
const BoardAdminLogin = lazy(() => import('../pages/BoardAdminLogin').then(m => ({ default: m.BoardAdminLogin })));
const BoardAdminWorkspace = lazy(() => import('../pages/BoardAdminWorkspace').then(m => ({ default: m.BoardAdminWorkspace })));
const Login = lazy(() => import('../pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Inspections = lazy(() => import('../pages/Inspections').then(m => ({ default: m.Inspections })));
const CaseDetail = lazy(() => import('../pages/CaseDetail').then(m => ({ default: m.CaseDetail })));
const MapView = lazy(() => import('../pages/MapView').then(m => ({ default: m.MapView })));
const Reports = lazy(() => import('../pages/Reports').then(m => ({ default: m.Reports })));
const ModelGovernance = lazy(() => import('../pages/ModelGovernance').then(m => ({ default: m.ModelGovernance })));
const Help = lazy(() => import('../pages/Help').then(m => ({ default: m.Help })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-[#2B59FF] dark:border-[#8AA8FF] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[#6E737D] font-medium tracking-wide">Loading workspace module...</span>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
      {/* 1. Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Public Board Communication Feed */}
      <Route path="/board-communication" element={<BoardCommunicationPage />} />

      {/* 3. Consumer Portal Entry Points */}
      <Route
        path="/consumer-portal"
        element={
          user?.role === 'CONSUMER' ? (
            <Navigate to="/consumer/dashboard" replace />
          ) : (
            <Navigate to="/consumer/login" replace />
          )
        }
      />
      <Route
        path="/consumer/login"
        element={
          user?.role === 'CONSUMER' ? (
            <Navigate to="/consumer/dashboard" replace />
          ) : (
            <ConsumerLogin />
          )
        }
      />

      {/* 4. Protected Consumer Workspace */}
      <Route element={<ProtectedRoute allowedRoles={['CONSUMER']} redirectTo="/consumer/login" />}>
        <Route path="/consumer" element={<Navigate to="/consumer/dashboard" replace />} />
        <Route path="/consumer/dashboard" element={<ConsumerDashboard />} />
      </Route>

      {/* 5. Board Communication Admin Entry Points */}
      <Route
        path="/board-admin/login"
        element={
          user?.role === 'BOARD_COMMUNICATION_ADMIN' ? (
            <Navigate to="/board-admin" replace />
          ) : (
            <BoardAdminLogin />
          )
        }
      />
      <Route element={<ProtectedRoute allowedRoles={['BOARD_COMMUNICATION_ADMIN']} redirectTo="/board-admin/login" />}>
        <Route path="/board-admin" element={<BoardAdminWorkspace />} />
      </Route>

      {/* 6. Employee Sign In */}
      <Route
        path="/login"
        element={
          user?.role === 'INSPECTION_EMPLOYEE' ? (
            <Navigate to="/employee/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/employee/login"
        element={<Navigate to="/login" replace />}
      />

      {/* 7. Protected Employee Workspace */}
      <Route element={<ProtectedRoute allowedRoles={['INSPECTION_EMPLOYEE']} redirectTo="/login" />}>
        <Route path="/employee" element={<AppLayout />}>
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="inspections/:caseId" element={<CaseDetail />} />
          <Route path="map" element={<MapView />} />
          <Route path="reports" element={<Reports />} />
          <Route path="model-governance" element={<ModelGovernance />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Route>

      {/* 8. Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};
