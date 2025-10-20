/**
 * Database Model - Prisma Client Connection
 * Manages database schema and connections using Prisma ORM
 * @author fkndean_
 * @date 2025-01-27
 */

import { getPrismaClient } from '../services/PrismaService.js';
import { Logger } from '@dismodular/shared';

const logger = new Logger('Database');

export class DatabaseModel {
  /**
   * Initialize Database with Prisma Client
   */
  constructor() {
    this.prisma = null; // Will be initialized lazily
    logger.info('Database Model initialized');
  }

  /**
   * Get Prisma client instance (lazy initialization)
   * @returns {PrismaClient|null} Prisma client instance or null if not available
   */
  getInstance() {
    if (!this.prisma) {
      this.prisma = getPrismaClient();
      if (!this.prisma) {
        logger.warn('Prisma client not available - database operations will fail');
      } else {
        logger.info('Prisma client initialized successfully');
      }
    }
    return this.prisma;
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      logger.info('Database connection closed');
    }
  }

  /**
   * Add audit log entry
   * @param {Object} entry - Audit log entry
   */
  async addAuditLog(entry) {
    try {
      const prisma = this.getInstance();
      if (!prisma) {
        logger.warn('Prisma client not available for audit log');
        return;
      }
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: entry.details || {},
        },
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
      const prisma = this.getInstance();
      if (!prisma) {
        logger.warn('Prisma client not available for audit logs');
        return [];
      }
      const where = {};
      
      if (options.userId) {
        where.userId = options.userId;
      }

      if (options.resourceType) {
        where.resourceType = options.resourceType;
      }

      const auditLogs = await prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: options.limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              discord_id: true,
            },
          },
        },
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
      const prisma = this.getInstance();
      if (!prisma) {
        throw new Error('Database not available');
      }
      return await prisma.user.upsert({
        where: { discord_id: userData.discord_id },
        update: {
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar,
          access_token: userData.access_token,
          refresh_token: userData.refresh_token,
          last_login: new Date(),
        },
        create: {
          discord_id: userData.discord_id,
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar,
          access_token: userData.access_token,
          refresh_token: userData.refresh_token,
          is_admin: userData.is_admin || false,
          admin_notes: userData.admin_notes,
        },
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
      const prisma = this.getInstance();
      if (!prisma) {
        logger.warn('Prisma client not available for user lookup');
        return null;
      }
      return await prisma.user.findUnique({
        where: { discord_id: discordId },
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
      const prisma = this.getInstance();
      if (!prisma) {
        throw new Error('Database not available');
      }
      await prisma.user.update({
        where: { id: userId },
        data: {
          is_admin: isAdmin,
          admin_notes: notes,
        },
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
      const prisma = this.getInstance();
      if (!prisma) {
        logger.warn('Prisma client not available for bot config');
        return null;
      }
      const config = await prisma.botConfig.findUnique({
        where: { key },
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
      const prisma = this.getInstance();
      if (!prisma) {
        throw new Error('Database not available');
      }
      await prisma.botConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    } catch (error) {
      logger.error('Failed to set bot config:', error);
      throw error;
    }
  }
}

export default DatabaseModel;

