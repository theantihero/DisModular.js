/**
 * Bot Entry Point
 * @author fkndean_
 * @date 2025-10-14
 */

import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '@dismodular/shared';
import BotClient from './core/BotClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = new Logger('Main');

// Validate environment variables
const requiredEnvVars = ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('Please check your .env file');
  process.exit(1);
}

// Bot configuration
// Resolve paths relative to workspace root (2 levels up from packages/bot/src)
const workspaceRoot = join(__dirname, '..', '..', '..');
const config = {
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID, // Optional: for guild-specific commands
  prefix: process.env.BOT_PREFIX || '!',
  databasePath: process.env.DATABASE_PATH ? join(workspaceRoot, process.env.DATABASE_PATH) : join(workspaceRoot, 'data', 'bot.db'),
  pluginsDirectory: process.env.PLUGINS_DIR ? join(workspaceRoot, process.env.PLUGINS_DIR) : join(workspaceRoot, 'plugins'),
  // Privileged intents (require enabling in Discord Developer Portal)
  enableMessageContent: process.env.ENABLE_MESSAGE_CONTENT === 'true',
  enableGuildMembers: process.env.ENABLE_GUILD_MEMBERS === 'true'
};

logger.info('Starting Discord Bot Modular Platform...');
logger.info(`Database: ${config.databasePath}`);
logger.info(`Plugins Directory: ${config.pluginsDirectory}`);
logger.info(`Command Prefix: ${config.prefix}`);

// Initialize bot
const bot = new BotClient(config);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
bot.start().catch((error) => {
  logger.error('Failed to start bot:', error);
  process.exit(1);
});

