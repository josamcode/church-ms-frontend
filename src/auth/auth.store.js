import { PERMISSIONS, ROLE_PERMISSIONS } from '../constants/permissions';

const ACCESS_TOKEN_KEY = 'church_access_token';
const REFRESH_TOKEN_KEY = 'church_refresh_token';
const USER_KEY = 'church_user';
const PERMISSIONS_KEY = 'church_permissions';

let memoryAccessToken = null;

export function getAccessToken() {
  return memoryAccessToken || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken, refreshToken) {
  memoryAccessToken = accessToken;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function setUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPermissions(permissions) {
  if (permissions) {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  }
}

export function getPermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearAuth() {
  memoryAccessToken = null;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
}

export function isAuthenticated() {
  return !!(getAccessToken() && getRefreshToken());
}

export function computeEffectivePermissions(user) {
  if (!user) return [];
  if (user.role === 'SUPER_ADMIN') return [...PERMISSIONS];
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  const extra = user.extraPermissions || [];
  const denied = user.deniedPermissions || [];
  const effectiveSet = new Set([...rolePerms, ...extra]);
  denied.forEach((p) => effectiveSet.delete(p));
  return [...effectiveSet];
}
