/**
 * Plugin Manager - Manages plugin lifecycle
 * Handles plugin registration, execution, and unregistration
 * @author fkndean_
 * @date 2025-10-14
 */

import { Collection } from 'discord.js';
import { Logger } from '@dismodular/shared';
import SandboxExecutor from '../sandbox/SandboxExecutor.js';

const logger = new Logger('PluginManager');

export class PluginManager {
  /**
   * Initialize Plugin Manager
   * @param {Object} client - Discord client instance
   * @param {Object} pluginModel - Plugin model instance
   */
  constructor(client, pluginModel) {
    this.client = client;
    this.pluginModel = pluginModel;
    this.plugins = new Collection();
    this.sandbox = new SandboxExecutor({
      memoryLimit: 128,
      timeout: 5000
    });
  }

  /**
   * Register a plugin
   * @param {Object} pluginData - Plugin data
   * @returns {boolean} Success status
   */
  register(pluginData) {
    try {
      // Validate plugin data
      if (!pluginData.id || !pluginData.name || !pluginData.compiled) {
        logger.error(`Invalid plugin data for ${pluginData?.name || 'unknown'}`);
        return false;
      }

      // Validate plugin code
      const validation = this.sandbox.validateCode(pluginData.compiled);
      if (!validation.valid) {
        logger.error(`Plugin ${pluginData.name} validation failed:`, validation.errors);
        return false;
      }

      // Store plugin
      this.plugins.set(pluginData.id, {
        ...pluginData,
        state: {}
      });

      logger.success(`Plugin registered: ${pluginData.name} (${pluginData.id})`);
      return true;
    } catch (error) {
      logger.error(`Failed to register plugin ${pluginData?.name}:`, error);
      return false;
    }
  }

  /**
   * Unregister a plugin
   * @param {string} pluginId - Plugin ID
   * @returns {boolean} Success status
   */
  unregister(pluginId) {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        logger.warn(`Plugin ${pluginId} not found`);
        return false;
      }

      this.plugins.delete(pluginId);
      logger.success(`Plugin unregistered: ${plugin.name} (${pluginId})`);
      return true;
    } catch (error) {
      logger.error(`Failed to unregister plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Execute a plugin
   * @param {string} pluginId - Plugin ID
   * @param {Object} context - Execution context
   * @returns {Promise<any>} Execution result
   */
  async execute(pluginId, context) {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      if (!plugin.enabled) {
        throw new Error(`Plugin ${plugin.name} is disabled`);
      }

      logger.debug(`Executing plugin: ${plugin.name}`);

      // Load plugin state from database
      const stateKeys = ['variables', 'settings', 'cache'];
      for (const key of stateKeys) {
        const value = this.pluginModel.getState(pluginId, key);
        if (value) {
          plugin.state[key] = value;
        }
      }

      // Add plugin state to context
      const executionContext = {
        ...context,
        state: plugin.state,
        pluginId: plugin.id,
        pluginName: plugin.name
      };

      // Execute plugin in sandbox with timing
      const startTime = Date.now();
      let success = false;
      let errorMessage = null;
      
      try {
        const result = await this.sandbox.execute(plugin.compiled, executionContext);
        success = true;
        
        // Save updated state
        for (const key of stateKeys) {
          if (plugin.state[key]) {
            this.pluginModel.setState(pluginId, key, plugin.state[key]);
          }
        }

        const executionTime = Date.now() - startTime;
        logger.debug(`Plugin execution completed: ${plugin.name} (${executionTime}ms)`);
        
        // Log execution to database for analytics
        this.logExecution(plugin.id, context, plugin.name, true, executionTime, null);
        
        return result;
      } catch (error) {
        success = false;
        errorMessage = error.message;
        const executionTime = Date.now() - startTime;
        
        // Log failed execution
        this.logExecution(plugin.id, context, plugin.name, false, executionTime, errorMessage);
        
        throw error;
      }
    } catch (error) {
      logger.error(`Plugin execution failed for ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Log command execution for analytics
   * @param {string} pluginId - Plugin ID
   * @param {Object} context - Execution context
   * @param {string} commandName - Command name
   * @param {boolean} success - Whether execution succeeded
   * @param {number} executionTime - Execution time in milliseconds
   * @param {string|null} errorMessage - Error message if failed
   */
  logExecution(pluginId, context, commandName, success, executionTime, errorMessage) {
    try {
      const userId = context.interaction?.user?.id || context.message?.author?.id || null;
      
      this.pluginModel.logCommandExecution({
        plugin_id: pluginId,
        user_id: userId,
        command_name: commandName,
        success: success ? 1 : 0,
        execution_time_ms: executionTime,
        error_message: errorMessage
      });
    } catch (error) {
      logger.error('Failed to log command execution:', error);
    }
  }

  /**
   * Get plugin by command
   * @param {string} command - Command name
   * @param {string} type - Command type ('slash' or 'text')
   * @returns {Object|null} Plugin object or null
   */
  getPluginByCommand(command, type = 'slash') {
    for (const [, plugin] of this.plugins) {
      if (!plugin.enabled) continue;
      
      const matchesType = 
        plugin.type === 'both' || 
        plugin.type === type;
      
      const matchesCommand = 
        plugin.trigger_command?.toLowerCase() === command.toLowerCase();
      
      if (matchesType && matchesCommand) {
        return plugin;
      }
    }
    
    return null;
  }

  /**
   * Get all registered plugins
   * @returns {Array} Array of plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   * @returns {Array} Array of enabled plugins
   */
  getEnabledPlugins() {
    return this.getAllPlugins().filter(p => p.enabled);
  }

  /**
   * Enable plugin
   * @param {string} pluginId - Plugin ID
   * @returns {boolean} Success status
   */
  enablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    
    plugin.enabled = true;
    this.pluginModel.upsert({ ...plugin, enabled: true });
    logger.success(`Plugin enabled: ${plugin.name}`);
    return true;
  }

  /**
   * Disable plugin
   * @param {string} pluginId - Plugin ID
   * @returns {boolean} Success status
   */
  disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    
    plugin.enabled = false;
    this.pluginModel.upsert({ ...plugin, enabled: false });
    logger.success(`Plugin disabled: ${plugin.name}`);
    return true;
  }

  /**
   * Reload plugin
   * @param {string} pluginId - Plugin ID
   * @returns {boolean} Success status
   */
  reloadPlugin(pluginId) {
    try {
      const pluginData = this.pluginModel.getById(pluginId);
      if (!pluginData) {
        logger.error(`Plugin ${pluginId} not found in database`);
        return false;
      }

      this.unregister(pluginId);
      this.register(pluginData);
      
      logger.success(`Plugin reloaded: ${pluginData.name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to reload plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Get plugin statistics
   * @returns {Object} Plugin statistics
   */
  getStatistics() {
    const all = this.getAllPlugins();
    const enabled = this.getEnabledPlugins();
    
    return {
      total: all.length,
      enabled: enabled.length,
      disabled: all.length - enabled.length,
      byType: {
        slash: all.filter(p => p.type === 'slash' || p.type === 'both').length,
        text: all.filter(p => p.type === 'text' || p.type === 'both').length
      }
    };
  }
}

export default PluginManager;

