import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/endpoints';
import { setUnauthorizedHandler, tokenStore } from '../api/client';
import { keyWallet } from '../lib/keyWallet';
import type { Role } from '../api/types';

export interface SessionUser {
  id: number;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthState {
  user: SessionUser | null;
  /** True while the stored token is being verified with GET /auth/me. */
  loading: boolean;
  /** Set when the session ended because the token was rejected or expired. */
  sessionMessage: string | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Reads the `exp` claim (seconds) without trusting anything else in the token. */
function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const endSession = useCallback((message: string | null) => {
    tokenStore.clear();
    keyWallet.clear();
    setUser(null);
    setSessionMessage(message);
  }, []);

  // A 401 from any API call ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => endSession('Your session has expired or is no longer valid. Please log in again.'));
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // On page load, re-validate a stored token with the server. The role shown in
  // the UI always comes from the backend, never from client-side storage.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((me) =>
        setUser({
          id: 'guestId' in me.profile ? me.profile.guestId : me.profile.staffId,
          role: me.role,
          firstName: me.profile.firstName,
          lastName: me.profile.lastName,
          email: me.profile.email,
        }),
      )
      .catch(() => endSession(null))
      .finally(() => setLoading(false));
  }, [endSession]);

  // Log out automatically when the JWT's expiry time is reached.
  useEffect(() => {
    const token = tokenStore.get();
    if (!user || !token) return;
    const exp = tokenExpiry(token);
    if (!exp) return;
    const timer = window.setTimeout(
      () => endSession('Your session has expired. Please log in again.'),
      Math.max(0, exp - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [user, endSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    tokenStore.set(res.accessToken);
    const sessionUser: SessionUser = {
      id: res.user.id,
      role: res.user.role,
      firstName: res.user.firstName,
      lastName: res.user.lastName,
      email: res.user.email,
    };
    setSessionMessage(null);
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const logout = useCallback(() => endSession(null), [endSession]);

  const value = useMemo(
    () => ({ user, loading, sessionMessage, login, logout }),
    [user, loading, sessionMessage, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
