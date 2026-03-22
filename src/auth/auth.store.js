import { computeEffectivePermissionsForRole } from '../constants/permissions';

const ACCESS_TOKEN_KEY = 'church_access_token';
const REFRESH_TOKEN_KEY = 'church_refresh_token';
const USER_KEY = 'church_user';
const PERMISSIONS_KEY = 'church_permissions';

let memoryAccessToken = null;

function migrateLegacyValue(key) {
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue != null) {
    return sessionValue;
  }

  const legacyValue = localStorage.getItem(key);
  if (legacyValue != null) {
    sessionStorage.setItem(key, legacyValue);
    localStorage.removeItem(key);
  }

  return legacyValue;
}

function writeSessionValue(key, value) {
  if (value == null || value === '') {
    sessionStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, value);
}

function removeStoredValue(key) {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export function getAccessToken() {
  return memoryAccessToken || migrateLegacyValue(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return migrateLegacyValue(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken, refreshToken) {
  memoryAccessToken = accessToken || null;
  writeSessionValue(ACCESS_TOKEN_KEY, accessToken || null);
  writeSessionValue(REFRESH_TOKEN_KEY, refreshToken || null);
}

export function setUser(user) {
  if (user) {
    writeSessionValue(USER_KEY, JSON.stringify(user));
  } else {
    removeStoredValue(USER_KEY);
  }
}

export function getUser() {
  try {
    const raw = migrateLegacyValue(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    removeStoredValue(USER_KEY);
    return null;
  }
}

export function setPermissions(permissions) {
  if (permissions) {
    writeSessionValue(PERMISSIONS_KEY, JSON.stringify(permissions));
  } else {
    removeStoredValue(PERMISSIONS_KEY);
  }
}

export function getPermissions() {
  try {
    const raw = migrateLegacyValue(PERMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    removeStoredValue(PERMISSIONS_KEY);
    return [];
  }
}

export function clearAuth() {
  memoryAccessToken = null;
  removeStoredValue(ACCESS_TOKEN_KEY);
  removeStoredValue(REFRESH_TOKEN_KEY);
  removeStoredValue(USER_KEY);
  removeStoredValue(PERMISSIONS_KEY);
}

export function isAuthenticated() {
  return !!(getAccessToken() && getRefreshToken());
}

export function computeEffectivePermissions(user) {
  if (!user) return [];
  return computeEffectivePermissionsForRole(
    user.role,
    user.extraPermissions || [],
    user.deniedPermissions || []
  );
}
