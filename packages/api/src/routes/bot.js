/**
 * Bot Routes
 * @author fkndean_
 * @date 2025-10-14
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getPrismaClient } from '../services/PrismaService.js';
import axios from 'axios';

// Helper function to get Prisma client with error handling
function getPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error('Database not available');
  }
  return prisma;
}

/**
 * Create bot routes
 * @param {Object} db - Database instance
 * @returns {Router} Express router
 */
export function createBotRoutes(_db) {
  const router = Router();

  /**
   * Get API status and statistics (read-only, requires auth)
   */
  router.get('/status', requireAuth, async (req, res) => {
    try {
      // Get plugin statistics from database
      const [totalPlugins, enabledPlugins] = await Promise.all([
        getPrisma().plugin.count(),
        getPrisma().plugin.count({ where: { enabled: true } }),
      ]);

      res.json({
        success: true,
        data: {
          api_status: 'online',
          uptime: process.uptime(),
          plugins: {
            total: totalPlugins,
            enabled: enabledPlugins,
            disabled: totalPlugins - enabledPlugins,
          },
          version: '0.0.1',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get API status',
      });
    }
  });

  /**
   * Get guild count statistics (read-only, requires auth)
   * @date 2025-01-27
   */
  router.get('/guild-count', requireAuth, async (req, res) => {
    try {
      const guildCount = await getPrisma().guild.count();

      res.json({
        success: true,
        data: {
          guild_count: guildCount,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get guild count',
      });
    }
  });

  /**
   * Get actual bot status from bot service (read-only, requires auth)
   */
  router.get('/bot-status', requireAuth, async (req, res) => {
    try {
      const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3001';
      
      try {
        const response = await axios.get(`${botApiUrl}/api/bot/status`, {
          timeout: 3000,
        });

        res.json({
          success: true,
          data: {
            bot_status: response.data.status || 'online',
            bot_uptime: response.data.uptime || 0,
            bot_guilds: response.data.guilds || 0,
            bot_users: response.data.users || 0,
            last_heartbeat: response.data.last_heartbeat || null,
          },
        });
      } catch (botError) {
        // Check if bot is actually running by checking guild count in database
        const guildCount = await getPrisma().guild.count();
        
        if (guildCount > 0) {
          // Bot is likely online if there are guilds in the database
          res.json({
            success: true,
            data: {
              bot_status: 'online',
              bot_uptime: 0,
              bot_guilds: guildCount,
              bot_users: 0,
              last_heartbeat: null,
              note: 'Status inferred from database',
            },
          });
        } else {
          // Bot service is not available and no guilds found
          res.json({
            success: true,
            data: {
              bot_status: 'offline',
              bot_uptime: 0,
              bot_guilds: 0,
              bot_users: 0,
              last_heartbeat: null,
              error: 'Bot service unavailable',
            },
          });
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get bot status',
      });
    }
  });

  /**
   * Get bot configuration (read-only, requires auth)
   */
  router.get('/config', requireAuth, async (req, res) => {
    try {
      const configs = await getPrisma().botConfig.findMany();
      
      const configObj = {};
      for (const config of configs) {
        configObj[config.key] = config.value;
      }

      res.json({
        success: true,
        data: configObj,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get bot configuration',
      });
    }
  });

  /**
   * Update bot configuration (requires admin)
   */
  router.put('/config', requireAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: key',
        });
      }

      await getPrisma().botConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

      res.json({
        success: true,
        data: {
          message: 'Configuration updated',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }
  });

  /**
   * Get audit logs (requires admin)
   */
  router.get('/audit', requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await getPrisma().auditLog.findMany({
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          user: {
            select: {
              username: true,
              discord_id: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs',
      });
    }
  });

  /**
   * Geocoding service - convert address to coordinates
   */
  router.post('/geocode', requireAuth, async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address is required',
        });
      }

      // Import geocoding library dynamically
      const geocoding = await import('@aashari/nodejs-geocoding');
      
      // Geocode the address
      const locations = await geocoding.default.encode(address);
      
      res.json({
        success: true,
        data: { locations },
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to geocode address',
      });
    }
  });

  return router;
}

export default createBotRoutes;

