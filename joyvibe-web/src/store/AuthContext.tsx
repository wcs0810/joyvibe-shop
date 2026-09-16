import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { apiAuth } from '@/lib/api';

export interface AuthUser {
  id: string;
  username: string;
  phone: string;
  avatar: string;
  email?: string;
  gender?: '男' | '女' | '保密';
  birthday?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  logoutPhase: 'idle' | 'confirm' | 'clearing' | 'redirecting' | 'success';
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  openLogoutConfirm: () => void;
  closeLogoutConfirm: () => void;
  confirmLogout: () => Promise<void>;
  cancelLogout: () => void;
  completeLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'jy_auth';
const TOKEN_STORAGE_KEY = 'jy_token';
const ALL_STORAGE_KEYS = [
  'jy_auth',
  'jy_token',
  'jy_profile',
  'jy_addresses',
  'jy_cart',
  'jy_coupon',
];

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch { /* ignore */ }
}

function loadAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    /* ignore */
  }
  return null;
}

function clearAllAuthData() {
  for (const key of ALL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try { sessionStorage.clear(); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadAuth);
  const [logoutPhase, setLogoutPhase] = useState<AuthContextValue['logoutPhase']>('idle');

  // On mount, verify existing token against backend
  useEffect(() => {
    const token = loadToken();
    if (!token) return;
    apiAuth.me(token).then((res) => {
      if (res.ok && res.data) {
        const { id, username, phone, avatar } = res.data;
        const authUser: AuthUser = { id, username, phone, avatar };
        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } else {
        // Token invalid — clear everything
        clearAllAuthData();
        setUser(null);
      }
    }).catch(() => {
      // Backend unreachable — keep local data for offline mode
    });
  }, []);

  const isAuthenticated = user !== null;
  const isLoggingOut = logoutPhase !== 'idle' && logoutPhase !== 'success';

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Try backend first
    const res = await apiAuth.login(username, password);
    if (res.ok && res.data) {
      const { token, user: apiUser } = res.data;
      saveToken(token);
      const authUser: AuthUser = {
        id: apiUser.id,
        username: apiUser.username,
        phone: apiUser.phone,
        avatar: apiUser.avatar,
      };
      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return true;
    }

    // Fallback: local demo mode (any credentials work)
    console.warn('[Auth] Backend unreachable or login failed, using demo mode:', res.error);
    await new Promise((r) => setTimeout(r, 500));
    const demoUser: AuthUser = {
      id: 'demo-' + Date.now(),
      username: username || '访客',
      phone: '138****0000',
      avatar: (username || '访').charAt(0).toUpperCase(),
    };
    setUser(demoUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
    return true;
  }, []);

  const openLogoutConfirm = useCallback(() => setLogoutPhase('confirm'), []);
  const closeLogoutConfirm = useCallback(() => {
    if (logoutPhase === 'confirm') setLogoutPhase('idle');
  }, [logoutPhase]);

  const cancelLogout = useCallback(() => {
    if (logoutPhase === 'confirm') setLogoutPhase('idle');
  }, [logoutPhase]);

  const confirmLogout = useCallback(async () => {
    setLogoutPhase('clearing');

    // Try to notify backend
    const token = loadToken();
    if (token) {
      try { await apiAuth.logout(token); } catch { /* ignore */ }
    }
    await new Promise((r) => setTimeout(r, 400));

    clearAllAuthData();
    setUser(null);

    setLogoutPhase('redirecting');
    await new Promise((r) => setTimeout(r, 500));
    setLogoutPhase('success');
  }, []);

  const completeLogout = useCallback(() => {
    setLogoutPhase('idle');
    window.location.href = '/';
  }, []);

  const logout = useCallback(() => {
    const token = loadToken();
    if (token) apiAuth.logout(token).catch(() => { /* ignore */ });
    clearAllAuthData();
    setUser(null);
    setLogoutPhase('idle');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoggingOut,
      logoutPhase,
      login,
      logout,
      openLogoutConfirm,
      closeLogoutConfirm,
      confirmLogout,
      cancelLogout,
      completeLogout,
    }),
    [user, isAuthenticated, isLoggingOut, logoutPhase, login, logout, openLogoutConfirm, closeLogoutConfirm, confirmLogout, cancelLogout, completeLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Helper: get current token
export function getAuthToken(): string | null {
  return loadToken();
}
