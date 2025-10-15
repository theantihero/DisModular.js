/**
 * Plugin Controller
 * Handles plugin CRUD operations and compilation
 * @author fkndean_
 * @date 2025-10-14
 */

import { Logger } from '@dismodular/shared';
import NodeCompiler from '../services/NodeCompiler.js';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';

const logger = new Logger('PluginController');

export class PluginController {
  /**
   * Initialize Plugin Controller
   * @param {Object} db - Database instance
   * @param {string} pluginsDir - Plugins directory path
   */
  constructor(db, pluginsDir) {
    this.db = db;
    this.pluginsDir = pluginsDir;
    this.compiler = new NodeCompiler();
  }

  /**
   * Get all plugins
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getAll(req, res) {
    try {
      const plugins = this.db
        .prepare('SELECT * FROM plugins ORDER BY created_at DESC')
        .all();

      const formatted = plugins.map(p => ({
        ...p,
        enabled: Boolean(p.enabled),
        options: JSON.parse(p.options || '[]'),
        nodes: JSON.parse(p.nodes || '[]'),
        edges: JSON.parse(p.edges || '[]')
      }));

      res.json({
        success: true,
        data: formatted
      });
    } catch (error) {
      logger.error('Failed to get plugins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve plugins'
      });
    }
  }

  /**
   * Get plugin by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const plugin = this.db
        .prepare('SELECT * FROM plugins WHERE id = ?')
        .get(id);

      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      res.json({
        success: true,
        data: {
          ...plugin,
          enabled: Boolean(plugin.enabled),
          options: JSON.parse(plugin.options || '[]'),
          nodes: JSON.parse(plugin.nodes || '[]'),
          edges: JSON.parse(plugin.edges || '[]')
        }
      });
    } catch (error) {
      logger.error('Failed to get plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve plugin'
      });
    }
  }

  /**
   * Create new plugin
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async create(req, res) {
    try {
      const { name, description, type, trigger, nodes, edges, options, compiled: providedCompiled } = req.body;

      // Validate required fields
      if (!name || !type || !trigger || !nodes || !edges) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Validate node graph
      const validation = this.compiler.validate(nodes, edges);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid node graph',
          details: validation.errors
        });
      }

      // Use provided compiled code or compile fresh (always compile for safety)
      const compiled = this.compiler.compile(nodes, edges);

      // Extract options from nodes
      const extractedOptions = this.compiler.extractOptions(nodes);

      // Generate plugin ID
      const pluginId = `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Insert into database
      const stmt = this.db.prepare(`
        INSERT INTO plugins (
          id, name, version, description, author, type, enabled,
          trigger_type, trigger_command, trigger_event, trigger_pattern,
          options, nodes, edges, compiled, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        pluginId,
        name,
        '1.0.0',
        description || '',
        req.user?.username || 'Unknown',
        type,
        1,
        trigger.type,
        trigger.command,
        trigger.event || null,
        trigger.pattern || null,
        JSON.stringify(options || extractedOptions),
        JSON.stringify(nodes),
        JSON.stringify(edges),
        compiled,
        req.user?.id || null
      );

      // Write plugin file
      await this.writePluginFile(pluginId, {
        id: pluginId,
        name,
        version: '1.0.0',
        description,
        author: req.user?.username || 'Unknown',
        type,
        enabled: true,
        trigger,
        options: options || extractedOptions,
        nodes,
        edges,
        compiled
      });

      // Add audit log
      this.db.prepare(`
        INSERT INTO audit_log (user_id, action, resource_type, resource_id)
        VALUES (?, ?, ?, ?)
      `).run(req.user?.id || null, 'CREATE', 'plugin', pluginId);

      logger.success(`Plugin created: ${name} (${pluginId})`);

      res.status(201).json({
        success: true,
        data: {
          id: pluginId,
          message: 'Plugin created successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to create plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create plugin',
        details: error.message
      });
    }
  }

  /**
   * Update existing plugin
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, type, trigger, nodes, edges, enabled, options, compiled: providedCompiled } = req.body;

      // Check if plugin exists
      const existing = this.db
        .prepare('SELECT * FROM plugins WHERE id = ?')
        .get(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      // Validate node graph if provided
      if (nodes && edges) {
        const validation = this.compiler.validate(nodes, edges);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid node graph',
            details: validation.errors
          });
        }
      }

      // Compile node graph if changed
      const compiled = (nodes && edges) 
        ? this.compiler.compile(nodes, edges)
        : existing.compiled;

      // Extract options from nodes if provided
      const extractedOptions = (nodes && edges) 
        ? this.compiler.extractOptions(nodes)
        : JSON.parse(existing.options || '[]');

      // Update database
      const stmt = this.db.prepare(`
        UPDATE plugins 
        SET name = ?, 
            description = ?, 
            type = ?, 
            enabled = ?,
            trigger_type = ?,
            trigger_command = ?,
            trigger_event = ?,
            trigger_pattern = ?,
            options = ?,
            nodes = ?, 
            edges = ?, 
            compiled = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        name || existing.name,
        description !== undefined ? description : existing.description,
        type || existing.type,
        enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled,
        trigger?.type || existing.trigger_type,
        trigger?.command || existing.trigger_command,
        trigger?.event || existing.trigger_event,
        trigger?.pattern || existing.trigger_pattern,
        options !== undefined ? JSON.stringify(options) : JSON.stringify(extractedOptions),
        nodes ? JSON.stringify(nodes) : existing.nodes,
        edges ? JSON.stringify(edges) : existing.edges,
        compiled,
        id
      );

      // Update plugin file
      const pluginData = this.db
        .prepare('SELECT * FROM plugins WHERE id = ?')
        .get(id);

      await this.writePluginFile(id, {
        id: pluginData.id,
        name: pluginData.name,
        version: pluginData.version,
        description: pluginData.description,
        author: pluginData.author,
        type: pluginData.type,
        enabled: Boolean(pluginData.enabled),
        trigger: {
          type: pluginData.trigger_type,
          command: pluginData.trigger_command,
          event: pluginData.trigger_event,
          pattern: pluginData.trigger_pattern
        },
        options: JSON.parse(pluginData.options || '[]'),
        nodes: JSON.parse(pluginData.nodes),
        edges: JSON.parse(pluginData.edges),
        compiled: pluginData.compiled
      });

      // Add audit log
      this.db.prepare(`
        INSERT INTO audit_log (user_id, action, resource_type, resource_id)
        VALUES (?, ?, ?, ?)
      `).run(req.user?.id || null, 'UPDATE', 'plugin', id);

      logger.success(`Plugin updated: ${id}`);

      res.json({
        success: true,
        data: {
          message: 'Plugin updated successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to update plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update plugin',
        details: error.message
      });
    }
  }

  /**
   * Delete plugin
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const plugin = this.db
        .prepare('SELECT * FROM plugins WHERE id = ?')
        .get(id);

      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      // Delete related records first
      this.db.prepare('DELETE FROM command_executions WHERE plugin_id = ?').run(id);
      
      // Delete from database (plugin_state will cascade delete due to FOREIGN KEY)
      this.db.prepare('DELETE FROM plugins WHERE id = ?').run(id);

      // Delete plugin folder from filesystem
      try {
        const pluginDir = join(this.pluginsDir, id);
        await rm(pluginDir, { recursive: true, force: true });
        logger.debug(`Plugin folder deleted: ${pluginDir}`);
      } catch (fsError) {
        // Log warning but don't fail the request if folder deletion fails
        logger.warn(`Failed to delete plugin folder for ${id}:`, fsError.message);
      }

      // Add audit log
      this.db.prepare(`
        INSERT INTO audit_log (user_id, action, resource_type, resource_id)
        VALUES (?, ?, ?, ?)
      `).run(req.user?.id || null, 'DELETE', 'plugin', id);

      logger.success(`Plugin deleted: ${id}`);

      res.json({
        success: true,
        data: {
          message: 'Plugin deleted successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to delete plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete plugin'
      });
    }
  }

  /**
   * Compile plugin from node graph
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async compile(req, res) {
    try {
      const { nodes, edges } = req.body;

      if (!nodes || !edges) {
        return res.status(400).json({
          success: false,
          error: 'Missing nodes or edges'
        });
      }

      // Validate
      const validation = this.compiler.validate(nodes, edges);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid node graph',
          details: validation.errors
        });
      }

      // Compile
      const compiled = this.compiler.compile(nodes, edges);

      res.json({
        success: true,
        data: {
          compiled,
          validation
        }
      });
    } catch (error) {
      logger.error('Failed to compile plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compile plugin',
        details: error.message
      });
    }
  }

  /**
   * Write plugin to file system
   * @param {string} pluginId - Plugin ID
   * @param {Object} pluginData - Plugin data
   */
  async writePluginFile(pluginId, pluginData) {
    try {
      const pluginDir = join(this.pluginsDir, pluginId);
      const pluginFile = join(pluginDir, 'plugin.json');

      // Create directory if it doesn't exist
      const { mkdir } = await import('fs/promises');
      await mkdir(pluginDir, { recursive: true });

      // Write plugin file
      await writeFile(pluginFile, JSON.stringify(pluginData, null, 2));

      logger.debug(`Plugin file written: ${pluginFile}`);
    } catch (error) {
      logger.error('Failed to write plugin file:', error);
      throw error;
    }
  }
}

export default PluginController;

