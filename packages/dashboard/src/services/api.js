/**
 * API Service - HTTP Client
 * Handles all API requests to the backend
 * @author fkndean_
 * @date 2025-10-14
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

/**
 * Get CSRF token from meta tag, cookie, or API endpoint
 * @returns {Promise<string|null>} CSRF token or null if not found
 */
async function getCsrfToken() {
  // Try to get from meta tag first (set by server)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }
  
  // Try to get from cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_csrf') {
      return decodeURIComponent(value);
    }
  }
  
  // Fallback: fetch from API endpoint
  try {
    const response = await fetch(`${API_URL}/api/csrf-token`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken || null;
    }
  } catch (error) {
    console.warn('Failed to fetch CSRF token from API:', error);
  }
  
  return null;
}

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
 * Request interceptor - adds CSRF token to requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Add CSRF token for POST, PUT, PATCH, DELETE requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      try {
        // Get CSRF token from meta tag, cookie, or API endpoint
        const csrfToken = await getCsrfToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      } catch (error) {
        console.warn('Failed to get CSRF token:', error);
      }
    }
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
    const isCheckingAuth = error.config?.url?.includes('/auth/me');
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
    getUser: () => apiClient.get('/auth/me'),
    getGuilds: () => apiClient.get('/auth/guilds'),
    refreshGuilds: () => apiClient.post('/auth/refresh-guilds'),
    logout: () => apiClient.post('/auth/logout'),
    loginUrl: () => `${API_URL}/auth/discord`,
    requestAccess: (data) => apiClient.post('/auth/request-access', data),
    getAccessStatus: () => apiClient.get('/auth/access-status')
  },

  // Plugin endpoints
  plugins: {
    getAll: () => apiClient.get('/plugins'),
    getById: (id) => apiClient.get(`/plugins/${id}`),
    create: (data) => apiClient.post('/plugins', data),
    update: (id, data) => apiClient.put(`/plugins/${id}`, data),
    toggleEnabled: (id, enabled) => apiClient.patch(`/plugins/${id}/toggle`, { enabled }),
    delete: (id) => apiClient.delete(`/plugins/${id}`),
    compile: (nodes, edges) => apiClient.post('/plugins/compile', { nodes, edges })
  },

  // Bot endpoints
  bot: {
    getStatus: () => apiClient.get('/bot/status'),
    getBotStatus: () => apiClient.get('/bot/bot-status'),
    getGuildCount: () => apiClient.get('/bot/guild-count'),
    getConfig: () => apiClient.get('/bot/config'),
    updateConfig: (key, value) => apiClient.put('/bot/config', { key, value }),
    getAuditLogs: (limit = 50) => apiClient.get(`/bot/audit?limit=${limit}`)
  },

  // Guild endpoints
  guilds: {
    getAll: () => apiClient.get('/guilds'),
    getById: (guildId) => apiClient.get(`/guilds/${guildId}`),
    getPlugins: (guildId) => apiClient.get(`/guilds/${guildId}/plugins/all`),
    togglePlugin: (guildId, pluginId, enabled) => apiClient.put(`/guilds/${guildId}/plugins/${pluginId}`, { enabled }),
    syncCommands: (guildId) => apiClient.post(`/guilds/${guildId}/sync`),
    getSettings: (guildId) => apiClient.get(`/guilds/${guildId}/settings`),
    updateSettings: (guildId, settings) => apiClient.put(`/guilds/${guildId}/settings`, { settings })
  },

  // Admin endpoints
    admin: {
      getUsers: () => apiClient.get('/admin/users'),
      toggleAdmin: (userId, isAdmin, adminNotes) => apiClient.put(`/admin/users/${userId}/toggle-admin`, { is_admin: isAdmin, admin_notes: adminNotes }),
      addAdmin: (discordId, adminNotes) => apiClient.post('/admin/users/add-admin', { discord_id: discordId, admin_notes: adminNotes }),
      getStats: () => apiClient.get('/admin/stats'),
      getAccessRequests: () => apiClient.get('/admin/access-requests'),
      approveAccess: (userId, message) => apiClient.post(`/admin/access-requests/${userId}/approve`, { message }),
      denyAccess: (userId, message) => apiClient.post(`/admin/access-requests/${userId}/deny`, { message }),
      revokeAccess: (userId, reason) => apiClient.post(`/admin/users/${userId}/revoke-access`, { reason }),
      grantAccess: (userId, message) => apiClient.post(`/admin/users/${userId}/grant-access`, { message })
    }
};

export default api;

