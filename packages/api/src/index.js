/**
 * API Server Entry Point
 * @author fkndean_
 * @date 2025-10-14
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import lusca from 'lusca';
import { join } from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
import { Logger } from '@dismodular/shared';
import DatabaseModel from './models/Database.js';
import { initializePassport, requireApprovedAccess, requireAdmin } from './middleware/auth.js';
import { authLimiter, apiLimiter, pluginLimiter, adminLimiter, guildLimiter, expensiveOperationLimiter } from './middleware/rateLimiter.js';
import PluginController from './controllers/PluginController.js';
import { createPluginRoutes } from './routes/plugins.js';
import { createBotRoutes } from './routes/bot.js';
import { createAuthRoutes } from './routes/auth.js';
import { createAdminRoutes } from './routes/admin.js';
import { createGuildRoutes } from './routes/guild.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const logger = new Logger('API');

// Validate environment variables
const requiredEnvVars = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('Please check your .env file');
  process.exit(1);
}

// Configuration
// Resolve paths relative to workspace root (2 levels up from packages/api/src)
const workspaceRoot = join(process.cwd(), '..', '..');
const config = {
  port: process.env.API_PORT || 3002,
  pluginsDir: process.env.PLUGINS_DIR ? join(workspaceRoot, process.env.PLUGINS_DIR) : join(workspaceRoot, 'plugins'),
  dashboardDir: join(workspaceRoot, 'packages', 'dashboard', 'dist'),
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3002/auth/discord/callback',
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

logger.info('Starting API Server...');
logger.info('Database: PostgreSQL with Prisma');
logger.info(`Plugins Directory: ${config.pluginsDir}`);
logger.info(`Dashboard Directory: ${config.dashboardDir}`);

// Initialize database
const database = new DatabaseModel();
const db = database.getInstance();

// Initialize Express app
const app = express();

// Trust proxy for rate limiting (trust only the first proxy - Traefik)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? {
      directives: {
        defaultSrc: ['\'self\''],
        scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://static.cloudflareinsights.com'],
        styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        connectSrc: ['\'self\''],
        fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
        objectSrc: ['\'none\''],
        mediaSrc: ['\'self\''],
        frameSrc: ['\'none\''],
      },
    }
    : {
      directives: {
        defaultSrc: ['\'self\'', 'http://localhost:5173'],
        scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://static.cloudflareinsights.com'],
        styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        connectSrc: ['\'self\'', 'ws://localhost:5173'],
        fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
        objectSrc: ['\'none\''],
        mediaSrc: ['\'self\''],
        frameSrc: ['\'self\'', 'http://localhost:5173'],
      },
    },
}));

app.use(cors({
  origin: process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(':3002', ':5173') : 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: config.session.maxAge,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
initializePassport(config.discord);
// Add CSRF protection middleware
app.use(lusca.csrf());

// Initialize controllers
const pluginController = new PluginController(db, config.pluginsDir);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
  });
});

// Handle both /api prefix and direct routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// API routes (no /api prefix since Traefik handles routing)
// Registering routes...
app.use('/auth', authLimiter, createAuthRoutes());
app.use('/plugins', requireApprovedAccess, expensiveOperationLimiter, createPluginRoutes(pluginController));
app.use('/bot', apiLimiter, createBotRoutes(db));
app.use('/admin', requireAdmin, expensiveOperationLimiter, createAdminRoutes());
app.use('/guilds', requireAdmin, expensiveOperationLimiter, createGuildRoutes());
// Routes registered successfully

// Serve static dashboard files with rate limiting
app.use('/', apiLimiter, express.static(config.dashboardDir));

// Serve assets (wallet images, etc.) with rate limiting
app.use('/assets', apiLimiter, express.static(join(workspaceRoot, 'assets')));

// API info route (after static files)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Discord Bot Modular API',
    version: '0.0.1',
    author: 'fkndean_',
  });
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', apiLimiter, (req, res) => {
  res.sendFile(join(config.dashboardDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Start server with error handling
const server = app.listen(config.port, () => {
  logger.success(`API Server listening on port ${config.port}`);
  logger.info(`API URL: http://localhost:${config.port}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} is already in use`);
    logger.info('Try running: npm run kill-ports');
    logger.info(`Or manually: netstat -ano | findstr :${config.port} then taskkill /F /PID <PID>`);
    process.exit(1);
  } else {
    logger.error('Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  server.close(async () => {
    await database.close();
    logger.success('API Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  server.close(async () => {
    await database.close();
    logger.success('API Server stopped');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;

