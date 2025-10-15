/**
 * Authentication Middleware - Discord OAuth
 * @author fkndean_
 * @date 2025-10-14
 */

import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Logger } from '@dismodular/shared';

const logger = new Logger('AuthMiddleware');

/**
 * Initialize Passport with Discord OAuth
 * @param {Object} db - Database instance
 * @param {Object} config - Auth configuration
 */
export function initializePassport(db, config) {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser((id, done) => {
    try {
      const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(id);
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
        scope: ['identify', 'guilds']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if this is the initial admin
          const initialAdminId = process.env.INITIAL_ADMIN_DISCORD_ID;
          const isInitialAdmin = initialAdminId && profile.id === initialAdminId;

          // Check if user exists
          const existingUser = db
            .prepare('SELECT * FROM users WHERE discord_id = ?')
            .get(profile.id);

          if (existingUser) {
            // Update existing user
            const updateStmt = db.prepare(`
              UPDATE users 
              SET username = ?, 
                  discriminator = ?, 
                  avatar = ?, 
                  access_token = ?, 
                  refresh_token = ?,
                  is_admin = ?,
                  last_login = CURRENT_TIMESTAMP
              WHERE discord_id = ?
            `);

            // Grant admin if this is the initial admin and they don't have it yet
            const shouldBeAdmin = isInitialAdmin || existingUser.is_admin;

            updateStmt.run(
              profile.username,
              profile.discriminator,
              profile.avatar,
              accessToken,
              refreshToken,
              shouldBeAdmin ? 1 : 0,
              profile.id
            );

            // Fetch updated user
            const updatedUser = db
              .prepare('SELECT * FROM users WHERE discord_id = ?')
              .get(profile.id);

            if (isInitialAdmin && !existingUser.is_admin) {
              logger.success(`Initial admin granted to: ${profile.username}`);
            }

            logger.info(`User ${profile.username} logged in`);
            return done(null, updatedUser);
          }

          // Create new user
          const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const insertStmt = db.prepare(`
            INSERT INTO users (id, discord_id, username, discriminator, avatar, access_token, refresh_token, is_admin, admin_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          insertStmt.run(
            userId,
            profile.id,
            profile.username,
            profile.discriminator,
            profile.avatar,
            accessToken,
            refreshToken,
            isInitialAdmin ? 1 : 0,
            isInitialAdmin ? 'Initial admin from environment' : null
          );

          const newUser = {
            id: userId,
            discord_id: profile.id,
            username: profile.username,
            discriminator: profile.discriminator,
            avatar: profile.avatar,
            is_admin: isInitialAdmin ? 1 : 0
          };

          if (isInitialAdmin) {
            logger.success(`New user created with admin privileges: ${profile.username}`);
          } else {
            logger.success(`New user created: ${profile.username}`);
          }
          
          return done(null, newUser);
        } catch (error) {
          logger.error('OAuth error:', error);
          return done(error, null);
        }
      }
    )
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
    error: 'Authentication required'
  });
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.is_admin) {
    logger.warn(`Non-admin user ${req.user.username} attempted to access admin endpoint`);
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required'
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

export default {
  initializePassport,
  requireAuth,
  requireAdmin,
  optionalAuth
};

