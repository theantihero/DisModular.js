/**
 * Guild Management Routes
 * Handles guild-specific plugin management and command registration
 * @author fkndean_
 * @date 2025-10-18
 */

import { Router } from 'express';
import { getPrismaClient } from '../services/PrismaService.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import axios from 'axios';
import { expensiveOperationLimiter } from '../middleware/rateLimiter.js';

// Import getUserGuilds from auth routes
async function getUserGuilds(accessToken) {
  try {
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user guilds:', error);
    throw error;
  }
}

const router = Router();

// Helper function to get Prisma client with error handling
function getPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error('Database not available');
  }
  return prisma;
}

/**
 * Helper function to verify guild admin permissions with caching
 */
async function verifyGuildAdminPermission(userId, guildId, accessToken) {
  // Check cached guild permissions first
  const cachedPermission = await getPrisma().userGuildPermission.findFirst({
    where: {
      user_id: userId,
      guild_id: guildId,
    },
  });

  let hasAdminPermission = false;

  if (cachedPermission) {
    // Check if cache is still valid (less than 5 minutes old)
    const cacheAge = Date.now() - cachedPermission.updated_at.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (cacheAge < fiveMinutes) {
      hasAdminPermission = cachedPermission.is_admin;
    } else {
      // Cache expired, need to refresh
      try {
        const discordResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 5000,
        });

        const userGuilds = discordResponse.data;
        const targetGuild = userGuilds.find(guild => guild.id === guildId);
        
        if (targetGuild) {
          hasAdminPermission = (targetGuild.permissions & 0x8) === 0x8;
          
          // Update cache
          await getPrisma().userGuildPermission.upsert({
            where: {
              user_id_guild_id: {
                user_id: userId,
                guild_id: guildId,
              },
            },
            update: {
              is_admin: hasAdminPermission,
              permissions: targetGuild.permissions,
              updated_at: new Date(),
            },
            create: {
              user_id: userId,
              guild_id: guildId,
              is_admin: hasAdminPermission,
              permissions: targetGuild.permissions,
            },
          });
        }
      } catch (discordError) {
        // If Discord API fails, use cached permission as fallback
        if (cachedPermission) {
          hasAdminPermission = cachedPermission.is_admin;
          const safeGuildId = String(guildId).replace(/[\r\n]/g, '');
          console.warn('Discord API failed for guild %s, using cached permission:', safeGuildId, discordError.message);
        } else {
          throw new Error('Unable to verify guild permissions. Please try again later.');
        }
      }
    }
  } else {
    // No cache, fetch from Discord
    try {
      const discordResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 5000,
      });

      const userGuilds = discordResponse.data;
      const targetGuild = userGuilds.find(guild => guild.id === guildId);
      
      if (!targetGuild) {
        throw new Error('Guild not found or you are not a member');
      }

      hasAdminPermission = (targetGuild.permissions & 0x8) === 0x8;
      
      // Cache the result
      await getPrisma().userGuildPermission.create({
        data: {
          user_id: userId,
          guild_id: guildId,
          is_admin: hasAdminPermission,
          permissions: targetGuild.permissions,
        },
      });
    } catch (discordError) {
      if (discordError.response?.status === 429) {
        const error = new Error('Rate limited by Discord. Please wait a moment and try again.');
        error.statusCode = 429;
        error.retryAfter = discordError.response.data?.retry_after || 1;
        throw error;
      }
      
      throw new Error('Unable to verify guild permissions. Please try again later.');
    }
  }

  return hasAdminPermission;
}

/**
 * GET /guilds
 * List all guilds the bot is in
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const guilds = await getPrisma().guild.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        guild_plugins: {
          include: {
            plugin: {
              select: {
                id: true,
                name: true,
                type: true,
                enabled: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: guilds.map(guild => ({
        id: guild.id,
        name: guild.name,
        enabled: guild.enabled,
        settings: guild.settings,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
        plugin_count: guild.guild_plugins.length,
        enabled_plugins: guild.guild_plugins.filter(gp => gp.enabled).length,
      })),
    });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guilds',
    });
  }
});

/**
 * GET /guilds/:guildId/plugins
 * Get plugins enabled for a specific guild
 */
