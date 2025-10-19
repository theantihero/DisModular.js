/**
 * Database Model - Prisma Client Connection
 * Manages database schema and connections using Prisma ORM
 * @author fkndean_
 * @date 2025-01-27
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '@dismodular/shared';

const logger = new Logger('Database');

export class DatabaseModel {
  /**
   * Initialize Database with Prisma Client
   */
  constructor() {
    this.prisma = new PrismaClient();
    logger.info('Prisma Client initialized');
  }

  /**
   * Get Prisma client instance
   * @returns {PrismaClient} Prisma client instance
   */
  getInstance() {
    return this.prisma;
  }

  /**
   * Close database connection
   */
  async close() {
    await this.prisma.$disconnect();
    logger.info('Database connection closed');
  }

  /**
   * Add audit log entry
   * @param {Object} entry - Audit log entry
   */
  async addAuditLog(entry) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: entry.details || {}
        }
      });
    } catch (error) {
      logger.error('Failed to add audit log:', error);
    }
  }

  /**
   * Get audit logs
   * @param {Object} options - Query options
   * @returns {Array} Audit logs
   */
  async getAuditLogs(options = {}) {
    try {
      const where = {};
      
      if (options.userId) {
        where.userId = options.userId;
      }

      if (options.resourceType) {
        where.resourceType = options.resourceType;
      }

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: options.limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              discord_id: true
            }
          }
        }
      });

      return auditLogs;
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Create or update user
   * @param {Object} userData - User data
   * @returns {Object} Created/updated user
   */
  async upsertUser(userData) {
    try {
      return await this.prisma.user.upsert({
        where: { discord_id: userData.discord_id },
        update: {
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar,
          access_token: userData.access_token,
          refresh_token: userData.refresh_token,
          last_login: new Date()
        },
        create: {
          discord_id: userData.discord_id,
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar,
          access_token: userData.access_token,
          refresh_token: userData.refresh_token,
          is_admin: userData.is_admin || false,
          admin_notes: userData.admin_notes
        }
      });
    } catch (error) {
      logger.error('Failed to upsert user:', error);
      throw error;
    }
  }

  /**
   * Get user by Discord ID
   * @param {string} discordId - Discord user ID
   * @returns {Object|null} User object or null
   */
  async getUserByDiscordId(discordId) {
    try {
      return await this.prisma.user.findUnique({
        where: { discord_id: discordId }
      });
    } catch (error) {
      logger.error('Failed to get user by Discord ID:', error);
      return null;
    }
  }

  /**
   * Set user admin status
   * @param {string} userId - User ID
   * @param {boolean} isAdmin - Admin status
   * @param {string} notes - Admin notes
   */
  async setUserAdmin(userId, isAdmin, notes = null) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          is_admin: isAdmin,
          admin_notes: notes
        }
      });
    } catch (error) {
      logger.error('Failed to set user admin status:', error);
      throw error;
    }
  }

  /**
   * Get bot configuration
   * @param {string} key - Configuration key
   * @returns {string|null} Configuration value
   */
  async getBotConfig(key) {
    try {
      const config = await this.prisma.botConfig.findUnique({
        where: { key }
      });
      return config ? config.value : null;
    } catch (error) {
      logger.error('Failed to get bot config:', error);
      return null;
    }
  }

  /**
   * Set bot configuration
   * @param {string} key - Configuration key
   * @param {string} value - Configuration value
   */
  async setBotConfig(key, value) {
    try {
      await this.prisma.botConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    } catch (error) {
      logger.error('Failed to set bot config:', error);
      throw error;
    }
  }
}

export default DatabaseModel;

