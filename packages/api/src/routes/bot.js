/**
 * Bot Routes
 * @author fkndean_
 * @date 2025-10-14
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import axios from 'axios';

/**
 * Create bot routes
 * @param {Object} db - Database instance
 * @returns {Router} Express router
 */
export function createBotRoutes(db) {
  const router = Router();

  /**
   * Get bot status and statistics (read-only, requires auth)
   */
  router.get('/status', requireAuth, async (req, res) => {
    try {
      // Get plugin statistics from database
      const totalPlugins = db.prepare('SELECT COUNT(*) as count FROM plugins').get().count;
      const enabledPlugins = db.prepare('SELECT COUNT(*) as count FROM plugins WHERE enabled = 1').get().count;

      res.json({
        success: true,
        data: {
          status: 'online',
          uptime: process.uptime(),
          plugins: {
            total: totalPlugins,
            enabled: enabledPlugins,
            disabled: totalPlugins - enabledPlugins
          },
          version: '0.0.1'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get bot status'
      });
    }
  });

  /**
   * Get bot configuration (read-only, requires auth)
   */
  router.get('/config', requireAuth, async (req, res) => {
    try {
      const configs = db.prepare('SELECT * FROM bot_config').all();
      
      const configObj = {};
      for (const config of configs) {
        configObj[config.key] = config.value;
      }

      res.json({
        success: true,
        data: configObj
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get bot configuration'
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
          error: 'Missing required field: key'
        });
      }

      const stmt = db.prepare(`
        INSERT INTO bot_config (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(key, value);

      res.json({
        success: true,
        data: {
          message: 'Configuration updated'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration'
      });
    }
  });

  /**
   * Get audit logs (requires admin)
   */
  router.get('/audit', requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = db
        .prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?')
        .all(limit);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs'
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
          error: 'Address is required'
        });
      }

      // Import geocoding library dynamically
      const geocoding = await import('@aashari/nodejs-geocoding');
      
      // Geocode the address
      const locations = await geocoding.default.encode(address);
      
      res.json({
        success: true,
        data: { locations }
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to geocode address'
      });
    }
  });

  return router;
}

export default createBotRoutes;