router.get('/:guildId/plugins', requireAdmin, async (req, res) => {
  try {
    const { guildId } = req.params;

    const guildPlugins = await getPrisma().guildPlugin.findMany({
      where: { guild_id: guildId },
      include: {
        plugin: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: guildPlugins.map(gp => ({
        guild_id: gp.guild_id,
        plugin_id: gp.plugin_id,
        enabled: gp.enabled,
        settings: gp.settings,
        created_at: gp.created_at,
        plugin: {
          id: gp.plugin.id,
          name: gp.plugin.name,
          version: gp.plugin.version,
          description: gp.plugin.description,
          author: gp.plugin.author,
          type: gp.plugin.type,
          is_template: gp.plugin.is_template,
          template_category: gp.plugin.template_category,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching guild plugins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guild plugins',
    });
  }
});

/**
 * GET /guilds/:guildId/plugins/all
 * Get all plugins with guild-specific enabled status
 */
router.get('/:guildId/plugins/all', requireAuth, expensiveOperationLimiter, async (req, res) => {
  try {
    const { guildId } = req.params;
    const userId = req.user.id;

    // Global admins have access to all guilds
    if (!req.user.is_admin) {
      // Verify user has admin access to this guild using cached permissions
      try {
        const hasAdminPermission = await verifyGuildAdminPermission(userId, guildId, req.user.access_token);
        
        if (!hasAdminPermission) {
          return res.status(403).json({
            success: false,
            error: 'Admin privileges required for this guild',
          });
        }
      } catch (error) {
        if (error.statusCode === 429) {
          return res.status(429).json({
            success: false,
            error: error.message,
            retry_after: error.retryAfter,
          });
        }
      
        return res.status(503).json({
          success: false,
          error: error.message,
        });
      }
    }

    // Get all plugins
    const allPlugins = await getPrisma().plugin.findMany({
      orderBy: { created_at: 'desc' },
    });

    // Get guild-specific plugin settings
    const guildPlugins = await getPrisma().guildPlugin.findMany({
      where: { guild_id: guildId },
    });

    // Create a map for quick lookup
    const guildPluginMap = new Map();
    guildPlugins.forEach(gp => {
      guildPluginMap.set(gp.plugin_id, gp);
    });

    // Combine data
    const pluginsWithGuildStatus = allPlugins.map(plugin => {
      const guildPlugin = guildPluginMap.get(plugin.id);
      return {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        type: plugin.type,
        enabled: plugin.enabled, // Global enabled status
        guild_enabled: guildPlugin ? guildPlugin.enabled : plugin.enabled, // Guild-specific enabled status
        guild_settings: guildPlugin ? guildPlugin.settings : {},
        is_template: plugin.is_template,
        template_category: plugin.template_category,
        created_at: plugin.created_at,
        updated_at: plugin.updated_at,
      };
    });

    res.json({
      success: true,
      data: pluginsWithGuildStatus,
    });
  } catch (error) {
    console.error('Error fetching all plugins with guild status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plugins with guild status',
    });
  }
});

/**
 * PUT /guilds/:guildId/plugins/:pluginId
 * Enable/disable a plugin for a specific guild
 */
router.put('/:guildId/plugins/:pluginId', requireAuth, expensiveOperationLimiter, async (req, res) => {
  try {
    const { guildId, pluginId } = req.params;
    const { enabled, settings } = req.body;
    const userId = req.user.id;

    // Global admins have access to all guilds
    if (!req.user.is_admin) {
      // Verify user has admin access to this guild using cached permissions
      try {
        const hasAdminPermission = await verifyGuildAdminPermission(userId, guildId, req.user.access_token);
        
        if (!hasAdminPermission) {
          return res.status(403).json({
            success: false,
            error: 'Admin privileges required for this guild',
          });
        }
      } catch (error) {
        if (error.statusCode === 429) {
          return res.status(429).json({
            success: false,
            error: error.message,
            retry_after: error.retryAfter,
          });
        }
      
        return res.status(503).json({
          success: false,
          error: error.message,
        });
      }
    }

    // Ensure guild exists
    const guild = await getPrisma().guild.findUnique({
      where: { id: guildId },
    });

    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Guild not found',
      });
    }

    // Ensure plugin exists
    const plugin = await getPrisma().plugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      // Helper to sanitize user input for log output.
      // Only allow alphanumerics, dashes, and underscores. Remove everything else.
      function sanitizeForLog(input) {
        if (typeof input !== 'string') {
          input = String(input);
        }
        // Strict whitelist: allow only a-z, A-Z, 0-9, dash, underscore.
        input = input.replace(/[^a-zA-Z0-9\-_]/g, '');
        return `"${input}"`;
      }
      const safePluginId = sanitizeForLog(pluginId);
      console.error(`Plugin not found: [pluginId=${safePluginId}]`);
      return res.status(404).json({
        success: false,
        error: `Plugin '${pluginId}' not found. Please ensure the plugin is loaded in the database.`,
      });
    }

    // Upsert guild plugin relationship
    console.log(
      "Toggling plugin %s for guild %s:",
      pluginId,
      guildId,
      {
        enabled,
        settings,
        pluginName: plugin.name,
        globalEnabled: plugin.enabled
      }
    );
    
    const guildPlugin = await getPrisma().guildPlugin.upsert({
      where: {
        guild_id_plugin_id: {
          guild_id: guildId,
          plugin_id: pluginId,
        },
      },
      update: {
        enabled: enabled !== undefined ? enabled : true,
        settings: settings || {},
      },
      create: {
        guild_id: guildId,
        plugin_id: pluginId,
        enabled: enabled !== undefined ? enabled : true,
        settings: settings || {},
      },
    });
    
    console.log(`Guild plugin updated:`, {
      guildId,
      pluginId,
      enabled: guildPlugin.enabled,
      settings: guildPlugin.settings
    });

    // Create audit log
    await getPrisma().auditLog.create({
      data: {
        user_id: req.user.id,
        action: enabled ? 'ENABLE_GUILD_PLUGIN' : 'DISABLE_GUILD_PLUGIN',
        resource_type: 'GuildPlugin',
        resource_id: `${guildId}-${pluginId}`,
        details: {
          guild_id: guildId,
          plugin_id: pluginId,
          plugin_name: plugin.name,
          enabled: guildPlugin.enabled,
        },
      },
    });

    res.json({
      success: true,
      message: `Plugin ${enabled ? 'enabled' : 'disabled'} for guild`,
      data: guildPlugin,
    });
  } catch (error) {
    console.error('Error updating guild plugin:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      guildId: req.params.guildId,
      pluginId: req.params.pluginId,
      enabled: req.body.enabled
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update guild plugin',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/guilds/:guildId/reregister-commands
 * Force re-register commands for a guild (for debugging)
 */
router.post('/:guildId/reregister-commands', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Check if user has admin permissions in this guild
    const userGuilds = await getUserGuilds(req.user.access_token);
    const userGuild = userGuilds.find(g => g.id === guildId);
    
    if (!userGuild || !(userGuild.permissions & 0x8)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this guild',
      });
    }

    // Clear bot guild cache to force fresh command registration
    // This will make the bot re-fetch guild data and re-register commands
    try {
      // Import the clearBotGuildCache function from auth routes
      const { clearBotGuildCache } = await import('../routes/auth.js');
      clearBotGuildCache();
      
      res.json({
        success: true,
        message: 'Command re-registration triggered successfully',
        data: {
          guildId: guildId,
          timestamp: new Date().toISOString(),
          note: 'Bot guild cache cleared - commands will be re-registered on next sync'
        }
      });
    } catch (error) {
      console.error('Error triggering command re-registration:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger command re-registration',
        details: error.message,
      });
    }
  } catch (error) {
    console.error('Error re-registering commands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to re-register commands',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/guilds/:guildId/plugins-status
 * Get current plugin status for a guild
 */
router.get('/:guildId/plugins-status', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Check if user has admin permissions in this guild
    const userGuilds = await getUserGuilds(req.user.access_token);
    const userGuild = userGuilds.find(g => g.id === guildId);
    
    if (!userGuild || !(userGuild.permissions & 0x8)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this guild',
      });
    }

    // Get all guild plugin settings
    const guildPlugins = await getPrisma().guildPlugin.findMany({
      where: { guild_id: guildId },
      include: {
        plugin: {
          select: {
            id: true,
            name: true,
            enabled: true,
            trigger_command: true,
            type: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        guildId: guildId,
        guildName: userGuild.name,
        guildPlugins: guildPlugins.map(gp => ({
          pluginId: gp.plugin_id,
          pluginName: gp.plugin.name,
          command: gp.plugin.trigger_command,
          type: gp.plugin.type,
          globalEnabled: gp.plugin.enabled,
          guildEnabled: gp.enabled,
          settings: gp.settings
        }))
      }
    });
  } catch (error) {
    console.error('Error getting guild plugins status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get guild plugins status',
    });
  }
});

