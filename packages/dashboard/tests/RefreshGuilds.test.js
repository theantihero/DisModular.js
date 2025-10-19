/**
 * Test for Refresh Guilds functionality
 * @author fkndean_
 * @date 2025-01-27
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../src/viewmodels/AppViewModel';

// Mock the API service
vi.mock('../src/services/api', () => ({
  default: {
    auth: {
      refreshGuilds: vi.fn()
    }
  }
}));

describe('Refresh Guilds Functionality', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      refreshCooldown: 0,
      isLoading: false,
      error: null
    });
  });

  it('should refresh guilds successfully', async () => {
    const mockGuilds = [
      { id: '1', name: 'Test Guild 1', bot_present: true },
      { id: '2', name: 'Test Guild 2', bot_present: false }
    ];

    const api = await import('../src/services/api');
    api.default.auth.refreshGuilds.mockResolvedValue({ data: mockGuilds });

    const { refreshGuilds } = useAppStore.getState();
    
    const result = await refreshGuilds();
    
    expect(result).toEqual({ data: mockGuilds });
    expect(useAppStore.getState().refreshCooldown).toBe(60);
  });

  it('should prevent refresh during cooldown', async () => {
    useAppStore.setState({ refreshCooldown: 30 });

    const { refreshGuilds } = useAppStore.getState();
    
    await expect(refreshGuilds()).rejects.toThrow('Please wait 30 seconds before refreshing again');
  });

  it('should format cooldown time correctly', () => {
    const { getCooldownTime } = useAppStore.getState();
    
    useAppStore.setState({ refreshCooldown: 65 });
    expect(getCooldownTime()).toBe('1:05');
    
    useAppStore.setState({ refreshCooldown: 30 });
    expect(getCooldownTime()).toBe('30s');
    
    useAppStore.setState({ refreshCooldown: 0 });
    expect(getCooldownTime()).toBe(null);
  });

  it('should handle API errors gracefully', async () => {
    const api = await import('../src/services/api');
    api.default.auth.refreshGuilds.mockRejectedValue(new Error('API Error'));

    const { refreshGuilds } = useAppStore.getState();
    
    await expect(refreshGuilds()).rejects.toThrow('API Error');
    expect(useAppStore.getState().refreshCooldown).toBe(0); // Should not set cooldown on error
  });
});
