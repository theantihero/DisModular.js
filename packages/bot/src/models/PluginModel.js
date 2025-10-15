/**
 * Plugin Model - MVVM Pattern
 * Handles plugin data persistence and retrieval
 * @author fkndean_
 * @date 2025-10-14
 */

import Database from 'better-sqlite3';
import { Logger } from '@dismodular/shared';

const logger = new Logger('PluginModel');

export class PluginModel {
  /**
   * Initialize Plugin Model
   * @param {string} dbPath - Path to SQLite database
   */
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  /**
   * Initialize database tables
   */
  initializeTables() {
    const createPluginsTable = `
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        author TEXT,
        type TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        trigger_type TEXT,
        trigger_command TEXT,
        trigger_event TEXT,
        trigger_pattern TEXT,
        options TEXT DEFAULT '[]',
        nodes TEXT NOT NULL,
        edges TEXT NOT NULL,
        compiled TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPluginStateTable = `
      CREATE TABLE IF NOT EXISTS plugin_state (
        plugin_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (plugin_id, key),
        FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
      )
    `;

    try {
      this.db.exec(createPluginsTable);
      this.db.exec(createPluginStateTable);
      logger.success('Database tables initialized');

      // Migration: Add options column if it doesn't exist
      try {
        const tableInfo = this.db.prepare("PRAGMA table_info(plugins)").all();
        const hasOptions = tableInfo.some(col => col.name === 'options');
        
        if (!hasOptions) {
          logger.info('Migrating plugins table: adding options column');
          this.db.exec("ALTER TABLE plugins ADD COLUMN options TEXT DEFAULT '[]'");
          logger.success('Plugins table migrated successfully');
        }
      } catch (migrationError) {
        logger.warn('Migration check/execution skipped:', migrationError.message);
      }
    } catch (error) {
      logger.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  /**
   * Get all plugins
   * @param {boolean} enabledOnly - Return only enabled plugins
   * @returns {Array} Array of plugin objects
   */
  getAll(enabledOnly = false) {
    try {
      const query = enabledOnly
        ? 'SELECT * FROM plugins WHERE enabled = 1'
        : 'SELECT * FROM plugins';
      
      const plugins = this.db.prepare(query).all();
      
      return plugins.map(plugin => ({
        ...plugin,
        enabled: Boolean(plugin.enabled),
        nodes: JSON.parse(plugin.nodes),
        edges: JSON.parse(plugin.edges),
        options: plugin.options ? JSON.parse(plugin.options) : [],
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
  getById(id) {
    try {
      const plugin = this.db
        .prepare('SELECT * FROM plugins WHERE id = ?')
        .get(id);
      
      if (!plugin) return null;

      return {
        ...plugin,
        enabled: Boolean(plugin.enabled),
        nodes: JSON.parse(plugin.nodes),
        edges: JSON.parse(plugin.edges),
        options: plugin.options ? JSON.parse(plugin.options) : [],
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
  upsert(pluginData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO plugins (
          id, name, version, description, author, type, enabled,
          trigger_type, trigger_command, trigger_event, trigger_pattern,
          options, nodes, edges, compiled, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          version = excluded.version,
          description = excluded.description,
          author = excluded.author,
          type = excluded.type,
          enabled = excluded.enabled,
          trigger_type = excluded.trigger_type,
          trigger_command = excluded.trigger_command,
          trigger_event = excluded.trigger_event,
          trigger_pattern = excluded.trigger_pattern,
          options = excluded.options,
          nodes = excluded.nodes,
          edges = excluded.edges,
          compiled = excluded.compiled,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(
        pluginData.id,
        pluginData.name,
        pluginData.version,
        pluginData.description || '',
        pluginData.author || '',
        pluginData.type,
        pluginData.enabled ? 1 : 0,
        pluginData.trigger?.type || null,
        pluginData.trigger?.command || null,
        pluginData.trigger?.event || null,
        pluginData.trigger?.pattern || null,
        JSON.stringify(pluginData.options || []),
        JSON.stringify(pluginData.nodes || []),
        JSON.stringify(pluginData.edges || []),
        pluginData.compiled || ''
      );

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
  delete(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM plugins WHERE id = ?');
      stmt.run(id);
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
  setState(pluginId, key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO plugin_state (plugin_id, key, value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(plugin_id, key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `);
      
      stmt.run(pluginId, key, JSON.stringify(value));
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
  getState(pluginId, key) {
    try {
      const result = this.db
        .prepare('SELECT value FROM plugin_state WHERE plugin_id = ? AND key = ?')
        .get(pluginId, key);
      
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
  logCommandExecution(execution) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO command_executions (
          plugin_id, user_id, command_name, success, execution_time_ms, error_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Use null for user_id if plugin doesn't exist (avoids foreign key constraint)
      // This is for analytics and shouldn't prevent execution
      stmt.run(
        execution.plugin_id || null,
        execution.user_id || null,
        execution.command_name,
        execution.success ? 1 : 0,
        execution.execution_time_ms,
        execution.error_message || null
      );
    } catch (error) {
      // Log warning but don't throw - analytics shouldn't break execution
      logger.warn('Failed to log command execution:', error.message);
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

export default PluginModel;