/**
 * GET /api/guilds/:guildId/debug-plugins
 * Debug endpoint to show plugin enabling status
 */
router.get('/:guildId/debug-plugins', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Check if user has admin permissions in this guild
    const userGuilds = await getUserGuilds(req.user.access_token);
    const userGuild = userGuilds.find(g => g.id === guildId);
    
    if (!userGuild || !(userGuild.permissions & 0x8)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this guild',
      });
    }

    // Get all plugins from database
    const allPlugins = await getPrisma().plugin.findMany({
      select: {
        id: true,
        name: true,
        enabled: true,
        trigger_command: true,
        type: true
      }
    });

    // Get guild-specific plugin settings
    const guildPlugins = await getPrisma().guildPlugin.findMany({
      where: { guild_id: guildId },
      select: {
        plugin_id: true,
        enabled: true,
        plugin: {
          select: {
            id: true,
            name: true,
            enabled: true,
            trigger_command: true,
            type: true
          }
        }
      }
    });

    // Create a map of guild plugin settings
    const guildPluginMap = new Map(guildPlugins.map(gp => [gp.plugin_id, gp.enabled]));

    // Analyze each plugin
    const pluginAnalysis = allPlugins.map(plugin => {
      const guildEnabled = guildPluginMap.get(plugin.id);
      const effectiveEnabled = guildEnabled !== undefined ? guildEnabled : plugin.enabled;
      
      return {
        id: plugin.id,
        name: plugin.name,
        command: plugin.trigger_command,
        type: plugin.type,
        globalEnabled: plugin.enabled,
        guildEnabled: guildEnabled,
        effectiveEnabled: effectiveEnabled,
        hasGuildSetting: guildPluginMap.has(plugin.id)
      };
    });

    res.json({
      success: true,
      data: {
        guildId: guildId,
        guildName: userGuild.name,
        totalPlugins: allPlugins.length,
        guildPluginSettings: guildPlugins.length,
        plugins: pluginAnalysis,
        summary: {
          globallyEnabled: allPlugins.filter(p => p.enabled).length,
          guildEnabled: guildPlugins.filter(gp => gp.enabled).length,
          effectivelyEnabled: pluginAnalysis.filter(p => p.effectiveEnabled).length
        }
      }
    });
  } catch (error) {
    console.error('Error debugging plugins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to debug plugins',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /guilds/:guildId/sync
 * Sync guild commands (re-register slash commands)
 */
router.post('/:guildId/sync', requireAdmin, expensiveOperationLimiter, async (req, res) => {
  try {
    const { guildId } = req.params;

    // Ensure guild exists
    const guild = await getPrisma().guild.findUnique({
      where: { id: guildId },
    });

    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Guild not found',
      });
    }

    // Call bot API to sync commands
    const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.post(`${botApiUrl}/api/bot/sync-guild-commands`, {
        guildId: guildId,
      }, {
        timeout: 10000,
      });

      if (response.data.success) {
        // Create audit log
        await getPrisma().auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'SYNC_GUILD_COMMANDS',
            resource_type: 'Guild',
            resource_id: guildId,
            details: {
              guild_id: guildId,
              guild_name: guild.name,
              commands_registered: response.data.commands_registered || 0,
            },
          },
        });

        res.json({
          success: true,
          message: 'Guild commands synced successfully',
          data: {
            guild_id: guildId,
            commands_registered: response.data.commands_registered || 0,
          },
        });
      } else {
        throw new Error(response.data.error || 'Failed to sync commands');
      }
    } catch (botError) {
      console.error('Bot API error:', botError.message);
      res.status(500).json({
        success: false,
        error: 'Failed to sync guild commands - bot service unavailable',
      });
    }
  } catch (error) {
    console.error('Error syncing guild commands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync guild commands',
    });
  }
});

