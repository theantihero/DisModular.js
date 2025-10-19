/**
 * Plugin Controller
 * Handles plugin CRUD operations and compilation
 * @author fkndean_
 * @date 2025-10-14
 */

import { Logger } from '@dismodular/shared';
import NodeCompiler from '../services/NodeCompiler.js';
import { getPrismaClient } from '../services/PrismaService.js';
import { writeFile, rm } from 'fs/promises';
import { join, resolve } from 'path';

const logger = new Logger('PluginController');

/**
 * Validate plugin ID to prevent path traversal attacks
 * @param {string} id - Plugin ID to validate
 * @returns {boolean} Whether the ID is valid
 */
function validatePluginId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  // Only allow alphanumeric characters, underscores, and hyphens
  // Must start with a letter or underscore
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(id) && id.length <= 100;
}

/**
 * Validate plugin ID with path canonicalization to prevent path traversal
 * @param {string} pluginId - Plugin ID to validate
 * @param {string} pluginsDir - Base plugins directory
 * @returns {boolean} Whether the path is safe
 */
function validatePluginPath(pluginId, pluginsDir) {
  if (!validatePluginId(pluginId)) {
    return false;
  }
  
  try {
    // Resolve the full path
    const resolvedPath = resolve(pluginsDir, pluginId);
    const baseDir = resolve(pluginsDir);
    
    // Ensure the resolved path is within the plugins directory
    return resolvedPath.startsWith(baseDir + '/') || resolvedPath === baseDir;
  } catch (error) {
    return false;
  }
}

/**
 * Get safe plugin directory path with explicit validation
 * @param {string} pluginId - Plugin ID
 * @param {string} pluginsDir - Base plugins directory
 * @returns {string} Safe plugin directory path
 * @throws {Error} If path is unsafe
 */
function getSafePluginPath(pluginId, pluginsDir) {
  // Explicit validation before any path operations
  if (!validatePluginPath(pluginId, pluginsDir)) {
    throw new Error('Invalid plugin ID format or path traversal detected');
  }
  
  // Additional explicit checks
  if (pluginId.includes('..') || pluginId.includes('\\') || pluginId.includes('/')) {
    throw new Error('Path traversal characters detected');
  }
  
  // Use resolve for canonical path
  const safePath = resolve(pluginsDir, pluginId);
  
  // Double-check the resolved path is still within the base directory
  const baseDir = resolve(pluginsDir);
  if (!safePath.startsWith(baseDir + '/') && safePath !== baseDir) {
    throw new Error('Resolved path outside base directory');
  }
  
  return safePath;
}

/**
 * Get safe plugin file path with explicit validation
 * @param {string} pluginId - Plugin ID
 * @param {string} pluginsDir - Base plugins directory
 * @param {string} filename - Filename (must be safe)
 * @returns {string} Safe plugin file path
 * @throws {Error} If path is unsafe
 */
function getSafePluginFilePath(pluginId, pluginsDir, filename = 'plugin.json') {
  // Validate filename to prevent path traversal
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }
  
  // Only allow safe filename characters
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    throw new Error('Filename contains invalid characters');
  }
  
  // Prevent directory traversal in filename
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Filename contains path traversal characters');
  }
  
  // Get safe plugin directory path
  const pluginDir = getSafePluginPath(pluginId, pluginsDir);
  
  // Construct file path using join for safety
  const filePath = join(pluginDir, filename);
  
  // Double-check the final path is still within the plugin directory
  if (!filePath.startsWith(pluginDir + '/') && filePath !== pluginDir) {
    throw new Error('Final file path outside plugin directory');
  }
  
  return filePath;
}

