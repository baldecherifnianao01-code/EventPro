import React, { createContext, useCallback, useContext, useState } from 'react';
import type { AuthUser, Profile } from '../types.ts';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  profile: Profile | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  apiFetch: <T = unknown>(url: string, init?: RequestInit) => Promise<T>;
  setSession: (token: string, user: AuthUser, profile: Profile | null) => void;
  updateProfileState: (profile: Profile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Token kept strictly in React memory (never persisted in localStorage/sessionStorage)
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    profile: null,
  });

  const setSession = useCallback((token: string, user: AuthUser, profile: Profile | null) => {
    setState({ token, user, profile });
  }, []);

  const updateProfileState = useCallback((profile: Profile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setState({ token: null, user: null, profile: null });
  }, []);

  const apiFetch = useCallback(
    async <T = unknown>(url: string, init?: RequestInit): Promise<T> => {
      const headers = new Headers(init?.headers || {});
      if (!headers.has('Content-Type') && init?.body) {
        headers.set('Content-Type', 'application/json');
      }
      if (state.token) {
        headers.set('Authorization', `Bearer ${state.token}`);
      }
      const res = await fetch(url, { ...init, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Erreur serveur (${res.status})`);
      }
      return data as T;
    },
    [state.token]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: Boolean(state.token && state.user),
        isAdmin: Boolean(state.user && (state.user.role === 'admin' || state.user.role === 'manager')),
        apiFetch,
        setSession,
        updateProfileState,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
