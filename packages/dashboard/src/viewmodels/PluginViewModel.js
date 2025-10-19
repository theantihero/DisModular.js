/**
 * Plugin ViewModel - State Management
 * MVVM pattern - manages plugin state and business logic
 * @author fkndean_
 * @date 2025-10-14
 */

import { create } from 'zustand';
import api from '../services/api';

/**
 * Plugin Store
 */
export const usePluginStore = create((set, get) => ({
  // State
  plugins: [],
  currentPlugin: null,
  isLoading: false,
  error: null,

  // Actions
  setPlugins: (plugins) => set({ plugins }),
  
  setCurrentPlugin: (plugin) => set({ currentPlugin: plugin }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  /**
   * Fetch all plugins
   */
  fetchPlugins: async (retryCount = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.plugins.getAll();
      const plugins = response?.data || [];
      set({ plugins: Array.isArray(plugins) ? plugins : [], isLoading: false });
      return plugins;
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to fetch plugins';
      
      // Retry logic (max 2 retries)
      if (retryCount < 2 && !error.response?.status === 401) {
        // Retrying fetch plugins
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return get().fetchPlugins(retryCount + 1);
      }
      
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch plugin by ID
   */
  fetchPlugin: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.plugins.getById(id);
      set({ currentPlugin: response?.data || null, isLoading: false });
      return response?.data || null;
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to fetch plugin';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Get plugin by ID (alias for fetchPlugin)
   */
  getPluginById: async (id) => {
    return get().fetchPlugin(id);
  },

  /**
   * Create new plugin
   */
  createPlugin: async (pluginData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.plugins.create(pluginData);
      
      // Refresh plugins list
      await get().fetchPlugins();
      
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ error: error.error || 'Failed to create plugin', isLoading: false });
      throw error;
    }
  },

  /**
   * Update existing plugin
   */
  updatePlugin: async (id, pluginData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.plugins.update(id, pluginData);
      
      // Fetch updated plugin data from server to ensure consistency
      const updatedPlugin = await api.plugins.getById(id);
      
      // Update in local state
      const plugins = get().plugins.map(p => 
        p.id === id ? updatedPlugin.data : p
      );
      set({ plugins, currentPlugin: updatedPlugin.data, isLoading: false });
      
      return updatedPlugin.data;
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to update plugin';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Toggle plugin enabled status (optimized for performance)
   */
  togglePluginEnabled: async (id, enabled) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.plugins.toggleEnabled(id, enabled);
      
      // Update in local state immediately for better UX
      const plugins = get().plugins.map(p => 
        p.id === id ? { ...p, enabled: enabled } : p
      );
      set({ plugins, isLoading: false });
      
      return response;
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to toggle plugin status';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Delete plugin
   */
  deletePlugin: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.plugins.delete(id);
      
      // Remove from local state
      const plugins = get().plugins.filter(p => p.id !== id);
      set({ plugins, isLoading: false });
      
      return true;
    } catch (error) {
      set({ error: error.error || 'Failed to delete plugin', isLoading: false });
      throw error;
    }
  },

  /**
   * Compile node graph
   */
  compilePlugin: async (nodes, edges) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.plugins.compile(nodes, edges);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ error: error.error || 'Failed to compile plugin', isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch guild-specific plugins
   */
  fetchGuildPlugins: async (guildId, retryCount = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.guilds.getPlugins(guildId);
      const plugins = response?.data || [];
      set({ plugins: Array.isArray(plugins) ? plugins : [], isLoading: false });
      return plugins;
    } catch (error) {
      let errorMessage = 'Failed to fetch guild plugins';
      
      // Provide more specific error messages based on the error
      if (error.error) {
        if (error.error.includes('Admin privileges required')) {
          errorMessage = 'You need admin permissions in this Discord server to manage plugins.';
        } else if (error.error.includes('Guild not found')) {
          errorMessage = 'This Discord server was not found. The bot may not be in this server.';
        } else if (error.error.includes('not a member')) {
          errorMessage = 'You are not a member of this Discord server.';
        } else if (error.error.includes('Rate limited')) {
          const retryAfter = error.retry_after || 1;
          errorMessage = `Rate limited by Discord. Please wait ${retryAfter} seconds and try again.`;
        } else {
          errorMessage = error.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Retry logic (max 2 retries, but not for auth errors or rate limits)
      if (retryCount < 2 && error.response?.status !== 401 && error.response?.status !== 429) {
        // Retrying fetch guild plugins
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return get().fetchGuildPlugins(guildId, retryCount + 1);
      }
      
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Toggle plugin enabled status for a specific guild
   */
  toggleGuildPlugin: async (guildId, pluginId, enabled) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.guilds.togglePlugin(guildId, pluginId, enabled);
      
      // Update in local state immediately for better UX
      const plugins = get().plugins.map(p => 
        p.id === pluginId ? { ...p, guild_enabled: enabled } : p
      );
      set({ plugins, isLoading: false });
      
      return response;
    } catch (error) {
      let errorMessage = 'Failed to toggle guild plugin status';
      
      // Provide more specific error messages based on the error
      if (error.error) {
        if (error.error.includes('Admin privileges required')) {
          errorMessage = 'You need admin permissions in this Discord server to modify plugins.';
        } else if (error.error.includes('Guild not found')) {
          errorMessage = 'This Discord server was not found. The bot may not be in this server.';
        } else if (error.error.includes('not a member')) {
          errorMessage = 'You are not a member of this Discord server.';
        } else if (error.error.includes('Rate limited')) {
          const retryAfter = error.retry_after || 1;
          errorMessage = `Rate limited by Discord. Please wait ${retryAfter} seconds and try again.`;
        } else {
          errorMessage = error.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch guild settings
   */
  fetchGuildSettings: async (guildId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.guilds.getSettings(guildId);
      set({ isLoading: false });
      return response;
    } catch (error) {
      let errorMessage = 'Failed to fetch guild settings';
      
      // Provide more specific error messages based on the error
      if (error.error) {
        if (error.error.includes('Admin privileges required')) {
          errorMessage = 'You need admin permissions in this Discord server to view settings.';
        } else if (error.error.includes('Guild not found')) {
          errorMessage = 'This Discord server was not found. The bot may not be in this server.';
        } else if (error.error.includes('not a member')) {
          errorMessage = 'You are not a member of this Discord server.';
        } else if (error.error.includes('Rate limited')) {
          const retryAfter = error.retry_after || 1;
          errorMessage = `Rate limited by Discord. Please wait ${retryAfter} seconds and try again.`;
        } else {
          errorMessage = error.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update guild settings
   */
  updateGuildSettings: async (guildId, settings) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.guilds.updateSettings(guildId, settings);
      set({ isLoading: false });
      return response;
    } catch (error) {
      let errorMessage = 'Failed to update guild settings';
      
      // Provide more specific error messages based on the error
      if (error.error) {
        if (error.error.includes('Admin privileges required')) {
          errorMessage = 'You need admin permissions in this Discord server to modify settings.';
        } else if (error.error.includes('Guild not found')) {
          errorMessage = 'This Discord server was not found. The bot may not be in this server.';
        } else if (error.error.includes('not a member')) {
          errorMessage = 'You are not a member of this Discord server.';
        } else if (error.error.includes('Rate limited')) {
          const retryAfter = error.retry_after || 1;
          errorMessage = `Rate limited by Discord. Please wait ${retryAfter} seconds and try again.`;
        } else {
          errorMessage = error.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null })
}));

export default usePluginStore;

