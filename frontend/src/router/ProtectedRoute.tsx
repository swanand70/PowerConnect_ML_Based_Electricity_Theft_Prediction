import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = ['INSPECTION_EMPLOYEE'],
  redirectTo
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-slate-500">Verifying operational credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const targetRedirect = redirectTo || (
      allowedRoles.includes('CONSUMER') 
        ? '/consumer/login' 
        : allowedRoles.includes('BOARD_COMMUNICATION_ADMIN')
        ? '/board-admin/login'
        : '/login'
    );
    return <Navigate to={targetRedirect} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full shadow-lg text-center space-y-3">
          <div className="h-12 w-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Access Denied (HTTP 403)</h2>
          <p className="text-xs text-slate-600">
            Your current account role (<strong>{user.role}</strong>) does not have authorization to access this portal.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <a
              href="/"
              className="inline-block bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-md hover:bg-slate-300"
            >
              Public Home
            </a>
            {user.role === 'CONSUMER' && (
              <a
                href="/consumer/dashboard"
                className="inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Consumer Portal
              </a>
            )}
            {user.role === 'INSPECTION_EMPLOYEE' && (
              <a
                href="/employee/dashboard"
                className="inline-block bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-emerald-800"
              >
                Inspection Workspace
              </a>
            )}
            {user.role === 'BOARD_COMMUNICATION_ADMIN' && (
              <a
                href="/board-admin"
                className="inline-block bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Board Admin
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