/**
 * Sanitize string input to prevent injection attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return String(str);
  }
  
  return str
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove potential HTML/XML tags
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate plugin data structure to prevent malicious content
 * @param {Object} pluginData - Plugin data to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validatePluginData(pluginData) {
  if (!pluginData || typeof pluginData !== 'object') {
    return { valid: false, error: 'Invalid plugin data structure' };
  }
  
  // Check for required fields
  const requiredFields = ['name', 'type', 'trigger', 'nodes', 'edges'];
  for (const field of requiredFields) {
    if (!pluginData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate string fields
  const stringFields = ['name', 'description', 'author'];
  for (const field of stringFields) {
    if (pluginData[field] && typeof pluginData[field] !== 'string') {
      return { valid: false, error: `Field ${field} must be a string` };
    }
    if (pluginData[field] && pluginData[field].length > 1000) {
      return { valid: false, error: `Field ${field} too long (max 1000 characters)` };
    }
  }
  
  // Validate arrays
  if (!Array.isArray(pluginData.nodes)) {
    return { valid: false, error: 'Nodes must be an array' };
  }
  if (!Array.isArray(pluginData.edges)) {
    return { valid: false, error: 'Edges must be an array' };
  }
  
  // Check array sizes
  if (pluginData.nodes.length > 100) {
    return { valid: false, error: 'Too many nodes (max 100)' };
  }
  if (pluginData.edges.length > 200) {
    return { valid: false, error: 'Too many edges (max 200)' };
  }
  
  // Validate nodes structure
  for (const node of pluginData.nodes) {
    if (!node || typeof node !== 'object') {
      return { valid: false, error: 'Invalid node structure' };
    }
    if (!node.id || typeof node.id !== 'string') {
      return { valid: false, error: 'Node must have valid ID' };
    }
    if (!validatePluginId(node.id)) {
      return { valid: false, error: `Invalid node ID: ${node.id}` };
    }
  }
  
  // Validate edges structure
  for (const edge of pluginData.edges) {
    if (!edge || typeof edge !== 'object') {
      return { valid: false, error: 'Invalid edge structure' };
    }
    if (!edge.source || !edge.target) {
      return { valid: false, error: 'Edge must have source and target' };
    }
    if (!validatePluginId(edge.source) || !validatePluginId(edge.target)) {
      return { valid: false, error: 'Edge has invalid node references' };
    }
  }
  
  // Validate node configurations for URLs and emojis
  for (const node of pluginData.nodes) {
    if (node.data && node.data.config) {
      const config = node.data.config;
      
      // Validate image URLs in embed builder nodes
      if (node.type === 'embed_builder') {
        if (config.image) {
          const imageValidation = validateUrl(config.image);
          if (!imageValidation.valid) {
            return { valid: false, error: `Invalid image URL in node ${node.id}: ${imageValidation.error}` };
          }
        }
        if (config.thumbnail) {
          const thumbnailValidation = validateUrl(config.thumbnail);
          if (!thumbnailValidation.valid) {
            return { valid: false, error: `Invalid thumbnail URL in node ${node.id}: ${thumbnailValidation.error}` };
          }
        }
      }
      
      // Validate emoji in reaction nodes
      if (node.type === 'reaction' || config.action === 'add_reaction') {
        if (config.emoji) {
          const emojiValidation = validateEmoji(config.emoji);
          if (!emojiValidation.valid) {
            return { valid: false, error: `Invalid emoji in node ${node.id}: ${emojiValidation.error}` };
          }
        }
      }
      
      // Validate emojis array in multiple reactions
      if (config.action === 'add_multiple_reactions' && config.emojis) {
        if (typeof config.emojis === 'string') {
          // If it's a variable reference, validate the variable name
          if (!config.emojis.startsWith('{') || !config.emojis.endsWith('}')) {
            return { valid: false, error: `Invalid emojis variable format in node ${node.id}` };
          }
        }
      }
      
      // Validate HTTP request URLs
      if (node.type === 'http_request' && config.url) {
        const urlValidation = validateUrl(config.url);
        if (!urlValidation.valid) {
          return { valid: false, error: `Invalid HTTP URL in node ${node.id}: ${urlValidation.error}` };
        }
      }
    }
  }
  
  return { valid: true };
}

/**
 * Sanitize plugin data before writing to file
 * @param {Object} pluginData - Plugin data to sanitize
 * @returns {Object} Sanitized plugin data
 */
