/**
 * Admin Routes
 * Admin management endpoints
 * @author fkndean_
 * @date 2025-10-14
 */

import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create admin routes
 */
export function createAdminRoutes() {
  const router = express.Router();

  /**
   * PUT /api/admin/users/:id/toggle-admin
   * Toggle admin status for a user
   */
  router.put('/users/:id/toggle-admin', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { is_admin, admin_notes } = req.body;
      
      await prisma.user.update({
        where: { discord_id: id },
        data: {
          is_admin: is_admin,
          admin_notes: admin_notes || null,
        },
      });

      // Log admin action
      // Admin privileges updated

      res.json({
        success: true,
        message: `Admin privileges ${is_admin ? 'granted' : 'revoked'} successfully`,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }
      console.error('Failed to toggle admin status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update admin status',
      });
    }
  });

  /**
   * POST /api/admin/users/add-admin
   * Add admin privileges to a user by Discord ID
   */
  router.post('/users/add-admin', requireAdmin, async (req, res) => {
    try {
      const { discord_id, admin_notes } = req.body;
      
      if (!discord_id) {
        return res.status(400).json({
          success: false,
          error: 'Discord ID is required',
        });
      }

      // Use upsert to handle both create and update cases
      await prisma.user.upsert({
        where: { discord_id },
        update: {
          is_admin: true,
          admin_notes: admin_notes || 'Admin privileges granted',
        },
        create: {
          discord_id,
          username: 'Pending Login',
          discriminator: '0000',
          avatar: null,
          is_admin: true,
          admin_notes: admin_notes || 'Admin privileges pre-granted',
        },
      });

      // Admin privileges granted

      res.json({
        success: true,
        message: 'Admin privileges granted successfully',
      });
    } catch (error) {
      console.error('Failed to add admin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add admin privileges',
      });
    }
  });

  /**
   * GET /api/admin/stats
   * Get admin dashboard statistics
   */
  router.get('/stats', requireAdmin, async (req, res) => {
    try {
      const [
        totalUsers,
        totalAdmins,
        totalPlugins,
        activePlugins,
        recentLogins,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { is_admin: true } }),
        prisma.plugin.count(),
        prisma.plugin.count({ where: { enabled: true } }),
        prisma.user.count({
          where: {
            last_login: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            },
          },
        }),
      ]);

      const stats = {
        totalUsers,
        totalAdmins,
        totalPlugins,
        activePlugins,
        recentLogins,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  });

  /**
   * GET /api/admin/analytics
   * Get analytics data for dashboard
   */
  router.get('/analytics', requireAdmin, async (req, res) => {
    try {
      // Total commands executed
      const totalCommands = await prisma.commandExecution.count();
      const commands24h = await prisma.commandExecution.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      const commands7d = await prisma.commandExecution.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Unique users
      const totalUsers = await prisma.commandExecution.groupBy({
        by: ['user_id'],
        where: {
          user_id: {
            not: null,
          },
        },
      }).then(result => result.length);
      const users24h = await prisma.commandExecution.groupBy({
        by: ['user_id'],
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          user_id: {
            not: null,
          },
        },
      }).then(result => result.length);
      const users7d = await prisma.commandExecution.groupBy({
        by: ['user_id'],
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          user_id: {
            not: null,
          },
        },
      }).then(result => result.length);

      // Success rate
      const successCount = await prisma.commandExecution.count({
        where: {
          success: true,
        },
      });
      const successRate = totalCommands > 0 ? (successCount / totalCommands * 100).toFixed(1) : 0;

      // Average execution time
      const avgTimeResult = await prisma.commandExecution.aggregate({
        _avg: {
          execution_time_ms: true,
        },
        where: {
          execution_time_ms: {
            not: null,
          },
        },
      });
      const avgTime = avgTimeResult._avg.execution_time_ms || 0;

      // Top 5 plugins by usage
      const topPlugins = await prisma.commandExecution.groupBy({
        by: ['plugin_id'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      // Recent activity (last 50 executions)
      const recentActivity = await prisma.commandExecution.findMany({
        take: 50,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
          plugin: {
            select: {
              name: true,
            },
          },
        },
      });

      // Hourly usage for last 24 hours
      const hourlyUsage = await prisma.commandExecution.groupBy({
        by: ['created_at'],
        _count: {
          id: true,
        },
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      res.json({
        success: true,
        data: {
          totalCommands: { all: totalCommands, day: commands24h, week: commands7d },
          uniqueUsers: { all: totalUsers, day: users24h, week: users7d },
          successRate: parseFloat(successRate),
          avgExecutionTime: Math.round(avgTime),
          topPlugins,
          recentActivity,
          hourlyUsage,
        },
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics data',
      });
    }
  });

  /**
   * GET /api/admin/access-requests
   * Get pending access requests
   */
  router.get('/access-requests', requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await prisma.user.findMany({
        where: {
          access_status: 'pending',
          is_admin: false,
        },
        select: {
          id: true,
          discord_id: true,
          username: true,
          discriminator: true,
          avatar: true,
          access_requested_at: true,
          access_request_message: true,
          created_at: true,
          last_login: true,
        },
        orderBy: {
          access_requested_at: 'desc',
        },
      });

      res.json({
        success: true,
        data: pendingUsers,
      });
    } catch (error) {
      console.error('Failed to fetch access requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch access requests',
      });
    }
  });

  /**
   * POST /api/admin/access-requests/:userId/approve
   * Approve access request
   */
  router.post('/access-requests/:userId/approve', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { message } = req.body;

      await prisma.user.update({
        where: { id: userId },
        data: {
          access_status: 'approved',
          access_message: message || 'Your access has been approved. Welcome!',
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'APPROVE_ACCESS',
          resource_type: 'User',
          resource_id: userId,
          details: { message },
        },
      });

      res.json({
        success: true,
        message: 'Access request approved successfully',
      });
    } catch (error) {
      console.error('Failed to approve access request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve access request',
      });
    }
  });

  /**
   * POST /api/admin/access-requests/:userId/deny
   * Deny access request
   */
  router.post('/access-requests/:userId/deny', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Denial message is required',
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          access_status: 'denied',
          access_message: message,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'DENY_ACCESS',
          resource_type: 'User',
          resource_id: userId,
          details: { message },
        },
      });

      res.json({
        success: true,
        message: 'Access request denied successfully',
      });
    } catch (error) {
      console.error('Failed to deny access request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deny access request',
      });
    }
  });

  /**
   * POST /api/admin/users/:userId/revoke-access
   * Revoke access from an approved user
   */
  router.post('/users/:userId/revoke-access', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Revocation reason is required',
        });
      }

      // Check if user exists and is not an admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      if (user.is_admin) {
        return res.status(400).json({
          success: false,
          error: 'Cannot revoke access from admin users',
        });
      }

      // Update user access status to denied
      await prisma.user.update({
        where: { id: userId },
        data: {
          access_status: 'denied',
          access_message: reason,
        },
      });

      // Revoke all guild permissions for this user (bot access denial)
      await prisma.userGuildPermission.deleteMany({
        where: { user_id: userId },
      });

      // Clear any cached Discord API data for this user
      await prisma.discordApiCache.deleteMany({
        where: { user_id: user.discord_id },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'REVOKE_ACCESS',
          resource_type: 'User',
          resource_id: userId,
          details: { 
            reason, 
            previous_status: user.access_status,
            revoked_guild_permissions: true,
            cleared_discord_cache: true,
          },
        },
      });

      res.json({
        success: true,
        message: 'User access and bot permissions revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking user access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke user access',
      });
    }
  });

  /**
   * POST /api/admin/users/:userId/grant-access
   * Grant access to a user (approve or re-approve)
   */
  router.post('/users/:userId/grant-access', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { message } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Update user access status to approved
      await prisma.user.update({
        where: { id: userId },
        data: {
          access_status: 'approved',
          access_message: message || 'Your access has been granted. Welcome!',
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'GRANT_ACCESS',
          resource_type: 'User',
          resource_id: userId,
          details: { message, previous_status: user.access_status },
        },
      });

      res.json({
        success: true,
        message: 'User access granted successfully',
      });
    } catch (error) {
      console.error('Error granting user access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to grant user access',
      });
    }
  });

  /**
   * GET /api/admin/users
   * Get all users with their access status and detailed information
   */
  router.get('/users', requireAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          discord_id: true,
          username: true,
          discriminator: true,
          avatar: true,
          is_admin: true,
          admin_notes: true,
          access_status: true,
          access_message: true,
          access_requested_at: true,
          created_at: true,
          last_login: true,
          // Include related data for enhanced user management
          plugins: {
            select: {
              id: true,
              name: true,
              created_at: true,
            },
          },
          audit_logs: {
            select: {
              id: true,
              action: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
        },
        orderBy: { created_at: 'desc' },
      });

      // Enhance user data with additional information
      const enhancedUsers = await Promise.all(users.map(async (user) => {
        try {
          // Get user's guild permissions (which guilds they have admin access to)
          let userGuildPermissions = [];
          try {
            userGuildPermissions = await prisma.userGuildPermission.findMany({
              where: { user_id: user.id },
              select: {
                guild_id: true,
                is_admin: true,
                permissions: true,
                guild: {
                  select: {
                    id: true,
                    name: true,
                    enabled: true,
                  },
                },
              },
            });
          } catch (error) {
            // UserGuildPermission table not found, skipping guild permissions
          }

          // Count total commands executed (from audit logs)
          let commandCount = 0;
          try {
            commandCount = await prisma.auditLog.count({
              where: {
                user_id: user.id,
                action: {
                  contains: 'command',
                },
              },
            });
          } catch (error) {
            // AuditLog table not found, skipping command count
          }

          // Get recent activity
          let recentActivity = [];
          try {
            recentActivity = await prisma.auditLog.findMany({
              where: { user_id: user.id },
              orderBy: { created_at: 'desc' },
              take: 5,
              select: {
                action: true,
                created_at: true,
                details: true,
              },
            });
          } catch (error) {
            // AuditLog table not found, skipping recent activity
          }

          return {
            ...user,
            guilds: userGuildPermissions.map(perm => ({
              id: perm.guild_id,
              name: perm.guild?.name || 'Unknown Guild',
              is_admin: perm.is_admin,
              permissions: perm.permissions.toString(), // Convert BigInt to string
              enabled: perm.guild?.enabled || false,
            })),
            command_count: commandCount,
            recent_activity: recentActivity,
            total_plugins: user.plugins?.length || 0,
            last_activity: recentActivity[0]?.created_at || user.last_login,
          };
        } catch (error) {
          console.error(`Error enhancing user ${user.id}:`, error);
          // Return basic user data if enhancement fails
          return {
            ...user,
            guilds: [],
            command_count: 0,
            recent_activity: [],
            total_plugins: user.plugins?.length || 0,
            last_activity: user.last_login,
          };
        }
      }));

      res.json({
        success: true,
        data: enhancedUsers,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      });
    }
  });

  return router;
}

export default createAdminRoutes;
