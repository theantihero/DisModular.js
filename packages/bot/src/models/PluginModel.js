/**
 * Plugin Model - MVVM Pattern with Prisma
 * Handles plugin data persistence and retrieval using Prisma ORM
 * @author fkndean_
 * @date 2025-01-27
 */

import { PrismaClient } from '@prisma/client';
import { Logger, safeStringify } from '@dismodular/shared';

const logger = new Logger('PluginModel');

export class PluginModel {
  /**
   * Initialize Plugin Model with Prisma Client
   */
  constructor() {
    this.prisma = new PrismaClient();
    logger.info('PluginModel initialized with Prisma');
  }

  /**
   * Get all plugins
   * @param {boolean} enabledOnly - Return only enabled plugins
   * @returns {Array} Array of plugin objects
   */
  async getAll(enabledOnly = false) {
    try {
      const where = enabledOnly ? { enabled: true } : {};
      
      const plugins = await this.prisma.plugin.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });
      
      return plugins.map(plugin => ({
        ...plugin,
        enabled: Boolean(plugin.enabled),
        nodes: plugin.nodes,
        edges: plugin.edges,
        options: plugin.options,
        trigger: {
          type: plugin.trigger_type,
          command: plugin.trigger_command,
          event: plugin.trigger_event,
          pattern: plugin.trigger_pattern
        },
        trigger_command: plugin.trigger_command // Keep for backward compatibility
      }));
    } catch (error) {
      logger.error('Failed to get plugins:', error);
      return [];
    }
  }

  /**
   * Get plugin by ID
   * @param {string} id - Plugin ID
   * @returns {Object|null} Plugin object or null
   */
  async getById(id) {
    try {
      const plugin = await this.prisma.plugin.findUnique({
        where: { id }
      });
      
      if (!plugin) return null;

      return {
        ...plugin,
        enabled: Boolean(plugin.enabled),
        nodes: plugin.nodes,
        edges: plugin.edges,
        options: plugin.options,
        trigger: {
          type: plugin.trigger_type,
          command: plugin.trigger_command,
          event: plugin.trigger_event,
          pattern: plugin.trigger_pattern
        },
        trigger_command: plugin.trigger_command // Keep for backward compatibility
      };
    } catch (error) {
      logger.error(`Failed to get plugin ${id}:`, error);
      return null;
    }
  }

  /**
   * Create or update plugin
   * @param {Object} pluginData - Plugin data
   * @returns {boolean} Success status
   */
  async upsert(pluginData) {
    try {
      await this.prisma.plugin.upsert({
        where: { id: pluginData.id },
        update: {
          name: pluginData.name,
          version: pluginData.version,
          description: pluginData.description || '',
          author: pluginData.author || '',
          type: pluginData.type,
          enabled: pluginData.enabled ? true : false,
          trigger_type: pluginData.trigger?.type || null,
          trigger_command: pluginData.trigger?.command || null,
          trigger_event: pluginData.trigger?.event || null,
          trigger_pattern: pluginData.trigger?.pattern || null,
          options: pluginData.options || [],
          nodes: pluginData.nodes || [],
          edges: pluginData.edges || [],
          compiled: pluginData.compiled || '',
          is_template: pluginData.is_template || false,
          template_category: pluginData.template_category || null
        },
        create: {
          id: pluginData.id,
          name: pluginData.name,
          version: pluginData.version,
          description: pluginData.description || '',
          author: pluginData.author || '',
          type: pluginData.type,
          enabled: pluginData.enabled ? true : false,
          trigger_type: pluginData.trigger?.type || null,
          trigger_command: pluginData.trigger?.command || null,
          trigger_event: pluginData.trigger?.event || null,
          trigger_pattern: pluginData.trigger?.pattern || null,
          options: pluginData.options || [],
          nodes: pluginData.nodes || [],
          edges: pluginData.edges || [],
          compiled: pluginData.compiled || '',
          created_by: null, // System-created plugins don't have a specific creator
          is_template: pluginData.is_template || false,
          template_category: pluginData.template_category || null
        }
      });

      logger.success(`Plugin ${pluginData.name} saved successfully`);
      return true;
    } catch (error) {
      logger.error('Failed to upsert plugin:', error);
      return false;
    }
  }

  /**
   * Delete plugin
   * @param {string} id - Plugin ID
   * @returns {boolean} Success status
   */
  async delete(id) {
    try {
      await this.prisma.plugin.delete({
        where: { id }
      });
      logger.success(`Plugin ${id} deleted successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete plugin ${id}:`, error);
      return false;
    }
  }

  /**
   * Set plugin state value
   * @param {string} pluginId - Plugin ID
   * @param {string} key - State key
   * @param {any} value - State value
   */
  async setState(pluginId, key, value) {
    try {
      await this.prisma.pluginState.upsert({
        where: {
          plugin_id_key: {
            plugin_id: pluginId,
            key: key
          }
        },
        update: {
          value: safeStringify(value, {
            maxDepth: 10,
            includeCircularRefs: true,
            circularRefMarker: '[Circular Reference]'
          })
        },
        create: {
          plugin_id: pluginId,
          key: key,
          value: safeStringify(value, {
            maxDepth: 10,
            includeCircularRefs: true,
            circularRefMarker: '[Circular Reference]'
          })
        }
      });
      return true;
    } catch (error) {
      logger.error(`Failed to set state for plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Get plugin state value
   * @param {string} pluginId - Plugin ID
   * @param {string} key - State key
   * @returns {any} State value
   */
  async getState(pluginId, key) {
    try {
      const result = await this.prisma.pluginState.findUnique({
        where: {
          plugin_id_key: {
            plugin_id: pluginId,
            key: key
          }
        }
      });
      
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      logger.error(`Failed to get state for plugin ${pluginId}:`, error);
      return null;
    }
  }

  /**
   * Log command execution for analytics
   * @param {Object} execution - Execution data
   */
  async logCommandExecution(execution) {
    try {
      // Note: This would require adding a command_executions table to the schema
      // For now, we'll skip this functionality or implement it later
      logger.debug('Command execution logging not implemented with Prisma yet');
    } catch (error) {
      logger.warn('Failed to log command execution:', error.message);
    }
  }

  /**
   * Get guild plugin relationship
   * @param {string} guildId - Discord guild ID
   * @param {string} pluginId - Plugin ID
   * @returns {Object|null} Guild plugin relationship or null
   */
  async getGuildPlugin(guildId, pluginId) {
    try {
      const guildPlugin = await this.prisma.guildPlugin.findUnique({
        where: {
          guild_id_plugin_id: {
            guild_id: guildId,
            plugin_id: pluginId
          }
        }
      });

      // If no guild-specific record exists, return a default enabled state
      // This allows plugins to inherit the global enabled status
      if (!guildPlugin) {
        const plugin = await this.prisma.plugin.findUnique({
          where: { id: pluginId },
          select: { enabled: true }
        });
        
        return plugin ? { enabled: plugin.enabled } : { enabled: false };
      }

      return guildPlugin;
    } catch (error) {
      logger.error('Failed to get guild plugin:', error);
      return null;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.prisma.$disconnect();
    logger.info('PluginModel database connection closed');
  }
}

export default PluginModel;

