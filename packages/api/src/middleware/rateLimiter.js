/**
 * Rate Limiting Middleware
 * Provides different rate limits for different types of endpoints
 * @author fkndean_
 * @date 2025-10-18
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Authentication rate limiter
 * 20 requests per minute for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.is_admin;
  },
  keyGenerator: (req) => {
    // Use proper IPv6 handling with user agent for better identification
    const ip = ipKeyGenerator(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  },
});

/**
 * General API rate limiter
 * 60 requests per minute for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    success: false,
    error: 'Too many requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.is_admin;
  },
  keyGenerator: (req) => {
    // Use proper IPv6 handling with user agent for better identification
    const ip = ipKeyGenerator(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  },
});

/**
 * Plugin operations rate limiter
 * 200 requests per minute for plugin operations
 */
export const pluginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: {
    success: false,
    error: 'Too many plugin operations, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.is_admin;
  },
  keyGenerator: (req) => {
    // Use proper IPv6 handling with user agent for better identification
    const ip = ipKeyGenerator(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  },
});

/**
 * Admin operations rate limiter
 * 100 requests per minute for admin endpoints
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: 'Too many admin operations, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.is_admin;
  },
  keyGenerator: (req) => {
    // Use proper IPv6 handling with user agent for better identification
    const ip = ipKeyGenerator(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  },
});

/**
 * Guild management rate limiter
 * 50 requests per minute for guild operations
 */
export const guildLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: {
    success: false,
    error: 'Too many guild operations, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.is_admin;
  },
  keyGenerator: (req) => {
    // Use proper IPv6 handling with user agent for better identification
    const ip = ipKeyGenerator(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  },
});

/**
 * Template operations rate limiter
 * 30 requests per minute for template operations
 */
export const templateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'Too many template operations, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.is_admin;
  },
  keyGenerator: (req) => {
    // Use proper IPv6 handling with user agent for better identification
    const ip = ipKeyGenerator(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  },
});

export default {
  authLimiter,
  apiLimiter,
  pluginLimiter,
  adminLimiter,
  guildLimiter,
  templateLimiter,
};
