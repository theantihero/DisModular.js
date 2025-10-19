/**
 * Bot Client - Main Discord bot class
 * Initializes bot, manages commands, and handles events
 * @author fkndean_
 * @date 2025-10-14
 */

import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { Logger } from '@dismodular/shared';
import { getPrismaClient } from '../services/PrismaService.js';
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
    this.prisma = null; // Will be initialized lazily
    
    // Default intents (non-privileged)
    const intents = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
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
    this.pluginModel = new PluginModel();
    this.pluginManager = new PluginManager(this.client, this.pluginModel);
    this.pluginLoader = new PluginLoader(
      config.pluginsDirectory,
      this.pluginManager,
      this.pluginModel,
      () => this.registerSlashCommands(), // Re-register commands when plugins change
    );
    
    // Pass bot client reference to plugin loader for cache management
    this.pluginLoader.botClient = this;

    // Cache for registered commands to avoid unnecessary re-registration
    this.registeredCommands = new Map(); // guildId -> Set of command names
    this.commandHashes = new Map(); // guildId -> hash of command definitions

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Get Prisma client instance (lazy initialization)
   * @returns {PrismaClient|null} Prisma client instance or null if not available
   */
  getPrisma() {
    if (!this.prisma) {
      this.prisma = getPrismaClient(this.config.databaseUrl);
    }
    return this.prisma;
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
    
    // Guild management events
    this.client.on('guildCreate', (guild) => this.onGuildJoin(guild));
    this.client.on('guildDelete', (guild) => this.onGuildLeave(guild));
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
    
    if (!interaction.isChatInputCommand()) {
      return;
    }

    // Check if interaction is too old (Discord has a 3-second limit)
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 2500) { // 2.5 seconds safety margin
      logger.error(`Interaction too old: ${interactionAge}ms, ignoring`);
      return;
    }

    // Log interaction details before attempting to defer
    logger.debug(`Processing interaction: ${interaction.id}, command: /${interaction.commandName}, guild: ${interaction.guild?.name || 'DM'}, age: ${interactionAge}ms`);

    // Defer reply IMMEDIATELY - no logging or processing before this
    try {
      await interaction.deferReply();
      const deferTime = Date.now() - startTime;
      logger.debug(`Slash command received: /${interaction.commandName} (deferred in ${deferTime}ms, age: ${interactionAge}ms)`);
    } catch (deferError) {
      const errorTime = Date.now() - startTime;
      logger.error(`Failed to defer reply after ${errorTime}ms:`, deferError);
      logger.warn(`Interaction created at: ${new Date(interaction.createdTimestamp).toISOString()}`);
      logger.warn(`Current time: ${new Date().toISOString()}`);
      logger.warn(`Age: ${interactionAge}ms`);
      logger.warn(`Command: /${interaction.commandName}, Guild: ${interaction.guild?.name || 'DM'}`);
      logger.warn(`Interaction ID: ${interaction.id}`);
      logger.warn(`Bot user: ${this.client.user?.tag || 'Unknown'}`);
      
      // Try to send a follow-up message if defer failed
      try {
        await interaction.followUp({ 
          content: '⚠️ Command timed out. Please try again.',
          ephemeral: true 
        });
      } catch (followUpError) {
        logger.error('Failed to send follow-up message:', followUpError);
      }
      return;
    }

    try {
      // Find plugin for this command
      const plugin = this.pluginManager.getPluginByCommand(
        interaction.commandName,
        'slash',
      );

      if (!plugin) {
        logger.warn(`Command /${interaction.commandName} not found in plugin manager`);
        logger.debug(`Available commands: ${Array.from(this.pluginManager.plugins.keys()).join(', ')}`);
        await interaction.editReply({
          content: '⚠️ Command not found. Please contact an administrator.',
        });
        return;
      }

      // Check if plugin is enabled for this guild
      if (interaction.guild) {
        const guildPlugins = await this.getEnabledPluginsForGuild(interaction.guild.id);
        const isEnabledForGuild = guildPlugins.some(gp => gp.id === plugin.id);
        
        logger.debug(`Guild ${interaction.guild.name} (${interaction.guild.id}):`);
        logger.debug(`  Plugin ${plugin.name} (${plugin.id}): enabled=${isEnabledForGuild}`);
        logger.debug(`  Guild enabled plugins: ${guildPlugins.map(gp => `${gp.name}(${gp.id})`).join(', ')}`);
        
        if (!isEnabledForGuild) {
          logger.warn(`Plugin ${plugin.name} (${plugin.id}) not enabled for guild ${interaction.guild.name} (${interaction.guild.id})`);
          await interaction.editReply({
            content: '⚠️ This command is not enabled in this server.',
          });
          return;
        }
      }

      // Execute plugin
      const context = {
        interaction,
        client: this.client,
        guild: interaction.guild,
        guildId: interaction.guild?.id,
        reply: async (content) => {
          if (typeof content === 'string') {
            await interaction.editReply(content);
          } else {
            await interaction.editReply(content);
          }
        },
      };

      await this.pluginManager.execute(plugin.id, context);
    } catch (error) {
      logger.error('Interaction error:', error);
      
      try {
        await interaction.editReply({
          content: 'An error occurred while executing this command.',
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
    if (message.author.bot) {return;}

    try {
      const prefix = this.config.prefix || '!';
      
      // Check if message starts with prefix
      if (!message.content.startsWith(prefix)) {return;}

      // Parse command
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      logger.debug(`Text command received: ${prefix}${commandName}`);

      // Find plugin for this command
      const plugin = this.pluginManager.getPluginByCommand(commandName, 'text');

      if (!plugin) {return;} // Silently ignore unknown commands

      // Execute plugin
      const context = {
        message,
        args,
        client: this.client,
        guild: message.guild,
        guildId: message.guild?.id,
        reply: async (content) => {
          await message.reply(content);
        },
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
   * Generate a hash for command definitions to detect changes
   * @param {Array} commands - Array of command objects
   * @returns {string} Hash string
   */
  generateCommandHash(commands) {
    const crypto = require('crypto');
    const commandString = JSON.stringify(commands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options || []
    })));
    return crypto.createHash('md5').update(commandString).digest('hex');
  }

  /**
   * Compare two command arrays to see if they're different
   * @param {Array} oldCommands - Previously registered commands
   * @param {Array} newCommands - New commands to register
   * @returns {boolean} True if commands have changed
   */
  commandsHaveChanged(oldCommands, newCommands) {
    if (!oldCommands || !newCommands) return true;
    if (oldCommands.length !== newCommands.length) return true;

    const oldHash = this.generateCommandHash(oldCommands);
    const newHash = this.generateCommandHash(newCommands);
    
    return oldHash !== newHash;
  }

  /**
   * Clear command cache for a specific guild or all guilds
   * @param {string} [guildId] - Specific guild ID, or undefined for all guilds
   */
  clearCommandCache(guildId = null) {
    if (guildId) {
      this.registeredCommands.delete(guildId);
      this.commandHashes.delete(guildId);
      logger.debug(`Cleared command cache for guild ${guildId}`);
    } else {
      this.registeredCommands.clear();
      this.commandHashes.clear();
      logger.debug('Cleared command cache for all guilds');
    }
  }

  /**
   * Force re-register commands for a specific guild (for debugging)
   * @param {string} guildId - Discord guild ID
   */
  async forceReregisterCommands(guildId) {
    logger.info(`Force re-registering commands for guild ${guildId}`);
    this.clearCommandCache(guildId);
    await this.registerGuildCommands(guildId);
  }

  /**
   * Register slash commands for all guilds
   */
  async registerSlashCommands() {
    try {
      const guilds = this.client.guilds.cache;
      logger.info(`Registering commands for ${guilds.size} guilds...`);

      const registrationPromises = [];
      for (const [guildId, guild] of guilds) {
        registrationPromises.push(
          this.registerGuildCommands(guildId).catch(error => {
            logger.error(`Failed to register commands for guild ${guild.name} (${guildId}):`, error);
          })
        );
      }

      await Promise.allSettled(registrationPromises);
      logger.success('All guild commands registration attempted');
    } catch (error) {
      logger.error('Failed to register slash commands:', error);
    }
  }

  /**
   * Register slash commands for a specific guild
   * @param {string} guildId - Discord guild ID
   */
  async registerGuildCommands(guildId) {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        logger.warn(`Guild ${guildId} not found in cache, skipping command registration`);
        return;
      }

      // Ensure guild exists in database
      await this.ensureGuildExists(guildId);

      // Get all slash commands from plugin manager (not just guild-specific ones)
      // This ensures all available commands are registered during startup
      // The guild-specific enablement is checked during command execution
      const allPlugins = Array.from(this.pluginManager.plugins.values());
      const slashPlugins = allPlugins.filter(
        p => (p.type === 'slash' || p.type === 'both') && p.enabled !== false,
      );

      if (slashPlugins.length === 0) {
        logger.debug(`No slash commands to register for guild ${guild.name} (${guildId})`);
        
        // Check if we need to clear commands
        const cachedCommands = this.registeredCommands.get(guildId);
        if (cachedCommands && cachedCommands.size > 0) {
          logger.info(`Clearing ${cachedCommands.size} commands for guild ${guild.name} (${guildId})`);
          const rest = new REST({ version: '10' }).setToken(this.config.token);
          await rest.put(
            Routes.applicationGuildCommands(this.config.clientId, guildId),
            { body: [] },
          );
          this.registeredCommands.set(guildId, new Set());
          this.commandHashes.set(guildId, '');
        }
        return;
      }

      const commands = slashPlugins.map(plugin => {
        const commandName = plugin.trigger_command || plugin.trigger?.command || 'unknown';
        
        if (!commandName || commandName === 'unknown') {
          logger.error(`Plugin ${plugin.name} (${plugin.id}) missing command name`);
          return null;
        }

        // Validate command name (Discord requirements)
        const cleanCommandName = commandName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (cleanCommandName !== commandName.toLowerCase()) {
          logger.warn(`Command name '${commandName}' cleaned to '${cleanCommandName}' for Discord compatibility`);
        }

        return {
          name: cleanCommandName,
          description: (plugin.description || `Execute ${plugin.name}`).substring(0, 100), // Discord limit
          options: plugin.options || [],
        };
      }).filter(Boolean);

      logger.debug(`Generated ${commands.length} commands for guild ${guild.name} (${guildId})`);

      if (commands.length === 0) {
        logger.info(`No commands to register for guild ${guild.name} (${guildId}) - skipping registration`);
        return;
      }

      // Check if commands have changed
      const cachedCommands = this.registeredCommands.get(guildId);
      const cachedHash = this.commandHashes.get(guildId);
      const newHash = this.generateCommandHash(commands);
      
      if (cachedHash === newHash && cachedCommands && cachedCommands.size === commands.length) {
        logger.debug(`Commands unchanged for guild ${guild.name} (${guildId}), skipping registration`);
        return;
      }
      
      // Additional validation: check if we're trying to register the same commands
      if (cachedCommands && commands.length > 0) {
        const currentCommandNames = new Set(commands.map(cmd => cmd.name));
        const commandsMatch = cachedCommands.size === currentCommandNames.size && 
                             [...cachedCommands].every(name => currentCommandNames.has(name));
        
        if (commandsMatch && cachedHash === newHash) {
          logger.debug(`Same commands already registered for guild ${guild.name} (${guildId}), skipping registration`);
          return;
        }
      }

      // Commands have changed, register them
      logger.info(`Commands changed for guild ${guild.name} (${guildId}), registering ${commands.length} commands`);
      
      const rest = new REST({ version: '10' }).setToken(this.config.token);

      logger.debug(`About to register commands for guild ${guildId}:`, commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        options: cmd.options?.length || 0
      })));

      const response = await rest.put(
        Routes.applicationGuildCommands(this.config.clientId, guildId),
        { body: commands },
      );

      logger.debug(`Discord API response for guild ${guildId}:`, {
        status: response?.status,
        data: response?.data,
        headers: response?.headers
      });

      // Update cache
      const commandNames = new Set(commands.map(cmd => cmd.name));
      this.registeredCommands.set(guildId, commandNames);
      this.commandHashes.set(guildId, newHash);

      logger.success(`Registered ${commands.length} commands for guild ${guild.name} (${guildId})`);
      logger.debug(`Commands: ${commands.map(c => c.name).join(', ')}`);
    } catch (error) {
      // Log the raw error first
      logger.error(`Raw error object:`, error);
      logger.error(`Error type:`, typeof error);
      logger.error(`Error constructor:`, error?.constructor?.name);
      
      // Handle different types of errors more gracefully
      if (error.code === 429) {
        logger.warn(`Rate limited while registering commands for guild ${guild.name} (${guildId}), Discord will retry automatically`);
        return;
      }
      
      if (error.code === 50001) {
        logger.warn(`Missing access for guild ${guild.name} (${guildId}), bot may not be in this server`);
        return;
      }
      
      if (error.code === 50013) {
        logger.warn(`Missing permissions for guild ${guild.name} (${guildId}), bot lacks required permissions`);
        return;
      }
      
      // Check if it's an empty response (commands already registered)
      if (error.message && error.message.includes('already registered') || 
          (error.response && error.response.status === 200 && !error.response.data)) {
        logger.debug(`Commands already registered for guild ${guild.name} (${guildId}), updating cache`);
        // Update cache anyway since commands are registered
        const commandNames = new Set(commands.map(cmd => cmd.name));
        this.registeredCommands.set(guildId, commandNames);
        this.commandHashes.set(guildId, newHash);
        return;
      }
      
      // Log the actual error details for debugging
      logger.error(`Failed to register commands for guild ${guild.name} (${guildId}):`, {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
        fullError: error
      });
      
      // Also log the commands we were trying to register
      logger.error(`Commands being registered:`, commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        options: cmd.options?.length || 0
      })));
    }
  }

  /**
   * Ensure guild exists in database
   * @param {string} guildId - Discord guild ID
   */
  async ensureGuildExists(guildId) {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        logger.warn(`Guild ${guildId} not found in cache`);
        return;
      }

      await this.getPrisma().guild.upsert({
        where: { id: guildId },
        update: {
          name: guild.name,
          enabled: true,
        },
        create: {
          id: guildId,
          name: guild.name,
          enabled: true,
          settings: {},
        },
      });

      logger.debug(`Ensured guild ${guild.name} (${guildId}) exists in database`);
    } catch (error) {
      logger.error(`Failed to ensure guild ${guildId} exists:`, error);
    }
  }

  /**
   * Get enabled plugins for a specific guild
   * @param {string} guildId - Discord guild ID
   * @returns {Array} Array of enabled plugins
   */
  async getEnabledPluginsForGuild(guildId) {
    try {
      const guildPlugins = await this.getPrisma().guildPlugin.findMany({
        where: {
          guild_id: guildId,
          enabled: true,
        },
        include: {
          plugin: true,
        },
      });

      return guildPlugins.map(gp => gp.plugin);
    } catch (error) {
      logger.error(`Failed to get enabled plugins for guild ${guildId}:`, error);
      return [];
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
      await this.pluginModel.close();
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
      plugins: this.pluginManager.getStatistics(),
    };
  }

  /**
   * Handle guild join event
   * @param {Object} guild - Discord guild object
   */
  async onGuildJoin(guild) {
    try {
      logger.info(`Joined guild: ${guild.name} (${guild.id})`);
      
      // Register guild in database
      await this.ensureGuildExists(guild.id);
      
      // Register commands for this guild
      await this.registerGuildCommands(guild.id);
      
      logger.success(`Guild ${guild.name} setup completed`);
    } catch (error) {
      logger.error(`Failed to setup guild ${guild.name}:`, error);
    }
  }

  /**
   * Handle guild leave event
   * @param {Object} guild - Discord guild object
   */
  async onGuildLeave(guild) {
    try {
      logger.info(`Left guild: ${guild.name} (${guild.id})`);
      
      // Mark guild as disabled in database
      await this.getPrisma().guild.update({
        where: { id: guild.id },
        data: { enabled: false },
      });
      
      logger.success(`Guild ${guild.name} marked as disabled`);
    } catch (error) {
      logger.error(`Failed to update guild ${guild.name}:`, error);
    }
  }
}

export default BotClient;

