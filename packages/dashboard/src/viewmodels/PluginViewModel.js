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
      set({ plugins: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to fetch plugins';
      
      // Retry logic (max 2 retries)
      if (retryCount < 2 && !error.response?.status === 401) {
        console.log(`Retrying fetch plugins (attempt ${retryCount + 1})...`);
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
      set({ currentPlugin: response.data, isLoading: false });
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (error) {
      set({ error: error.error || 'Failed to compile plugin', isLoading: false });
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null })
}));

export default usePluginStore;

