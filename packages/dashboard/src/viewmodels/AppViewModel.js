/**
 * App ViewModel - Global State Management
 * MVVM pattern - manages authentication and global app state
 * @author fkndean_
 * @date 2025-10-14
 */

import { create } from 'zustand';
import api from '../services/api';

/**
 * App Store
 */
export const useAppStore = create((set, get) => ({
  // State
  user: null,
  botStatus: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false
  }),
  
  setBotStatus: (status) => set({ botStatus: status }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  /**
   * Check authentication status
   */
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await api.auth.getUser();
      set({ 
        user: response.data, 
        isAuthenticated: true,
        isAdmin: response.data?.is_admin || false,
        isLoading: false 
      });
      return true;
    } catch (error) {
      set({ 
        user: null, 
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false 
      });
      return false;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.auth.logout();
      set({ 
        user: null, 
        isAuthenticated: false,
        isAdmin: false,
        botStatus: null
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  /**
   * Fetch bot status
   */
  fetchBotStatus: async () => {
    try {
      const response = await api.bot.getStatus();
      set({ botStatus: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bot status:', error);
      return null;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null })
}));

export default useAppStore;

