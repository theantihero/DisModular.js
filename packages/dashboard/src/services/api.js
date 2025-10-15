/**
 * API Service - HTTP Client
 * Handles all API requests to the backend
 * @author fkndean_
 * @date 2025-10-14
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

/**
 * Create axios instance with default config
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Don't redirect on 401 if we're checking auth or already on login page
    const isCheckingAuth = error.config?.url?.includes('/api/auth/me');
    const isOnLoginPage = window.location.pathname === '/login';
    
    if (error.response?.status === 401 && !isCheckingAuth && !isOnLoginPage) {
      // Redirect to login only if not already checking auth
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

/**
 * API Service
 */
export const api = {
  // Auth endpoints
  auth: {
    getUser: () => apiClient.get('/api/auth/me'),
    logout: () => apiClient.post('/api/auth/logout'),
    loginUrl: () => `${API_URL}/api/auth/discord`
  },

  // Plugin endpoints
  plugins: {
    getAll: () => apiClient.get('/api/plugins'),
    getById: (id) => apiClient.get(`/api/plugins/${id}`),
    create: (data) => apiClient.post('/api/plugins', data),
    update: (id, data) => apiClient.put(`/api/plugins/${id}`, data),
    delete: (id) => apiClient.delete(`/api/plugins/${id}`),
    compile: (nodes, edges) => apiClient.post('/api/plugins/compile', { nodes, edges })
  },

  // Bot endpoints
  bot: {
    getStatus: () => apiClient.get('/api/bot/status'),
    getConfig: () => apiClient.get('/api/bot/config'),
    updateConfig: (key, value) => apiClient.put('/api/bot/config', { key, value }),
    getAuditLogs: (limit = 50) => apiClient.get(`/api/bot/audit?limit=${limit}`)
  },

  // Admin endpoints
  admin: {
    getUsers: () => apiClient.get('/api/admin/users'),
    toggleAdmin: (userId, isAdmin, adminNotes) => apiClient.put(`/api/admin/users/${userId}/toggle-admin`, { is_admin: isAdmin, admin_notes: adminNotes }),
    addAdmin: (discordId, adminNotes) => apiClient.post('/api/admin/users/add-admin', { discord_id: discordId, admin_notes: adminNotes }),
    getStats: () => apiClient.get('/api/admin/stats'),
    getAnalytics: () => apiClient.get('/api/admin/analytics')
  }
};

export default api;

