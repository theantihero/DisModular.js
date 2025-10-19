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
        
        if (!isEnabledForGuild) {
          logger.warn(`Plugin ${plugin.name} not enabled for guild ${interaction.guild.name}`);
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

      // Get enabled plugins for this guild
      const enabledPlugins = await this.getEnabledPluginsForGuild(guildId);
      const slashPlugins = enabledPlugins.filter(
        p => p.type === 'slash' || p.type === 'both',
      );

      if (slashPlugins.length === 0) {
        logger.debug(`No slash commands to register for guild ${guild.name} (${guildId})`);
        // Clear existing commands if no plugins are enabled
        const rest = new REST({ version: '10' }).setToken(this.config.token);
        await rest.put(
          Routes.applicationGuildCommands(this.config.clientId, guildId),
          { body: [] },
        );
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

      if (commands.length === 0) {
        logger.warn(`No valid commands to register for guild ${guild.name} (${guildId})`);
        return;
      }

      const rest = new REST({ version: '10' }).setToken(this.config.token);

      await rest.put(
        Routes.applicationGuildCommands(this.config.clientId, guildId),
        { body: commands },
      );

      logger.success(`Registered ${commands.length} commands for guild ${guild.name} (${guildId})`);
      logger.debug(`Commands: ${commands.map(c => c.name).join(', ')}`);
    } catch (error) {
      logger.error(`Failed to register commands for guild ${guildId}:`, error);
      
      // If it's a rate limit error, log it specifically
      if (error.code === 429) {
        logger.warn('Rate limited while registering commands, Discord will retry automatically');
      }
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

