/**
 * Discord API Caching Service
 * Comprehensive caching system for Discord API calls to reduce rate limits
 * @author fkndean_
 * @date 2025-01-27
 */

import { getPrismaClient } from './PrismaService.js';

/**
 * Discord API Cache Service
 * Handles caching of Discord API responses to reduce API calls
 */
export class DiscordApiCacheService {
  /**
   * Get cached Discord API response
   * @param {string} cacheKey - Unique cache key
   * @param {string} cacheType - Type of cache (user_guilds, bot_guilds, etc.)
   * @param {string} userId - User ID for user-specific caches
   * @returns {Promise<Object|null>} Cached data or null if expired/not found
   */
  static async get(cacheKey, cacheType, _userId = null) {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return null; // Skip if Prisma not available
      
      const cache = await prisma.discordApiCache.findUnique({
        where: { cache_key: cacheKey },
      });

      if (!cache) {
        return null;
      }

      // Check if cache is expired
      if (new Date() > cache.expires_at) {
        // Delete expired cache
        await prisma.discordApiCache.delete({
          where: { id: cache.id },
        });
        return null;
      }

      // Update access time
      await prisma.discordApiCache.update({
        where: { id: cache.id },
        data: { updated_at: new Date() },
      });

      return cache.data;
    } catch (error) {
      console.warn('Error getting Discord API cache:', error.message);
      return null;
    }
  }

  /**
   * Set cached Discord API response
   * @param {string} cacheKey - Unique cache key
   * @param {string} cacheType - Type of cache
   * @param {Object} data - Data to cache
   * @param {number} ttlMinutes - Time to live in minutes
   * @param {string} userId - User ID for user-specific caches
   * @returns {Promise<void>}
   */
  static async set(cacheKey, cacheType, data, ttlMinutes = 5, userId = null) {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return; // Skip if Prisma not available
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      await prisma.discordApiCache.upsert({
        where: { cache_key: cacheKey },
        update: {
          data,
          expires_at: expiresAt,
          updated_at: new Date(),
        },
        create: {
          cache_key: cacheKey,
          cache_type: cacheType,
          user_id: userId,
          data,
          expires_at: expiresAt,
        },
      });
    } catch (error) {
      console.warn('Error setting Discord API cache:', error.message);
    }
  }

  /**
   * Clear cache by type and user
   * @param {string} cacheType - Type of cache to clear
   * @param {string} userId - User ID (optional)
   * @returns {Promise<void>}
   */
  static async clearByType(cacheType, userId = null) {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return; // Skip if Prisma not available
      
      await prisma.discordApiCache.deleteMany({
        where: {
          cache_type: cacheType,
          ...(userId && { user_id: userId }),
        },
      });
    } catch (error) {
      console.warn('Error clearing Discord API cache:', error.message);
    }
  }

  /**
   * Clear expired cache entries
   * @returns {Promise<number>} Number of entries cleared
   */
  static async clearExpired() {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return 0; // Skip if Prisma not available
      
      const result = await prisma.discordApiCache.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });
      return result.count;
    } catch (error) {
      console.warn('Error clearing expired Discord API cache:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  static async getStats() {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return { total: 0, expired: 0, active: 0 }; // Skip if Prisma not available
      
      const [total, expired] = await Promise.all([
        prisma.discordApiCache.count(),
        prisma.discordApiCache.count({
          where: {
            expires_at: {
              lt: new Date(),
            },
          },
        }),
      ]);

      return {
        total,
        expired,
        active: total - expired,
      };
    } catch (error) {
      console.warn('Error getting Discord API cache stats:', error.message);
      return { total: 0, expired: 0, active: 0 };
    }
  }
}

/**
 * Generate cache key for Discord API calls
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {string} userId - User ID (optional)
 * @returns {string} Cache key
 */
export function generateCacheKey(endpoint, params = {}, userId = null) {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${endpoint}:${userId || 'global'}:${paramString}`;
}

/**
 * Cache TTL configurations for different Discord API endpoints
 */
export const CACHE_TTL = {
  USER_GUILDS: 10,        // 10 minutes - user guilds change infrequently
  BOT_GUILDS: 5,          // 5 minutes - bot guilds change when bot joins/leaves
  GUILD_INFO: 30,         // 30 minutes - guild info rarely changes
  USER_INFO: 15,          // 15 minutes - user info changes occasionally
  GUILD_MEMBERS: 5,       // 5 minutes - member lists change frequently
  GUILD_CHANNELS: 20,     // 20 minutes - channels change occasionally
  DEFAULT: 5,              // 5 minutes default
};

export default DiscordApiCacheService;
