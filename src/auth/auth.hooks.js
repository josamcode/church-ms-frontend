import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../api/endpoints';
import {
  setTokens, setUser as storeUser, setPermissions as storePermissions,
  getUser, getPermissions, clearAuth, isAuthenticated,
  computeEffectivePermissions, getRefreshToken, getAccessToken,
} from './auth.store';
import { normalizeApiError } from '../api/errors';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [permissions, setPermissions] = useState(() => getPermissions());
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      const userData = data.data;
      setUser(userData);
      storeUser(userData);
      const perms = computeEffectivePermissions(userData);
      setPermissions(perms);
      storePermissions(perms);
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (normalized.statusCode === 401) {
        clearAuth();
        setUser(null);
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Restore access token from refresh token when opening app in a new tab (sessionStorage is not shared) */
  const restoreSessionIfNeeded = useCallback(async () => {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();
    if (refreshToken && !accessToken) {
      try {
        const { data } = await authApi.refresh(refreshToken);
        const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
        setTokens(newAccess, newRefresh);
      } catch {
        clearAuth();
        setUser(null);
        setPermissions([]);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await restoreSessionIfNeeded();
      if (!cancelled) hydrateUser();
    })();
    return () => { cancelled = true; };
  }, [restoreSessionIfNeeded, hydrateUser]);

  const login = useCallback(async (identifier, password) => {
    const { data } = await authApi.login({ identifier, password });
    const { user: userData, accessToken, refreshToken } = data.data;
    setTokens(accessToken, refreshToken);
    setUser(userData);
    storeUser(userData);
    const perms = computeEffectivePermissions(userData);
    setPermissions(perms);
    storePermissions(perms);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    const { user: userData, accessToken, refreshToken } = data.data;
    setTokens(accessToken, refreshToken);
    setUser(userData);
    storeUser(userData);
    const perms = computeEffectivePermissions(userData);
    setPermissions(perms);
    storePermissions(perms);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      await authApi.logout(refreshToken);
    } catch {
      // silent
    }
    clearAuth();
    setUser(null);
    setPermissions([]);
    toast.success('تم تسجيل الخروج بنجاح');
  }, []);

  const hasPermission = useCallback(
    (perm) => permissions.includes(perm),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms) => perms.some((p) => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms) => perms.every((p) => permissions.includes(p)),
    [permissions]
  );

  const value = {
    user,
    permissions,
    loading,
    login,
    register,
    logout,
    hydrateUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
