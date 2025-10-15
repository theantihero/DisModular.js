/**
 * Admin Routes
 * Admin management endpoints
 * @author fkndean_
 * @date 2025-10-14
 */

import express from 'express';
import { requireAdmin } from '../middleware/auth.js';

/**
 * Create admin routes with database instance
 * @param {Object} db - Database instance
 */
export function createAdminRoutes(db) {
  const router = express.Router();

  /**
   * GET /api/admin/users
   * Get all users with admin status
   */
  router.get('/users', requireAdmin, (req, res) => {
    try {
      const users = db.prepare(`
        SELECT 
          id,
          discord_id,
          username,
          discriminator,
          avatar,
          is_admin,
          admin_notes,
          created_at,
          last_login
        FROM users 
        ORDER BY created_at DESC
      `).all();

      res.json({
        success: true,
        data: users.map(user => ({
          ...user,
          is_admin: Boolean(user.is_admin)
        }))
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  });

  /**
   * PUT /api/admin/users/:id/toggle-admin
   * Toggle admin status for a user
   */
  router.put('/users/:id/toggle-admin', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { is_admin, admin_notes } = req.body;
      
      const result = db.prepare(`
        UPDATE users 
        SET is_admin = ?, admin_notes = ?
        WHERE discord_id = ?
      `).run(is_admin ? 1 : 0, admin_notes || null, id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Log admin action
      console.log(`Admin ${req.user.username} ${is_admin ? 'granted' : 'revoked'} admin privileges for user ${id}`);

      res.json({
        success: true,
        message: `Admin privileges ${is_admin ? 'granted' : 'revoked'} successfully`
      });
    } catch (error) {
      console.error('Failed to toggle admin status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update admin status'
      });
    }
  });

  /**
   * POST /api/admin/users/add-admin
   * Add admin privileges to a user by Discord ID
   */
  router.post('/users/add-admin', requireAdmin, (req, res) => {
    try {
      const { discord_id, admin_notes } = req.body;
      
      if (!discord_id) {
        return res.status(400).json({
          success: false,
          error: 'Discord ID is required'
        });
      }

      // Check if user exists
      const existingUser = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discord_id);
      
      if (existingUser) {
        // Update existing user
        const result = db.prepare(`
          UPDATE users 
          SET is_admin = 1, admin_notes = ?
          WHERE discord_id = ?
        `).run(admin_notes || 'Admin privileges granted', discord_id);

        console.log(`Admin ${req.user.username} granted admin privileges to existing user ${discord_id}`);

        res.json({
          success: true,
          message: 'Admin privileges granted to existing user'
        });
      } else {
        // Create new user entry (they'll be admin on first login)
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        db.prepare(`
          INSERT INTO users (
            id, discord_id, username, discriminator, avatar, 
            is_admin, admin_notes, created_at, last_login
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
          userId,
          discord_id,
          'Pending Login',
          '0000',
          null,
          1,
          admin_notes || 'Admin privileges pre-granted'
        );

        console.log(`Admin ${req.user.username} pre-granted admin privileges to new user ${discord_id}`);

        res.json({
          success: true,
          message: 'Admin privileges pre-granted. User will have admin access on first login.'
        });
      }
    } catch (error) {
      console.error('Failed to add admin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add admin privileges'
      });
    }
  });

  /**
   * GET /api/admin/stats
   * Get admin dashboard statistics
   */
  router.get('/stats', requireAdmin, (req, res) => {
    try {
      const stats = {
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        totalAdmins: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get().count,
        totalPlugins: db.prepare('SELECT COUNT(*) as count FROM plugins').get().count,
        activePlugins: db.prepare('SELECT COUNT(*) as count FROM plugins WHERE enabled = 1').get().count,
        recentLogins: db.prepare(`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE last_login > datetime('now', '-7 days')
        `).get().count
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  });

  /**
   * GET /api/admin/analytics
   * Get analytics data for dashboard
   */
  router.get('/analytics', requireAdmin, (req, res) => {
    try {
      // Total commands executed
      const totalCommands = db.prepare('SELECT COUNT(*) as count FROM command_executions').get().count;
      const commands24h = db.prepare(`SELECT COUNT(*) as count FROM command_executions WHERE created_at > datetime('now', '-1 day')`).get().count;
      const commands7d = db.prepare(`SELECT COUNT(*) as count FROM command_executions WHERE created_at > datetime('now', '-7 days')`).get().count;

      // Unique users
      const totalUsers = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM command_executions WHERE user_id IS NOT NULL').get().count;
      const users24h = db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM command_executions WHERE created_at > datetime('now', '-1 day') AND user_id IS NOT NULL`).get().count;
      const users7d = db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM command_executions WHERE created_at > datetime('now', '-7 days') AND user_id IS NOT NULL`).get().count;

      // Success rate
      const successCount = db.prepare('SELECT COUNT(*) as count FROM command_executions WHERE success = 1').get().count;
      const successRate = totalCommands > 0 ? (successCount / totalCommands * 100).toFixed(1) : 0;

      // Average execution time
      const avgTime = db.prepare('SELECT AVG(execution_time_ms) as avg FROM command_executions WHERE execution_time_ms IS NOT NULL').get().avg || 0;

      // Top 5 plugins by usage
      const topPlugins = db.prepare(`
        SELECT p.name, COUNT(ce.id) as count
        FROM command_executions ce
        JOIN plugins p ON ce.plugin_id = p.id
        GROUP BY ce.plugin_id
        ORDER BY count DESC
        LIMIT 5
      `).all();

      // Recent activity (last 50 executions)
      const recentActivity = db.prepare(`
        SELECT 
          ce.command_name,
          ce.success,
          ce.execution_time_ms,
          ce.error_message,
          ce.created_at,
          u.username,
          p.name as plugin_name
        FROM command_executions ce
        LEFT JOIN users u ON ce.user_id = u.discord_id
        LEFT JOIN plugins p ON ce.plugin_id = p.id
        ORDER BY ce.created_at DESC
        LIMIT 50
      `).all();

      // Hourly usage for last 24 hours
      const hourlyUsage = db.prepare(`
        SELECT 
          strftime('%H', created_at) as hour,
          COUNT(*) as count
        FROM command_executions
        WHERE created_at > datetime('now', '-1 day')
        GROUP BY hour
        ORDER BY hour
      `).all();

      res.json({
        success: true,
        data: {
          totalCommands: { all: totalCommands, day: commands24h, week: commands7d },
          uniqueUsers: { all: totalUsers, day: users24h, week: users7d },
          successRate: parseFloat(successRate),
          avgExecutionTime: Math.round(avgTime),
          topPlugins,
          recentActivity,
          hourlyUsage
        }
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics data'
      });
    }
  });

  return router;
}

export default createAdminRoutes;
