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

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'USERS_VIEW', 'USERS_VIEW_SELF', 'USERS_CREATE', 'USERS_UPDATE',
    'USERS_UPDATE_SELF', 'USERS_DELETE', 'USERS_LOCK', 'USERS_UNLOCK',
    'USERS_TAGS_MANAGE', 'USERS_FAMILY_LINK', 'USERS_UPLOAD_AVATAR',
    'USERS_UPLOAD_AVATAR_SELF', 'AUTH_VIEW_SELF', 'AUTH_MANAGE_SESSIONS',
    'AUTH_CHANGE_PASSWORD', 'CONFESSIONS_VIEW', 'CONFESSIONS_CREATE',
    'CONFESSIONS_ASSIGN_USER', 'CONFESSIONS_SESSION_TYPES_MANAGE',
    'CONFESSIONS_ALERTS_VIEW', 'CONFESSIONS_ALERTS_MANAGE',
    'CONFESSIONS_ANALYTICS_VIEW', 'PASTORAL_VISITATIONS_VIEW', 'PASTORAL_VISITATIONS_CREATE',
    'PASTORAL_VISITATIONS_ANALYTICS_VIEW',
  ],
  ADMIN: [
    'USERS_VIEW', 'USERS_VIEW_SELF', 'USERS_CREATE', 'USERS_UPDATE',
    'USERS_UPDATE_SELF', 'USERS_DELETE', 'USERS_LOCK', 'USERS_UNLOCK',
    'USERS_TAGS_MANAGE', 'USERS_FAMILY_LINK', 'USERS_UPLOAD_AVATAR',
    'USERS_UPLOAD_AVATAR_SELF', 'AUTH_VIEW_SELF', 'AUTH_CHANGE_PASSWORD',
    'CONFESSIONS_VIEW', 'CONFESSIONS_CREATE', 'CONFESSIONS_ASSIGN_USER',
    'CONFESSIONS_SESSION_TYPES_MANAGE', 'CONFESSIONS_ALERTS_VIEW',
    'CONFESSIONS_ALERTS_MANAGE', 'CONFESSIONS_ANALYTICS_VIEW',
    'PASTORAL_VISITATIONS_VIEW', 'PASTORAL_VISITATIONS_CREATE',
    'PASTORAL_VISITATIONS_ANALYTICS_VIEW',
  ],
  USER: [
    'AUTH_VIEW_SELF', 'AUTH_CHANGE_PASSWORD', 'USERS_VIEW_SELF',
    'USERS_UPDATE_SELF', 'USERS_UPLOAD_AVATAR_SELF',
  ],
};

export function computeEffectivePermissions(user) {
  if (!user) return [];
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  const extra = user.extraPermissions || [];
  const denied = user.deniedPermissions || [];
  const effectiveSet = new Set([...rolePerms, ...extra]);
  denied.forEach((p) => effectiveSet.delete(p));
  return [...effectiveSet];
}
