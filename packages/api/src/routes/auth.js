/**
 * Authentication Routes
 * @author fkndean_
 * @date 2025-10-14
 */

import { Router } from 'express';
import passport from 'passport';

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
      passport.authenticate('discord', (err, user, info) => {
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
          res.redirect(process.env.VITE_API_URL ? `${process.env.VITE_API_URL.replace(':3002', ':5173')}/dashboard` : 'http://localhost:5173/dashboard');
        });
      })(req, res, next);
    }
  );

  /**
   * Get current user
   */
  router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({
        success: true,
        data: {
          id: req.user.id,
          username: req.user.username,
          discriminator: req.user.discriminator,
          avatar: req.user.avatar,
          discord_id: req.user.discord_id,
          is_admin: Boolean(req.user.is_admin)
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
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
          error: 'Failed to logout'
        });
      }
      
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });
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
        code: 429
      },
      oauth_failed: {
        title: 'OAuth Failed',
        message: 'Failed to authenticate with Discord. Please check your Discord app credentials.',
        code: 401
      },
      no_user: {
        title: 'User Not Found',
        message: 'Could not retrieve user information from Discord.',
        code: 401
      },
      login_failed: {
        title: 'Login Failed',
        message: 'Failed to create session. Please try again.',
        code: 500
      },
      unknown: {
        title: 'Authentication Failed',
        message: 'An unknown error occurred during authentication.',
        code: 401
      }
    };
    
    const error = errorMessages[reason] || errorMessages.unknown;
    
    res.status(error.code).json({
      success: false,
      error: error.title,
      message: error.message,
      reason: reason
    });
  });

  return router;
}

export default createAuthRoutes;

