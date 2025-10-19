/**
 * Mock Plugin Model for Testing
 * Provides in-memory storage for plugin data during tests
 * @author fkndean_
 * @date 2025-01-27
 */

import { Logger } from '@dismodular/shared';

const logger = new Logger('MockPluginModel');

export class MockPluginModel {
  constructor() {
    this.plugins = new Map();
    this.pluginStates = new Map();
    logger.info('MockPluginModel initialized');
  }

  /**
   * Get all plugins
   * @param {boolean} enabledOnly - Return only enabled plugins
   * @returns {Array} Array of plugin objects
   */
  async getAll(enabledOnly = false) {
    try {
      const plugins = Array.from(this.plugins.values());
      
      if (enabledOnly) {
        return plugins.filter(plugin => plugin.enabled);
      }
      
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
      const plugin = this.plugins.get(id);
      
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
      this.plugins.set(pluginData.id, {
        ...pluginData,
        created_at: new Date(),
        updated_at: new Date()
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
      this.plugins.delete(id);
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
      const stateKey = `${pluginId}:${key}`;
      this.pluginStates.set(stateKey, JSON.stringify(value));
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
      const stateKey = `${pluginId}:${key}`;
      const value = this.pluginStates.get(stateKey);
      
      return value ? JSON.parse(value) : null;
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
      logger.debug('Command execution logged:', execution);
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
      // Mock implementation - always return enabled
      const plugin = this.plugins.get(pluginId);
      return plugin ? { enabled: plugin.enabled } : { enabled: false };
    } catch (error) {
      logger.error('Failed to get guild plugin:', error);
      return null;
    }
  }

  /**
   * Close database connection (no-op for mock)
   */
  async close() {
    logger.info('MockPluginModel closed');
  }
}

export default MockPluginModel;
