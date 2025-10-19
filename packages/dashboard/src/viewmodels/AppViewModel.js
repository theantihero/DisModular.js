/* eslint-env browser, node */
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
  apiStatus: null,
  botStatus: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  error: null,
  refreshCooldown: 0, // Cooldown timer in seconds
  selectedGuildId: null, // Cached guild selection

  // Actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isAdmin: user?.data?.is_admin || false
  }),
  
  setApiStatus: (status) => set({ apiStatus: status }),
  setBotStatus: (status) => set({ botStatus: status }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  /**
   * Set selected guild ID and cache it
   */
  setSelectedGuildId: (guildId) => {
    set({ selectedGuildId: guildId });
    if (guildId) {
      // eslint-disable-next-line no-undef
      localStorage.setItem('dismodular_selected_guild_id', guildId);
    } else {
      // eslint-disable-next-line no-undef
      localStorage.removeItem('dismodular_selected_guild_id');
    }
  },

  /**
   * Get cached guild selection
   */
  getCachedGuildId: () => {
    // eslint-disable-next-line no-undef
    const cached = localStorage.getItem('dismodular_selected_guild_id');
    return cached || null;
  },

  /**
   * Initialize cached guild selection
   */
  initializeGuildSelection: () => {
    const cachedGuildId = get().getCachedGuildId();
    if (cachedGuildId) {
      set({ selectedGuildId: cachedGuildId });
    }
  },

  /**
   * Refresh guilds with cooldown
   */
  refreshGuilds: async () => {
    const { refreshCooldown } = get();
    
    if (refreshCooldown > 0) {
      throw new Error(`Please wait ${refreshCooldown} seconds before refreshing again`);
    }

    set({ isLoading: true });
    try {
      const response = await api.auth.refreshGuilds();
      
      // Set cooldown to 60 seconds (1 minute)
      set({ refreshCooldown: 60 });
      
      // Start countdown
      // eslint-disable-next-line no-undef
      const countdown = setInterval(() => {
        const currentCooldown = get().refreshCooldown;
        if (currentCooldown <= 1) {
          // eslint-disable-next-line no-undef
          clearInterval(countdown);
          set({ refreshCooldown: 0 });
        } else {
          set({ refreshCooldown: currentCooldown - 1 });
        }
      }, 1000);
      
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  /**
   * Get formatted cooldown time
   */
  getCooldownTime: () => {
    const { refreshCooldown } = get();
    if (refreshCooldown <= 0) return null;
    
    const minutes = Math.floor(refreshCooldown / 60);
    const seconds = refreshCooldown % 60;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  },

  /**
   * Check authentication status
   */
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await api.auth.getUser();
      // Auth response received
      
      set({ 
        user: response, 
        isAuthenticated: true,
        isAdmin: response?.data?.is_admin || false,
        isLoading: false 
      });
      
      // User state updated
      return true;
    } catch (error) {
      console.error('🔍 Auth error:', error);
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
        apiStatus: null,
        botStatus: null
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  /**
   * Fetch API and Bot status
   */
  fetchBotStatus: async () => {
    try {
      const [apiResponse, botResponse] = await Promise.all([
        api.bot.getStatus(),
        api.bot.getBotStatus()
      ]);
      
      set({ 
        apiStatus: apiResponse.data,
        botStatus: botResponse.data
      });
      
      return {
        api: apiResponse.data,
        bot: botResponse.data
      };
    } catch (error) {
      console.error('Failed to fetch status:', error);
      return null;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null })
}));

export default useAppStore;