/**
 * GET /guilds/:guildId
 * Get specific guild information
 */
router.get('/:guildId', requireAdmin, async (req, res) => {
  try {
    const { guildId } = req.params;

    const guild = await getPrisma().guild.findUnique({
      where: { id: guildId },
      include: {
        guild_plugins: {
          include: {
            plugin: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true,
                is_template: true,
                template_category: true,
              },
            },
          },
        },
      },
    });

    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Guild not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: guild.id,
        name: guild.name,
        enabled: guild.enabled,
        settings: guild.settings,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
        plugins: guild.guild_plugins.map(gp => ({
          guild_id: gp.guild_id,
          plugin_id: gp.plugin_id,
          enabled: gp.enabled,
          settings: gp.settings,
          created_at: gp.created_at,
          plugin: gp.plugin,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guild',
    });
  }
});

/**
 * PUT /guilds/:guildId/settings
 * Update guild-specific bot settings
 */
router.put('/:guildId/settings', requireAuth, expensiveOperationLimiter, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { settings } = req.body;
    const userId = req.user.id;

    // Global admins have access to all guilds
    if (!req.user.is_admin) {
      // Verify user has admin access to this guild using cached permissions
      try {
        const hasAdminPermission = await verifyGuildAdminPermission(userId, guildId, req.user.access_token);
        
        if (!hasAdminPermission) {
          return res.status(403).json({
            success: false,
            error: 'Admin privileges required for this guild',
          });
        }
      } catch (error) {
        if (error.statusCode === 429) {
          return res.status(429).json({
            success: false,
            error: error.message,
            retry_after: error.retryAfter,
          });
        }
      
        return res.status(503).json({
          success: false,
          error: error.message,
        });
      }
    }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Settings must be a valid object',
      });
    }

    // Ensure guild exists
    const guild = await getPrisma().guild.findUnique({
      where: { id: guildId },
    });

    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Guild not found',
      });
    }

    // Update guild settings
    const updatedGuild = await getPrisma().guild.update({
      where: { id: guildId },
      data: {
        settings: settings,
        updated_at: new Date(),
      },
    });

    // Create audit log
    await getPrisma().auditLog.create({
      data: {
        user_id: req.user.id,
        action: 'UPDATE_GUILD_SETTINGS',
        resource_type: 'Guild',
        resource_id: guildId,
        details: {
          guild_id: guildId,
          guild_name: guild.name,
          settings_updated: Object.keys(settings),
        },
      },
    });

    res.json({
      success: true,
      message: 'Guild settings updated successfully',
      data: {
        id: updatedGuild.id,
        name: updatedGuild.name,
        settings: updatedGuild.settings,
        updated_at: updatedGuild.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating guild settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update guild settings',
    });
  }
});

