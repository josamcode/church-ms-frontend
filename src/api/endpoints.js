import apiClient from './client';

/* ══════════ Auth ══════════ */

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
  me: () => apiClient.get('/auth/me'),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
};

/* ══════════ Users ══════════ */

export const usersApi = {
  list: (params) => apiClient.get('/users', { params }),
  getById: (id) => apiClient.get(`/users/${id}`),
  getCustomDetailKeys: () => apiClient.get('/users/custom-detail-keys'),
  getFamilyNames: () => apiClient.get('/users/family-names'),
  getHouseNames: () => apiClient.get('/users/house-names'),
  getRelationRoles: () => apiClient.get('/users/relation-roles'),
  createRelationRole: (label) => apiClient.post('/users/relation-roles', { label }),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.patch(`/users/${id}`, data),
  remove: (id) => apiClient.delete(`/users/${id}`),
  /** Upload image only (for new user). Returns { url, publicId }. */
  uploadAvatarImage: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/users/upload-avatar', formData);
  },
  /** Upload and set avatar for existing user. */
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post(`/users/${id}/avatar`, formData);
  },
  lock: (id, lockReason) => apiClient.post(`/users/${id}/lock`, { lockReason }),
  unlock: (id) => apiClient.post(`/users/${id}/unlock`),
  manageTags: (id, data) => apiClient.post(`/users/${id}/tags`, data),
  linkFamily: (id, data) => apiClient.post(`/users/${id}/family/link`, data),
};

/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ Confessions â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */

export const confessionsApi = {
  listSessions: (params) => apiClient.get('/confessions/sessions', { params }),
  createSession: (data) => apiClient.post('/confessions/sessions', data),

  getSessionTypes: () => apiClient.get('/confessions/session-types'),
  createSessionType: (name) => apiClient.post('/confessions/session-types', { name }),

  searchUsers: (params) => apiClient.get('/confessions/users/search', { params }),

  getAlertConfig: () => apiClient.get('/confessions/config'),
  updateAlertConfig: (alertThresholdDays) =>
    apiClient.patch('/confessions/config', { alertThresholdDays }),
  getAlerts: (params) => apiClient.get('/confessions/alerts', { params }),

  getAnalytics: (params) => apiClient.get('/confessions/analytics', { params }),
};

export const visitationsApi = {
  list: (params) => apiClient.get('/visitations', { params }),
  create: (data) => apiClient.post('/visitations', data),
  getById: (id) => apiClient.get(`/visitations/${id}`),
  getAnalytics: (params) => apiClient.get('/visitations/analytics', { params }),
};

export const meetingsApi = {
  sectors: {
    list: (params) => apiClient.get('/meetings/sectors', { params }),
    create: (data) => apiClient.post('/meetings/sectors', data),
    uploadAvatarImage: (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiClient.post('/meetings/sectors/upload-avatar', formData);
    },
    getById: (id) => apiClient.get(`/meetings/sectors/${id}`),
    update: (id, data) => apiClient.patch(`/meetings/sectors/${id}`, data),
    remove: (id) => apiClient.delete(`/meetings/sectors/${id}`),
  },
  meetings: {
    list: (params) => apiClient.get('/meetings', { params }),
    create: (data) => apiClient.post('/meetings', data),
    getById: (id) => apiClient.get(`/meetings/${id}`),
    updateBasic: (id, data) => apiClient.patch(`/meetings/${id}/basic`, data),
    updateServants: (id, servants) => apiClient.patch(`/meetings/${id}/servants`, { servants }),
    updateCommittees: (id, committees) => apiClient.patch(`/meetings/${id}/committees`, { committees }),
    updateActivities: (id, activities) => apiClient.patch(`/meetings/${id}/activities`, { activities }),
    remove: (id) => apiClient.delete(`/meetings/${id}`),
  },
  responsibilities: {
    list: (params) => apiClient.get('/meetings/responsibilities', { params }),
  },
  servants: {
    history: (params) => apiClient.get('/meetings/servants/history', { params }),
  },
};

/* ══════════ Health ══════════ */

export const healthApi = {
  check: () => apiClient.get('/health'),
};
