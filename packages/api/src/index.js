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
import { join } from 'path';
import { Logger } from '@dismodular/shared';
import DatabaseModel from './models/Database.js';
import { initializePassport } from './middleware/auth.js';
import PluginController from './controllers/PluginController.js';
import { createPluginRoutes } from './routes/plugins.js';
import { createBotRoutes } from './routes/bot.js';
import { createAuthRoutes } from './routes/auth.js';
import { createAdminRoutes } from './routes/admin.js';

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
  databasePath: process.env.DATABASE_PATH ? join(workspaceRoot, process.env.DATABASE_PATH) : join(workspaceRoot, 'data', 'bot.db'),
  pluginsDir: process.env.PLUGINS_DIR ? join(workspaceRoot, process.env.PLUGINS_DIR) : join(workspaceRoot, 'plugins'),
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3002/api/auth/discord/callback'
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

logger.info('Starting API Server...');
logger.info(`Database: ${config.databasePath}`);
logger.info(`Plugins Directory: ${config.pluginsDir}`);

// Initialize database
const database = new DatabaseModel(config.databasePath);
const db = database.getInstance();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow embedding for development
}));

app.use(cors({
  origin: process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(':3002', ':5173') : 'http://localhost:5173',
  credentials: true
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
    sameSite: 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
initializePassport(db, config.discord);

// Initialize controllers
const pluginController = new PluginController(db, config.pluginsDir);

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Discord Bot Modular API',
    version: '0.0.1',
    author: 'fkndean_'
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', createAuthRoutes());
app.use('/api/plugins', createPluginRoutes(pluginController));
app.use('/api/bot', createBotRoutes(db));
app.use('/api/admin', createAdminRoutes(db));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
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
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    database.close();
    logger.success('API Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    database.close();
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

