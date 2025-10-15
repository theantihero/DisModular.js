/**
 * Bot Client - Main Discord bot class
 * Initializes bot, manages commands, and handles events
 * @author fkndean_
 * @date 2025-10-14
 */

import { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags } from 'discord.js';
import { Logger } from '@dismodular/shared';
import PluginModel from '../models/PluginModel.js';
import PluginManager from '../plugins/PluginManager.js';
import PluginLoader from '../plugins/PluginLoader.js';

const logger = new Logger('BotClient');

export class BotClient {
  /**
   * Initialize Bot Client
   * @param {Object} config - Bot configuration
   */
  constructor(config) {
    this.config = config;
    
    // Default intents (non-privileged)
    const intents = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions
    ];
    
    // Add privileged intents if enabled in config
    // Note: These require manual enabling in Discord Developer Portal
    if (config.enableMessageContent) {
      intents.push(GatewayIntentBits.MessageContent);
    }
    if (config.enableGuildMembers) {
      intents.push(GatewayIntentBits.GuildMembers);
    }
    
    this.client = new Client({ intents });

    // Initialize models and managers
    this.pluginModel = new PluginModel(config.databasePath);
    this.pluginManager = new PluginManager(this.client, this.pluginModel);
    this.pluginLoader = new PluginLoader(
      config.pluginsDirectory,
      this.pluginManager,
      this.pluginModel,
      () => this.registerSlashCommands() // Re-register commands when plugins change
    );

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup Discord event handlers
   */
  setupEventHandlers() {
    // Use 'ready' event (clientReady is for v15+, but works in v14)
    this.client.once('ready', () => this.onReady());
    this.client.on('interactionCreate', (interaction) => this.onInteraction(interaction));
    this.client.on('messageCreate', (message) => this.onMessage(message));
    this.client.on('error', (error) => this.onError(error));
  }

  /**
   * Handle ready event
   */
  async onReady() {
    logger.success(`Bot logged in as ${this.client.user.tag}`);
    logger.info(`Bot is in ${this.client.guilds.cache.size} guilds`);

    // Load plugins
    await this.pluginLoader.syncPlugins();

    // Register slash commands
    await this.registerSlashCommands();

    logger.success('Bot is ready!');
  }

  /**
   * Handle interaction (slash commands)
   * @param {Object} interaction - Discord interaction
   */
  async onInteraction(interaction) {
    const startTime = Date.now();
    
    if (!interaction.isChatInputCommand()) return;

    // Defer reply IMMEDIATELY - no logging or processing before this
    try {
      await interaction.deferReply();
      const deferTime = Date.now() - startTime;
      logger.debug(`Slash command received: /${interaction.commandName} (deferred in ${deferTime}ms)`);
    } catch (deferError) {
      const errorTime = Date.now() - startTime;
      logger.error(`Failed to defer reply after ${errorTime}ms:`, deferError);
      logger.warn(`Interaction created at: ${new Date(interaction.createdTimestamp).toISOString()}`);
      logger.warn(`Current time: ${new Date().toISOString()}`);
      logger.warn(`Age: ${Date.now() - interaction.createdTimestamp}ms`);
      return;
    }

    try {
      // Find plugin for this command
      const plugin = this.pluginManager.getPluginByCommand(
        interaction.commandName,
        'slash'
      );

      if (!plugin) {
        await interaction.editReply({
          content: 'Command not found.'
        });
        return;
      }

      // Execute plugin
      const context = {
        interaction,
        client: this.client,
        reply: async (content) => {
          if (typeof content === 'string') {
            await interaction.editReply(content);
          } else {
            await interaction.editReply(content);
          }
        }
      };

      await this.pluginManager.execute(plugin.id, context);
    } catch (error) {
      logger.error('Interaction error:', error);
      
      try {
        await interaction.editReply({
          content: 'An error occurred while executing this command.'
        });
      } catch (replyError) {
        logger.error('Failed to send error message:', replyError);
      }
    }
  }

  /**
   * Handle message (text commands)
   * @param {Object} message - Discord message
   */
  async onMessage(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    try {
      const prefix = this.config.prefix || '!';
      
      // Check if message starts with prefix
      if (!message.content.startsWith(prefix)) return;

      // Parse command
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      logger.debug(`Text command received: ${prefix}${commandName}`);

      // Find plugin for this command
      const plugin = this.pluginManager.getPluginByCommand(commandName, 'text');

      if (!plugin) return; // Silently ignore unknown commands

      // Execute plugin
      const context = {
        message,
        args,
        client: this.client,
        reply: async (content) => {
          await message.reply(content);
        }
      };

      await this.pluginManager.execute(plugin.id, context);
    } catch (error) {
      logger.error('Message error:', error);
      await message.reply('An error occurred while executing this command.');
    }
  }

  /**
   * Handle client errors
   * @param {Error} error - Error object
   */
  onError(error) {
    logger.error('Client error:', error);
  }

  /**
   * Register slash commands with Discord
   */
  async registerSlashCommands() {
    try {
      const plugins = this.pluginManager.getEnabledPlugins();
      const slashPlugins = plugins.filter(
        p => p.type === 'slash' || p.type === 'both'
      );

      if (slashPlugins.length === 0) {
        logger.info('No slash commands to register');
        return;
      }

      // Debug: Log plugin data to understand the structure
      logger.debug('Slash plugins data:', slashPlugins.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        trigger_command: p.trigger_command,
        trigger: p.trigger
      })));

      const commands = slashPlugins.map(plugin => {
        // Try multiple ways to get the command name
        const commandName = plugin.trigger_command || plugin.trigger?.command || 'unknown';
        
        if (!commandName || commandName === 'unknown') {
          logger.error(`Plugin ${plugin.name} (${plugin.id}) missing command name:`, {
            trigger_command: plugin.trigger_command,
            trigger: plugin.trigger
          });
          return null;
        }

        return {
          name: commandName.toLowerCase(),
          description: plugin.description || `Execute ${plugin.name}`,
          options: plugin.options || []
        };
      }).filter(Boolean); // Remove null entries

      const rest = new REST({ version: '10' }).setToken(this.config.token);

      logger.info(`Registering ${commands.length} slash commands...`);

      // Register commands globally or per guild
      if (this.config.guildId) {
        await rest.put(
          Routes.applicationGuildCommands(this.config.clientId, this.config.guildId),
          { body: commands }
        );
        logger.success('Guild commands registered');
      } else {
        await rest.put(
          Routes.applicationCommands(this.config.clientId),
          { body: commands }
        );
        logger.success('Global commands registered');
      }
    } catch (error) {
      logger.error('Failed to register slash commands:', error);
    }
  }

  /**
   * Start the bot
   */
  async start() {
    try {
      logger.info('Starting bot...');
      await this.client.login(this.config.token);
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the bot
   */
  async stop() {
    try {
      logger.info('Stopping bot...');
      this.pluginLoader.stopWatching();
      this.pluginModel.close();
      await this.client.destroy();
      logger.success('Bot stopped');
    } catch (error) {
      logger.error('Failed to stop bot:', error);
    }
  }

  /**
   * Get bot statistics
   * @returns {Object} Bot statistics
   */
  getStatistics() {
    return {
      uptime: process.uptime(),
      guilds: this.client.guilds.cache.size,
      users: this.client.users.cache.size,
      channels: this.client.channels.cache.size,
      plugins: this.pluginManager.getStatistics()
    };
  }
}

export default BotClient;

