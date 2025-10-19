/**
 * Authentication Routes
 * @author fkndean_
 * @date 2025-10-14
 */

import { Router } from 'express';
import passport from 'passport';
import { getPrismaClient } from '../services/PrismaService.js';
import DiscordApiCacheService, { generateCacheKey, CACHE_TTL } from '../services/DiscordApiCacheService.js';

// Cache for bot guild IDs (5 minute TTL)
const botGuildCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

/**
 * Get actual bot guild IDs from Discord API with database caching
 * @returns {Promise<Set<string>>} Set of guild IDs where bot is present
 */
async function getBotGuildIds() {
  const cacheKey = generateCacheKey('bot_guilds');
  
  try {
    // Try to get from database cache first
    const cachedData = await DiscordApiCacheService.get(cacheKey, 'bot_guilds');
    if (cachedData) {
      return new Set(cachedData.guildIds);
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.warn('DISCORD_BOT_TOKEN not found, falling back to database check');
      const prisma = getPrismaClient();
      if (!prisma) return new Set(); // Skip if Prisma not available
      const botGuilds = await prisma.guild.findMany({ select: { id: true } });
      const guildSet = new Set(botGuilds.map(g => g.id));
      
      // Cache the fallback data
      await DiscordApiCacheService.set(cacheKey, 'bot_guilds', { guildIds: Array.from(guildSet) }, CACHE_TTL.BOT_GUILDS);
      
      return guildSet;
    }

    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bot ${botToken}`,
      },
    });

    if (!response.ok) {
      console.warn(`Discord API error for bot guilds: ${response.status}, falling back to database check`);
      const prisma = getPrismaClient();
      if (!prisma) return new Set(); // Skip if Prisma not available
      const botGuilds = await prisma.guild.findMany({ select: { id: true } });
      const guildSet = new Set(botGuilds.map(g => g.id));
      
      // Cache the fallback data
      await DiscordApiCacheService.set(cacheKey, 'bot_guilds', { guildIds: Array.from(guildSet) }, CACHE_TTL.BOT_GUILDS);
      
      return guildSet;
    }

    const botGuilds = await response.json();
    const guildSet = new Set(botGuilds.map(guild => guild.id));
    
    // Cache the successful response
    await DiscordApiCacheService.set(cacheKey, 'bot_guilds', { guildIds: Array.from(guildSet) }, CACHE_TTL.BOT_GUILDS);
    
    return guildSet;
  } catch (error) {
    console.warn('Error fetching bot guilds:', error.message, 'falling back to database check');
    const prisma = getPrismaClient();
    if (!prisma) return new Set(); // Skip if Prisma not available
    const botGuilds = await prisma.guild.findMany({ select: { id: true } });
    const guildSet = new Set(botGuilds.map(g => g.id));
    
    // Cache the fallback data
    await DiscordApiCacheService.set(cacheKey, 'bot_guilds', { guildIds: Array.from(guildSet) }, CACHE_TTL.BOT_GUILDS);
    
    return guildSet;
  }
}

/**
 * Clear bot guild cache (call when bot joins/leaves guilds)
 */
export function clearBotGuildCache() {
  botGuildCache.data = null;
  botGuildCache.timestamp = 0;
}

/**
 * Create auth routes
 * @returns {Router} Express router
 */
export function createAuthRoutes() {
  const router = Router();

  /**
   * Discord OAuth login
   */
  router.get('/discord', passport.authenticate('discord'));

  /**
   * Discord OAuth callback
   */
  router.get(
    '/discord/callback',
    (req, res, next) => {
      passport.authenticate('discord', (err, user, _info) => {
        // Handle rate limiting errors
        if (err && err.oauthError && err.oauthError.statusCode === 429) {
          return res.redirect('/auth/error?reason=rate_limit');
        }
        
        if (err) {
          return res.redirect('/auth/error?reason=oauth_failed');
        }
        
        if (!user) {
          return res.redirect('/auth/error?reason=no_user');
        }
        
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res.redirect('/auth/error?reason=login_failed');
          }
          
          // Successful authentication
          res.redirect('/auth/callback');
        });
      })(req, res, next);
    },
  );

  /**
   * Get user's Discord guilds
   */
  router.get('/guilds', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    try {
      // Get user's access token
      const prisma = getPrismaClient();
      if (!prisma) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user || !user.access_token) {
        return res.status(400).json({
          success: false,
          error: 'No Discord access token available',
        });
      }

      // Check cache first
      const cacheKey = generateCacheKey('user_guilds', { userId: user.discord_id });
      const cachedGuilds = await DiscordApiCacheService.get(cacheKey, 'user_guilds', user.discord_id);
      
      let guilds;
      if (cachedGuilds) {
        guilds = cachedGuilds;
      } else {
        // Fetch user's guilds from Discord API
        const discordResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
          },
        });

        if (!discordResponse.ok) {
          throw new Error(`Discord API error: ${discordResponse.status}`);
        }

        guilds = await discordResponse.json();
        
        // Cache the response
        await DiscordApiCacheService.set(cacheKey, 'user_guilds', guilds, CACHE_TTL.USER_GUILDS, user.discord_id);
      }

      // Filter guilds where user has admin permissions
      const adminGuilds = guilds.filter(guild => 
        (guild.permissions & 0x8) === 0x8, // Administrator permission
      );

      // Get actual bot guilds from Discord API
      const botGuildIds = await getBotGuildIds();

      // Generate bot invite URL
      const clientId = process.env.DISCORD_CLIENT_ID;
      const botInviteUrl = clientId ? 
        `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot` : 
        null;

      res.json({
        success: true,
        data: adminGuilds.map(guild => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: guild.owner,
          permissions: guild.permissions,
          permissions_new: guild.permissions_new,
          bot_present: botGuildIds.has(guild.id),
          bot_invite_url: botInviteUrl,
        })),
      });
    } catch (error) {
      console.error('Error fetching user guilds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Discord guilds',
      });
    }
  });

  /**
   * Refresh user guilds (clear cache and fetch fresh data)
   */
  router.post('/refresh-guilds', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const user = req.user;
      if (!user || !user.access_token) {
        return res.status(400).json({
          success: false,
          error: 'No Discord access token available',
        });
      }

      // Clear user's guild cache
      const cacheKey = generateCacheKey('user_guilds', { userId: user.discord_id });
      await DiscordApiCacheService.clearByType('user_guilds', user.discord_id);

      // Fetch fresh guild data from Discord API
      const discordResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      if (!discordResponse.ok) {
        throw new Error(`Discord API error: ${discordResponse.status}`);
      }

      const guilds = await discordResponse.json();

      // Filter guilds where user has admin permissions
      const adminGuilds = guilds.filter(guild => 
        (guild.permissions & 0x8) === 0x8, // Administrator permission
      );

      // Get actual bot guilds from Discord API
      const botGuildIds = await getBotGuildIds();

      // Generate bot invite URL
      const clientId = process.env.DISCORD_CLIENT_ID;
      const botInviteUrl = clientId ? 
        `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot` : 
        null;

      // Cache the fresh data
      await DiscordApiCacheService.set(cacheKey, 'user_guilds', guilds, CACHE_TTL.USER_GUILDS, user.discord_id);

      res.json({
        success: true,
        data: adminGuilds.map(guild => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: guild.owner,
          permissions: guild.permissions,
          permissions_new: guild.permissions_new,
          bot_present: botGuildIds.has(guild.id),
          bot_invite_url: botInviteUrl,
        })),
      });
    } catch (error) {
      console.error('Error refreshing user guilds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh Discord guilds',
      });
    }
  });

  /**
   * Get current user
   */
  router.get('/me', async (req, res) => {
    if (req.isAuthenticated()) {
      try {
        // Refresh user data from database to ensure we have the latest info
        const prisma = getPrismaClient();
        if (!prisma) {
          return res.json({
            success: true,
            user: req.user,
          });
        }
        const freshUser = await prisma.user.findUnique({
          where: { id: req.user.id },
        });

        if (!freshUser) {
          return res.status(401).json({
            success: false,
            error: 'User not found',
          });
        }

        // Return fresh user data (don't update session to avoid conflicts)

        res.json({
          success: true,
          data: {
            id: freshUser.id,
            username: freshUser.username,
            discriminator: freshUser.discriminator,
            avatar: freshUser.avatar,
            discord_id: freshUser.discord_id,
            is_admin: Boolean(freshUser.is_admin),
            access_status: freshUser.access_status,
            access_message: freshUser.access_message,
            access_requested_at: freshUser.access_requested_at,
            access_request_message: freshUser.access_request_message,
            admin_notes: freshUser.admin_notes,
            created_at: freshUser.created_at,
            last_login: freshUser.last_login,
          },
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch user data',
        });
      }
    } else {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }
  });

  /**
   * Logout
   */
  router.post('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to logout',
        });
      }
      
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    });
  });

  /**
   * Request access
   */
  router.post('/request-access', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    try {
      const { message } = req.body;
      
      // Validate message length
      if (message && message.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Message must be 500 characters or less',
        });
      }

      // Check if user already has a pending request
      const prisma = getPrismaClient();
      if (!prisma) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }
      const existingUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { access_status: true, access_requested_at: true },
      });

      if (existingUser?.access_status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'You already have a pending access request. Please wait for an administrator to review it.',
        });
      }

      // Update user's access_requested_at timestamp, message, and status
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          access_requested_at: new Date(),
          access_request_message: message || null,
          access_status: 'pending',
        },
      });

      res.json({
        success: true,
        message: 'Access request submitted successfully',
      });
    } catch (error) {
      console.error('Error submitting access request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit access request',
      });
    }
  });

  /**
   * Get user access status
   */
  router.get('/access-status', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    res.json({
      success: true,
      data: {
        access_status: req.user.data?.access_status || req.user.access_status,
        access_message: req.user.data?.access_message || req.user.access_message,
        access_requested_at: req.user.data?.access_requested_at || req.user.access_requested_at,
        access_request_message: req.user.data?.access_request_message || req.user.access_request_message,
      },
    });
  });

  /**
   * Auth error page
   */
  router.get('/error', (req, res) => {
    const reason = req.query.reason || 'unknown';
    
    const errorMessages = {
      rate_limit: {
        title: 'Discord Rate Limit',
        message: 'Discord is temporarily rate limiting OAuth requests. Please wait 1-2 minutes and try again.',
        code: 429,
      },
      oauth_failed: {
        title: 'OAuth Failed',
        message: 'Failed to authenticate with Discord. Please check your Discord app credentials.',
        code: 401,
      },
      no_user: {
        title: 'User Not Found',
        message: 'Could not retrieve user information from Discord.',
        code: 401,
      },
      login_failed: {
        title: 'Login Failed',
        message: 'Failed to create session. Please try again.',
        code: 500,
      },
      unknown: {
        title: 'Authentication Failed',
        message: 'An unknown error occurred during authentication.',
        code: 401,
      },
    };
    
    const error = errorMessages[reason] || errorMessages.unknown;
    
    res.status(error.code).json({
      success: false,
      error: error.title,
      message: error.message,
      reason: reason,
    });
  });

  return router;
}

export default createAuthRoutes;

