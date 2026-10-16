/**
 * Authentication & Session Context
 * Manages JWT tokens, user profile state, and role authorization checks.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateOnboardingStatus: (completed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      if (profile.role) {
        localStorage.setItem('auth_role', profile.role);
      }
    } catch {
      setUser(null);
      api.clearToken();
      localStorage.removeItem('auth_role');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username_or_email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      await api.login(username_or_email, pass);
      const profile = await api.getProfile();
      setUser(profile);
      if (profile.role) {
        localStorage.setItem('auth_role', profile.role);
      }
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Determine active authenticated role before clearing session state
    const activeRole = user?.role || (localStorage.getItem('auth_role') as any);
    api.clearToken();
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    sessionStorage.clear();
    setUser(null);

    // Explicit, role-aware sign-out navigation
    if (activeRole === 'CONSUMER') {
      window.location.href = '/consumer/login';
    } else if (activeRole === 'BOARD_COMMUNICATION_ADMIN') {
      window.location.href = '/board-admin/login';
    } else {
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    if (localStorage.getItem('auth_token')) {
      await fetchProfile();
    }
  };

  const updateOnboardingStatus = (completed: boolean) => {
    if (user) {
      setUser({ ...user, onboarding_completed: completed });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateOnboardingStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