function sanitizePluginData(pluginData) {
  const sanitized = { ...pluginData };
  
  // Sanitize string fields
  const stringFields = ['name', 'description', 'author'];
  for (const field of stringFields) {
    if (sanitized[field]) {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  }
  
  // Sanitize trigger object
  if (sanitized.trigger && typeof sanitized.trigger === 'object') {
    const triggerFields = ['command', 'event', 'pattern'];
    for (const field of triggerFields) {
      if (sanitized.trigger[field]) {
        sanitized.trigger[field] = sanitizeString(sanitized.trigger[field]);
      }
    }
  }
  
  // Sanitize node configurations
  if (sanitized.nodes && Array.isArray(sanitized.nodes)) {
    sanitized.nodes = sanitized.nodes.map(node => {
      if (node.data && node.data.config) {
        const config = { ...node.data.config };
        
        // Sanitize URLs
        if (config.image) {
          config.image = sanitizeString(config.image);
        }
        if (config.thumbnail) {
          config.thumbnail = sanitizeString(config.thumbnail);
        }
        if (config.url) {
          config.url = sanitizeString(config.url);
        }
        
        // Sanitize emoji
        if (config.emoji) {
          config.emoji = sanitizeString(config.emoji);
        }
        if (config.emojis) {
          config.emojis = sanitizeString(config.emojis);
        }
        
        // Sanitize other string fields in config
        const configStringFields = ['title', 'description', 'content', 'method', 'body'];
        for (const field of configStringFields) {
          if (config[field]) {
            config[field] = sanitizeString(config[field]);
          }
        }
        
        return {
          ...node,
          data: {
            ...node.data,
            config
          }
        };
      }
      return node;
    });
  }
  
  return sanitized;
}

/**
 * Validate property name to prevent prototype pollution
 * @param {string} propName - Property name to validate
 * @returns {boolean} Whether the property name is safe
 */
function isValidPropertyName(propName) {
  if (typeof propName !== 'string') {
    return false;
  }
  
  // Block dangerous property names that could lead to prototype pollution
  const dangerousProps = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty'];
  if (dangerousProps.includes(propName)) {
    return false;
  }
  
  // Block property names that start with dangerous prefixes
  if (propName.startsWith('__') || propName.startsWith('constructor.') || propName.startsWith('prototype.')) {
    return false;
  }
  
  // Only allow alphanumeric characters, underscores, and hyphens
  return /^[a-zA-Z0-9_-]+$/.test(propName) && propName.length <= 100;
}

/**
 * Safe property setter that prevents prototype pollution
 * @param {Object} obj - Object to set property on
 * @param {string} propName - Property name
 * @param {*} value - Value to set
 * @returns {boolean} Whether the property was set successfully
 */
function safeSetProperty(obj, propName, value) {
  if (!isValidPropertyName(propName)) {
    return false;
  }
  
  try {
    obj[propName] = value;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate URL to prevent XSS attacks
 * @param {string} url - URL to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }
  
  try {
    const urlObj = new URL(url);
    
    // Only allow safe schemes
    const allowedSchemes = ['http:', 'https:', 'data:'];
    if (!allowedSchemes.includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP, HTTPS, and data URLs are allowed' };
    }
    
    // For data URLs, only allow image MIME types
    if (urlObj.protocol === 'data:') {
      const isValidImageMime = /^data:image\/(png|jpeg|jpg|gif|webp|bmp|svg\+xml);base64,/i.test(url);
      if (!isValidImageMime) {
        return { valid: false, error: 'Data URLs must be valid base64-encoded images' };
      }
    }
    
    // Limit URL length
    if (url.length > 2000) {
      return { valid: false, error: 'URL too long (max 2000 characters)' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate emoji input to prevent XSS attacks
 * @param {string} emoji - Emoji to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') {
    return { valid: false, error: 'Emoji must be a non-empty string' };
  }
  
  // Limit emoji length
  if (emoji.length > 10) {
    return { valid: false, error: 'Emoji too long (max 10 characters)' };
  }
  
  // Check for dangerous characters that could be used for XSS
  const dangerousChars = ['<', '>', 'javascript:', 'vbscript:', 'data:', 'onload', 'onerror'];
  for (const char of dangerousChars) {
    if (emoji.toLowerCase().includes(char)) {
      return { valid: false, error: 'Emoji contains potentially dangerous content' };
    }
  }
  
  // Allow basic characters, Discord emoji format (:emoji:), and common emoji ranges
  // Using a simple regex that's compatible across all environments
  const isValidEmoji = /^[a-zA-Z0-9_:-\s\u2600-\u26FF\u2700-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]+$/.test(emoji);
  if (!isValidEmoji) {
    return { valid: false, error: 'Invalid emoji format' };
  }
  
  return { valid: true };
}

/**
 * Validate plugin node graph complexity to prevent resource exhaustion
 * @param {Array} nodes
 * @param {Array} edges
 * @returns {{valid: boolean, error?: string}}
 */
function validateNodeGraphComplexity(nodes, edges) {
  const MAX_NODES = 100;
  const MAX_EDGES = 200;
  const MAX_DEPTH = 20;

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return { valid: false, error: 'Malformed nodes or edges' };
  }
  if (nodes.length > MAX_NODES) {
    return { valid: false, error: `Too many nodes (limit is ${MAX_NODES})` };
  }
  if (edges.length > MAX_EDGES) {
    return { valid: false, error: `Too many edges (limit is ${MAX_EDGES})` };
  }

  // Compute node graph depth by BFS from triggers
  // Find trigger nodes as entry points
  const nodeById = Object.create(null);
  nodes.forEach(n => { 
    if (n && n.id && isValidPropertyName(n.id)) {
      safeSetProperty(nodeById, n.id, n);
    }
  });
  
  const outgoing = Object.create(null);
  edges.forEach(e => {
    if (e && e.source && e.target && isValidPropertyName(e.source) && isValidPropertyName(e.target)) {
      if (!outgoing[e.source]) {
        safeSetProperty(outgoing, e.source, []);
      }
      outgoing[e.source].push(e.target);
    }
  });
  const triggerNodes = nodes.filter(n => n.type === 'trigger' && n.id);

  let maxFoundDepth = 0;
  for (const triggerNode of triggerNodes) {
    const visited = new Set();
    const queue = [{id: triggerNode.id, depth: 1}];
    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur.id)) {continue;}
      visited.add(cur.id);
      if (cur.depth > maxFoundDepth) {maxFoundDepth = cur.depth;}
      if (cur.depth > MAX_DEPTH) {
        return { valid: false, error: `Graph too deep (limit is ${MAX_DEPTH})` };
      }
      const nextNodes = outgoing[cur.id] || [];
      for (const nextId of nextNodes) {
        queue.push({id: nextId, depth: cur.depth + 1});
      }
    }
  }
  return { valid: true };
}

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
      if (!this.db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const plugins = await this.db.plugin.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              discord_id: true,
            },
          },
        },
      });

      const formatted = plugins.map(p => ({
        ...p,
        enabled: Boolean(p.enabled),
        options: p.options,
        nodes: p.nodes,
        edges: p.edges,
        trigger: {
          type: p.trigger_type,
          command: p.trigger_command,
          event: p.trigger_event,
          pattern: p.trigger_pattern,
        },
      }));

      res.json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      logger.error('Failed to get plugins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve plugins',
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
      if (!this.db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;

      // Validate plugin ID to prevent path traversal
      if (!validatePluginId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plugin ID format',
        });
      }

      const plugin = await this.db.plugin.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              discord_id: true,
            },
          },
        },
      });

      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found',
        });
      }

      res.json({
        success: true,
        data: {
          ...plugin,
          enabled: Boolean(plugin.enabled),
          options: plugin.options,
          nodes: plugin.nodes,
          edges: plugin.edges,
          trigger: {
            type: plugin.trigger_type,
            command: plugin.trigger_command,
            event: plugin.trigger_event,
            pattern: plugin.trigger_pattern,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve plugin',
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
      if (!this.db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { name, description, type, trigger, nodes, edges, options } = req.body;

      // Validate and sanitize plugin data
      const pluginData = { name, description, type, trigger, nodes, edges, options };
      const validation = validatePluginData(pluginData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plugin data',
          details: validation.error,
        });
      }

      // Sanitize the plugin data
      const sanitizedData = sanitizePluginData(pluginData);

      // Validate node graph structure
      const graphValidation = this.compiler.validate(sanitizedData.nodes, sanitizedData.edges);
      if (!graphValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid node graph',
          details: graphValidation.errors,
        });
      }

      // Prevent resource exhaustion by limiting graph complexity
      const graphComplexity = validateNodeGraphComplexity(sanitizedData.nodes, sanitizedData.edges);
      if (!graphComplexity.valid) {
        return res.status(400).json({
          success: false,
          error: graphComplexity.error,
        });
      }

      // Use provided compiled code or compile fresh (always compile for safety)
      const compiled = this.compiler.compile(sanitizedData.nodes, sanitizedData.edges);

      // Extract options from nodes
      const extractedOptions = this.compiler.extractOptions(sanitizedData.nodes);

      // Generate plugin ID
      const pluginId = `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Verify user exists in database if provided
      let createdBy = null;
      if (req.user?.id) {
        try {
          const user = await this.db.user.findUnique({
            where: { id: req.user.id }
          });
          if (user) {
            createdBy = req.user.id;
          }
        } catch (error) {
          logger.warn(`User ${req.user.id} not found in database, setting created_by to null`);
        }
      }

      // Insert into database
      await this.db.plugin.create({
        data: {
          id: pluginId,
          name: sanitizedData.name,
          version: '1.0.0',
          description: sanitizedData.description || '',
          author: req.user?.username || 'Unknown',
          type: sanitizedData.type,
          enabled: true,
          trigger_type: sanitizedData.trigger.type,
          trigger_command: sanitizedData.trigger.command,
          trigger_event: sanitizedData.trigger.event || null,
          trigger_pattern: sanitizedData.trigger.pattern || null,
          options: sanitizedData.options || extractedOptions,
          nodes: sanitizedData.nodes,
          edges: sanitizedData.edges,
          compiled,
          created_by: createdBy,
        },
      });

      // Write plugin file (non-blocking for tests)
      try {
        await this.writePluginFile(pluginId, {
          id: pluginId,
          name: sanitizedData.name,
          version: '1.0.0',
          description: sanitizedData.description,
          author: req.user?.username || 'Unknown',
          type: sanitizedData.type,
          enabled: true,
          trigger: sanitizedData.trigger,
          options: sanitizedData.options || extractedOptions,
          nodes: sanitizedData.nodes,
          edges: sanitizedData.edges,
          compiled,
        });
      } catch (fileError) {
        // Log warning but don't fail the operation if file write fails
        logger.warn(`Failed to write plugin file for ${pluginId}:`, fileError.message);
        logger.warn('Plugin database was created successfully, but file system write failed');
      }

      // Add audit log (only if user exists in database)
      if (req.user?.id) {
        try {
          await this.db.auditLog.create({
            data: {
              user_id: req.user.id,
              action: 'CREATE',
              resource_type: 'plugin',
              resource_id: pluginId,
            },
          });
        } catch (auditError) {
          logger.warn(`Failed to create audit log for plugin creation:`, auditError.message);
        }
      }

      logger.success(`Plugin created: ${name} (${pluginId})`);

      res.status(201).json({
        success: true,
        data: {
          id: pluginId,
          message: 'Plugin created successfully',
        },
      });
    } catch (error) {
      logger.error('Failed to create plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create plugin',
        details: error.message,
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
      if (!this.db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const { name, description, type, trigger, nodes, edges, enabled, options, compiled: providedCompiled } = req.body;

      // Validate plugin ID to prevent path traversal
      if (!validatePluginId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plugin ID format',
        });
      }

      // Check if plugin exists
      const existing = await this.db.plugin.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found',
        });
      }

      // Validate node graph if provided
      if (nodes && edges) {
        const validation = this.compiler.validate(nodes, edges);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid node graph',
            details: validation.errors,
          });
        }
      }

      // Use provided compiled code or compile node graph if changed
      const compiled = providedCompiled || ((nodes && edges) 
        ? this.compiler.compile(nodes, edges)
        : existing.compiled);

      // Extract options from nodes if provided
      const extractedOptions = (nodes && edges) 
        ? this.compiler.extractOptions(nodes)
        : existing.options;

      // Update database
      const updatedPlugin = await this.db.plugin.update({
        where: { id },
        data: {
          name: name || existing.name,
          description: description !== undefined ? description : existing.description,
          type: type || existing.type,
          enabled: enabled !== undefined ? enabled : existing.enabled,
          trigger_type: trigger?.type || existing.trigger_type,
          trigger_command: trigger?.command || existing.trigger_command,
          trigger_event: trigger?.event || existing.trigger_event,
          trigger_pattern: trigger?.pattern || existing.trigger_pattern,
          options: options !== undefined ? options : extractedOptions,
          nodes: nodes || existing.nodes,
          edges: edges || existing.edges,
          compiled,
        },
      });

      // Only update plugin file if the plugin structure changed (not just enabled status)
      const structureChanged = nodes || edges || name || description || type || trigger || options !== undefined;
      
      if (structureChanged) {
        try {
          await this.writePluginFile(id, {
            id: updatedPlugin.id,
            name: updatedPlugin.name,
            version: updatedPlugin.version,
            description: updatedPlugin.description,
            author: updatedPlugin.author,
            type: updatedPlugin.type,
            enabled: Boolean(updatedPlugin.enabled),
            trigger: {
              type: updatedPlugin.trigger_type,
              command: updatedPlugin.trigger_command,
              event: updatedPlugin.trigger_event,
              pattern: updatedPlugin.trigger_pattern,
            },
            options: updatedPlugin.options,
            nodes: updatedPlugin.nodes,
            edges: updatedPlugin.edges,
            compiled: updatedPlugin.compiled,
          });
        } catch (fileError) {
          // Log the file write error but don't fail the entire operation
          logger.warn(`Failed to write plugin file for ${id}:`, fileError.message);
          logger.warn('Plugin database was updated successfully, but file system write failed');
        }
      }

      // Add audit log (only if user exists in database)
      if (req.user?.id) {
        try {
          await this.db.auditLog.create({
            data: {
              user_id: req.user.id,
              action: 'UPDATE',
              resource_type: 'plugin',
              resource_id: id,
            },
          });
        } catch (auditError) {
          logger.warn(`Failed to create audit log for plugin update:`, auditError.message);
        }
      }

      logger.success(`Plugin updated: ${id}`);

      res.json({
        success: true,
        data: updatedPlugin,
      });
    } catch (error) {
      logger.error('Failed to update plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update plugin',
        details: error.message,
      });
    }
  }

  /**
   * Toggle plugin enabled status (no file system writes)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async toggleEnabled(req, res) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      // Validate plugin ID to prevent path traversal
      if (!validatePluginId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plugin ID format',
        });
      }

      // Validate input
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Enabled status must be a boolean value',
        });
      }

      // Check if plugin exists
      const existing = await this.db.plugin.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found',
        });
      }

      // Update only the enabled status in database
      const updatedPlugin = await this.db.plugin.update({
        where: { id },
        data: { enabled },
      });

      // Add audit log (only if user exists in database)
      if (req.user?.id) {
        try {
          await this.db.auditLog.create({
            data: {
              user_id: req.user.id,
              action: enabled ? 'ENABLE' : 'DISABLE',
              resource_type: 'plugin',
              resource_id: id,
            },
          });
        } catch (auditError) {
          logger.warn(`Failed to create audit log for plugin toggle:`, auditError.message);
        }
      }

      logger.success(`Plugin ${enabled ? 'enabled' : 'disabled'}: ${id}`);

      res.json({
        success: true,
        data: {
          id: updatedPlugin.id,
          name: updatedPlugin.name,
          enabled: updatedPlugin.enabled,
          message: `Plugin ${enabled ? 'enabled' : 'disabled'} successfully`,
        },
      });
    } catch (error) {
      logger.error('Failed to toggle plugin status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle plugin status',
        details: error.message,
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
      if (!this.db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;

      // Validate plugin ID to prevent path traversal
      if (!validatePluginId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plugin ID format',
        });
      }

      const plugin = await this.db.plugin.findUnique({
        where: { id },
      });

      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found',
        });
      }

      // Delete from database (plugin_state will cascade delete due to foreign key)
      await this.db.plugin.delete({
        where: { id },
      });

      // Delete plugin folder from filesystem
      try {
        const pluginDir = getSafePluginPath(id, this.pluginsDir);
        await rm(pluginDir, { recursive: true, force: true });
        logger.debug(`Plugin folder deleted: ${pluginDir}`);
      } catch (fsError) {
        // Log warning but don't fail the request if folder deletion fails
        logger.warn(`Failed to delete plugin folder for ${id}:`, fsError.message);
      }

      // Add audit log (only if user exists in database)
      if (req.user?.id) {
        try {
          await this.db.auditLog.create({
            data: {
              user_id: req.user.id,
              action: 'DELETE',
              resource_type: 'plugin',
              resource_id: id,
            },
          });
        } catch (auditError) {
          // Log warning but don't fail the operation if audit log creation fails
          logger.warn(`Failed to create audit log for plugin deletion:`, auditError.message);
        }
      }

      logger.success(`Plugin deleted: ${id}`);

      res.json({
        success: true,
        message: 'Plugin deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete plugin',
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
          error: 'Missing nodes or edges',
        });
      }

      // Validate
      const validation = this.compiler.validate(nodes, edges);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid node graph',
          details: validation.errors,
        });
      }

      // Compile
      const compiled = this.compiler.compile(nodes, edges);

      res.json({
        success: true,
        data: {
          compiled,
          validation,
        },
      });
    } catch (error) {
      logger.error('Failed to compile plugin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compile plugin',
        details: error.message,
      });
    }
  }

  /**
   * Write plugin to file system with enhanced security
   * @param {string} pluginId - Plugin ID
   * @param {Object} pluginData - Plugin data
   */
  async writePluginFile(pluginId, pluginData) {
    try {
      // Get safe plugin directory path with explicit validation
      const pluginDir = getSafePluginPath(pluginId, this.pluginsDir);

      // Validate plugin data structure
      if (!pluginData || typeof pluginData !== 'object') {
        throw new Error('Invalid plugin data structure');
      }

      // Sanitize plugin data before writing
      const sanitizedData = sanitizePluginData(pluginData);

      // Check file size limit (10MB max)
      const jsonString = JSON.stringify(sanitizedData, null, 2);
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (jsonString.length > MAX_FILE_SIZE) {
        throw new Error(`Plugin file too large (max ${MAX_FILE_SIZE} bytes)`);
      }

      // Create directory if it doesn't exist
      const { mkdir } = await import('fs/promises');
      await mkdir(pluginDir, { recursive: true });

      // Get safe plugin file path with explicit validation
      const pluginFile = getSafePluginFilePath(pluginId, this.pluginsDir, 'plugin.json');

      // Write plugin file with restricted permissions
      await writeFile(pluginFile, jsonString, { mode: 0o644 });

      logger.debug(`Plugin file written: ${pluginFile}`);
    } catch (error) {
      logger.error('Failed to write plugin file:', error);
      throw error;
    }
  }

  /**
   * Get all template plugins (public endpoint)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getTemplates(req, res) {
    try {
      if (!this.db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const templates = await this.db.plugin.findMany({
        where: { is_template: true },
        select: {
          id: true,
          name: true,
          version: true,
          description: true,
          author: true,
          type: true,
          template_category: true,
          is_template: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Failed to fetch template plugins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template plugins',
      });
    }
  }

  /**
   * Clone a template plugin to create a new plugin
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async cloneTemplate(req, res) {
    try {
      if (!this.db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { templateId } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Plugin name is required',
        });
      }

      // Get the template plugin
      const template = await this.db.plugin.findFirst({
        where: { 
          id: templateId,
          is_template: true,
        },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template plugin not found',
        });
      }

      // Generate new plugin ID
      const newPluginId = `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create new plugin based on template
      const newPlugin = {
        id: newPluginId,
        name: name,
        version: '1.0.0',
        description: description || template.description,
        author: req.user.username,
        type: template.type,
        enabled: false, // Start disabled
        trigger_type: template.trigger_type,
        trigger_command: template.trigger_command,
        trigger_event: template.trigger_event,
        trigger_pattern: template.trigger_pattern,
        options: template.options,
        nodes: template.nodes,
        edges: template.edges,
        compiled: template.compiled,
        created_by: req.user.id,
        is_template: false,
        template_category: null,
      };

      // Save to database
      const savedPlugin = await this.db.plugin.create({
        data: newPlugin,
      });

      // Write to file system
      await this.writePluginFile(newPluginId, newPlugin);

      // Create audit log (only if user exists in database)
      if (req.user?.id) {
        try {
          await this.db.auditLog.create({
            data: {
              user_id: req.user.id,
              action: 'CLONE_TEMPLATE',
              resource_type: 'Plugin',
              resource_id: newPluginId,
              details: {
                template_id: templateId,
                template_name: template.name,
                new_plugin_name: name,
              },
            },
          });
        } catch (auditError) {
          logger.warn(`Failed to create audit log for template clone:`, auditError.message);
        }
      }

      res.json({
        success: true,
        message: 'Template cloned successfully',
        data: {
          id: savedPlugin.id,
          name: savedPlugin.name,
          version: savedPlugin.version,
          description: savedPlugin.description,
          author: savedPlugin.author,
          type: savedPlugin.type,
          enabled: savedPlugin.enabled,
          created_at: savedPlugin.created_at,
        },
      });
    } catch (error) {
      logger.error('Failed to clone template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clone template',
      });
    }
  }
}

export default PluginController;