/**
 * GET /guilds/:guildId/settings
 * Get guild-specific bot settings
 */
router.get('/:guildId/settings', requireAuth, expensiveOperationLimiter, async (req, res) => {
  try {
    const { guildId } = req.params;
    const userId = req.user.id;

    // Global admins have access to all guilds
    if (!req.user.is_admin) {
      // Verify user has admin access to this guild using cached permissions
      try {
        const hasAdminPermission = await verifyGuildAdminPermission(userId, guildId, req.user.access_token);
        
        if (!hasAdminPermission) {
          return res.status(403).json({
            success: false,
            error: 'Admin privileges required for this guild',
          });
        }
      } catch (error) {
        if (error.statusCode === 429) {
          return res.status(429).json({
            success: false,
            error: error.message,
            retry_after: error.retryAfter,
          });
        }
      
        return res.status(503).json({
          success: false,
          error: error.message,
        });
      }
    }

    const guild = await getPrisma().guild.findUnique({
      where: { id: guildId },
      select: {
        id: true,
        name: true,
        settings: true,
        updated_at: true,
      },
    });

    if (!guild) {
      // Try to get guild name from Discord API
      let guildName = 'Unknown Guild';
      try {
        const discordResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${req.user.access_token}`,
          },
          timeout: 3000,
        });
        
        const discordGuild = discordResponse.data.find(g => g.id === guildId);
        if (discordGuild) {
          guildName = discordGuild.name;
        }
      } catch (discordError) {
        console.warn('Could not fetch guild name from Discord:', discordError.message);
      }

      // Create the guild with default settings
      const newGuild = await getPrisma().guild.create({
        data: {
          id: guildId,
          name: guildName,
          settings: {
            botPrefix: '!',
          },
        },
        select: {
          id: true,
          name: true,
          settings: true,
          updated_at: true,
        },
      });

      return res.json({
        success: true,
        data: {
          id: newGuild.id,
          name: newGuild.name,
          settings: newGuild.settings || {},
          updated_at: newGuild.updated_at,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: guild.id,
        name: guild.name,
        settings: guild.settings || {},
        updated_at: guild.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching guild settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guild settings',
    });
  }
});

export function createGuildRoutes() {
  return router;
}
