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
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.patch(`/users/${id}`, data),
  remove: (id) => apiClient.delete(`/users/${id}`),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  lock: (id, lockReason) => apiClient.post(`/users/${id}/lock`, { lockReason }),
  unlock: (id) => apiClient.post(`/users/${id}/unlock`),
  manageTags: (id, data) => apiClient.post(`/users/${id}/tags`, data),
  linkFamily: (id, data) => apiClient.post(`/users/${id}/family/link`, data),
};

/* ══════════ Health ══════════ */

export const healthApi = {
  check: () => apiClient.get('/health'),
};
