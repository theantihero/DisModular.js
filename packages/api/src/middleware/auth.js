/**
 * Authentication Middleware - Discord OAuth
 * @author fkndean_
 * @date 2025-10-14
 */

import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Logger } from '@dismodular/shared';
import { getPrismaClient } from '../services/PrismaService.js';

const logger = new Logger('AuthMiddleware');

/**
 * Initialize Passport with Discord OAuth
 * @param {Object} config - Auth configuration
 */
export function initializePassport(config) {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const prisma = getPrismaClient();
      if (!prisma) {
        logger.warn('Prisma client not available for user deserialization');
        return done(null, null);
      }
      const user = await prisma.user.findUnique({
        where: { id },
      });
      done(null, user);
    } catch (error) {
      logger.error('Failed to deserialize user:', error);
      done(error, null);
    }
  });

  // Discord OAuth Strategy
  passport.use(
    new DiscordStrategy(
      {
        clientID: config.clientId,
        clientSecret: config.clientSecret,
        callbackURL: config.callbackUrl,
        scope: ['identify', 'guilds'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if this is the initial admin
          const initialAdminId = process.env.INITIAL_ADMIN_DISCORD_ID;
          const isInitialAdmin = initialAdminId && profile.id === initialAdminId;

          const prisma = getPrismaClient();
          if (!prisma) {
            logger.warn('Prisma client not available for user authentication');
            return done(new Error('Database not available'), null);
          }

          // Use upsert to handle both create and update cases
          const user = await prisma.user.upsert({
            where: { discord_id: profile.id },
            update: {
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              access_token: accessToken,
              refresh_token: refreshToken,
              is_admin: isInitialAdmin || undefined, // Only update admin status if this is initial admin
              last_login: new Date(),
            },
            create: {
              discord_id: profile.id,
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              access_token: accessToken,
              refresh_token: refreshToken,
              is_admin: isInitialAdmin,
              access_status: isInitialAdmin ? 'approved' : 'pending',
              admin_notes: isInitialAdmin ? 'Initial admin from environment' : null,
            },
          });

          if (isInitialAdmin) {
            logger.success(`Initial admin ${user.is_admin ? 'granted to' : 'created'}: ${profile.username}`);
          }

          logger.info(`User ${profile.username} logged in`);
          return done(null, user);
        } catch (error) {
          logger.error('Discord OAuth error:', error);
          return done(error, null);
        }
      },
    ),
  );

  logger.success('Passport initialized with Discord OAuth');
}

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!req.user.is_admin) {
    logger.warn(`Non-admin user ${req.user.username} attempted to access admin endpoint`);
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required',
    });
  }

  return next();
}

/**
 * Middleware to optionally authenticate user
 */
export function optionalAuth(req, res, next) {
  // Always proceed, but user info will be available if authenticated
  next();
}

/**
 * Middleware to check if user has approved access
 */
export function requireApprovedAccess(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // Admins always have access
  if (req.user.is_admin) {
    return next();
  }

  if (req.user.access_status === 'denied') {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: req.user.access_message || 'Your access request has been denied.',
    });
  }

  if (req.user.access_status === 'pending') {
    return res.status(403).json({
      success: false,
      error: 'Access pending',
      message: 'Your access request is pending admin approval.',
    });
  }

  if (req.user.access_status !== 'approved') {
    return res.status(403).json({
      success: false,
      error: 'Access not approved',
    });
  }

  return next();
}

export default {
  initializePassport,
  requireAuth,
  requireAdmin,
  optionalAuth,
};

