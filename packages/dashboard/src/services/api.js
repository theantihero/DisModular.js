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
    getGuilds: () => apiClient.get('/api/auth/guilds'),
    refreshGuilds: () => apiClient.post('/api/auth/refresh-guilds'),
    logout: () => apiClient.post('/api/auth/logout'),
    loginUrl: () => `${API_URL}/api/auth/discord`,
    requestAccess: (data) => apiClient.post('/api/auth/request-access', data),
    getAccessStatus: () => apiClient.get('/api/auth/access-status')
  },

  // Plugin endpoints
  plugins: {
    getAll: () => apiClient.get('/api/plugins'),
    getById: (id) => apiClient.get(`/api/plugins/${id}`),
    create: (data) => apiClient.post('/api/plugins', data),
    update: (id, data) => apiClient.put(`/api/plugins/${id}`, data),
    toggleEnabled: (id, enabled) => apiClient.patch(`/api/plugins/${id}/toggle`, { enabled }),
    delete: (id) => apiClient.delete(`/api/plugins/${id}`),
    compile: (nodes, edges) => apiClient.post('/api/plugins/compile', { nodes, edges })
  },

  // Bot endpoints
  bot: {
    getStatus: () => apiClient.get('/api/bot/status'),
    getBotStatus: () => apiClient.get('/api/bot/bot-status'),
    getConfig: () => apiClient.get('/api/bot/config'),
    updateConfig: (key, value) => apiClient.put('/api/bot/config', { key, value }),
    getAuditLogs: (limit = 50) => apiClient.get(`/api/bot/audit?limit=${limit}`)
  },

  // Guild endpoints
  guilds: {
    getAll: () => apiClient.get('/api/guilds'),
    getById: (guildId) => apiClient.get(`/api/guilds/${guildId}`),
    getPlugins: (guildId) => apiClient.get(`/api/guilds/${guildId}/plugins/all`),
    togglePlugin: (guildId, pluginId, enabled) => apiClient.put(`/api/guilds/${guildId}/plugins/${pluginId}`, { enabled }),
    syncCommands: (guildId) => apiClient.post(`/api/guilds/${guildId}/sync`),
    getSettings: (guildId) => apiClient.get(`/api/guilds/${guildId}/settings`),
    updateSettings: (guildId, settings) => apiClient.put(`/api/guilds/${guildId}/settings`, { settings })
  },

  // Admin endpoints
    admin: {
      getUsers: () => apiClient.get('/api/admin/users'),
      toggleAdmin: (userId, isAdmin, adminNotes) => apiClient.put(`/api/admin/users/${userId}/toggle-admin`, { is_admin: isAdmin, admin_notes: adminNotes }),
      addAdmin: (discordId, adminNotes) => apiClient.post('/api/admin/users/add-admin', { discord_id: discordId, admin_notes: adminNotes }),
      getStats: () => apiClient.get('/api/admin/stats'),
      getAccessRequests: () => apiClient.get('/api/admin/access-requests'),
      approveAccess: (userId, message) => apiClient.post(`/api/admin/access-requests/${userId}/approve`, { message }),
      denyAccess: (userId, message) => apiClient.post(`/api/admin/access-requests/${userId}/deny`, { message }),
      revokeAccess: (userId, reason) => apiClient.post(`/api/admin/users/${userId}/revoke-access`, { reason }),
      grantAccess: (userId, message) => apiClient.post(`/api/admin/users/${userId}/grant-access`, { message })
    }
};

export default api;

