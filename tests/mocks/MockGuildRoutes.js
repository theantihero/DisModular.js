/**
 * Mock Guild Routes for Testing
 * Provides mock responses for guild API endpoints during tests
 * @author fkndean_
 * @date 2025-01-27
 */

import { Router } from 'express';

export function createMockGuildRoutes() {
  const router = Router();

  // Mock middleware that sets req.user
  const mockAuth = (req, res, next) => {
    req.user = { id: 'test-admin', is_admin: true };
    next();
  };

  /**
   * GET /guilds
   * List all guilds the bot is in
   */
  router.get('/', mockAuth, async (req, res) => {
    try {
      const guilds = [
        {
          id: '123456789',
          name: 'Test Guild 1',
          enabled: true,
          settings: {},
          created_at: new Date(),
          updated_at: new Date(),
          plugin_count: 0,
          enabled_plugins: 0
        },
        {
          id: '987654321',
          name: 'Test Guild 2',
          enabled: true,
          settings: {},
          created_at: new Date(),
          updated_at: new Date(),
          plugin_count: 0,
          enabled_plugins: 0
        }
      ];

      res.json({
        success: true,
        data: guilds
      });
    } catch (error) {
      console.error('Error fetching guilds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch guilds'
      });
    }
  });

  /**
   * GET /guilds/:guildId
   * Get specific guild information
   */
  router.get('/:guildId', mockAuth, async (req, res) => {
    try {
      const { guildId } = req.params;

      const guild = {
        id: guildId,
        name: `Test Guild ${guildId}`,
        enabled: true,
        settings: {},
        created_at: new Date(),
        updated_at: new Date(),
        plugins: []
      };

      res.json({
        success: true,
        data: guild
      });
    } catch (error) {
      console.error('Error fetching guild:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch guild'
      });
    }
  });

  /**
   * GET /guilds/:guildId/plugins
   * Get plugins enabled for a specific guild
   */
  router.get('/:guildId/plugins', mockAuth, async (req, res) => {
    try {
      const guildPlugins = [];

      res.json({
        success: true,
        data: guildPlugins
      });
    } catch (error) {
      console.error('Error fetching guild plugins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch guild plugins'
      });
    }
  });

  /**
   * PUT /guilds/:guildId/plugins/:pluginId
   * Enable/disable a plugin for a specific guild
   */
  router.put('/:guildId/plugins/:pluginId', mockAuth, async (req, res) => {
    try {
      const { guildId, pluginId } = req.params;
      const { enabled } = req.body;

      if (guildId === 'nonexistent') {
        return res.status(404).json({
          success: false,
          error: 'Guild not found'
        });
      }

      if (pluginId === 'nonexistent') {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      const guildPlugin = {
        guild_id: guildId,
        plugin_id: pluginId,
        enabled: enabled !== undefined ? enabled : true,
        settings: {},
        created_at: new Date()
      };

      res.json({
        success: true,
        message: `Plugin ${enabled ? 'enabled' : 'disabled'} for guild`,
        data: guildPlugin
      });
    } catch (error) {
      console.error('Error updating guild plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update guild plugin'
      });
    }
  });

  return router;
}

export default createMockGuildRoutes;
