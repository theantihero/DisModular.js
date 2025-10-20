/**
 * Plugin Loader - Auto-detects and loads plugins from directory
 * Watches plugins directory for changes and hot-reloads
 * Auto-compiles plugins without compiled code
 * @author fkndean_
 * @date 2025-10-14
 */

import chokidar from 'chokidar';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';
import { Logger } from '@dismodular/shared';
import NodeCompiler from '../../../api/src/services/NodeCompiler.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const logger = new Logger('PluginLoader');

export class PluginLoader {
  /**
   * Initialize Plugin Loader
   * @param {string} pluginsDir - Plugins directory path
   * @param {Object} pluginManager - Plugin manager instance
   * @param {Object} pluginModel - Plugin model instance
   * @param {Function} onPluginChange - Callback for plugin changes
   */
  constructor(pluginsDir, pluginManager, pluginModel, onPluginChange = null) {
    this.pluginsDir = pluginsDir;
    this.pluginManager = pluginManager;
    this.pluginModel = pluginModel;
    this.watcher = null;
    this.onPluginChange = onPluginChange;
    this.isInitialLoading = false; // Flag to prevent premature command registration
    this.compiler = new NodeCompiler();
  }

  /**
   * Start watching plugins directory
   */
  startWatching() {
    logger.info(`Watching plugins directory: ${this.pluginsDir}`);
    
    this.watcher = chokidar.watch(this.pluginsDir, {
      ignored: /(^|[/\\])\\./,
      persistent: true,
      ignoreInitial: true, // Skip initial scan to prevent event loop blocking
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', path => this.handleFileChange(path, 'add'))
      .on('change', path => this.handleFileChange(path, 'change'))
      .on('unlink', path => this.handleFileChange(path, 'unlink'))
      .on('error', error => logger.error('Watcher error:', error));
  }

  /**
   * Stop watching plugins directory
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      logger.info('Stopped watching plugins directory');
    }
  }

  /**
   * Handle file changes in plugins directory
   * @param {string} path - File path
   * @param {string} event - Event type
   */
  async handleFileChange(path, event) {
    try {
      // Only process plugin.json files
      if (!path.endsWith('plugin.json')) {
        return;
      }

      logger.debug(`Plugin file ${event}: ${path}`);

      switch (event) {
      case 'add':
      case 'change':
        await this.loadPluginFromFile(path);
        break;
      case 'unlink':
        await this.unloadPluginFromFile(path);
        break;
      }
    } catch (error) {
      logger.error(`Failed to handle file change for ${path}:`, error);
    }
  }

  /**
   * Load plugin from file
   * @param {string} filePath - Plugin file path
   */
  async loadPluginFromFile(filePath) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const pluginData = JSON.parse(content);

      // Validate plugin data (without compiled check)
      if (!this.validatePluginData(pluginData)) {
        logger.error(`Invalid plugin data in ${filePath}`);
        return;
      }

      // Mark as template if from plugins directory
      const isTemplate = filePath.includes('/plugins/') || filePath.includes('\\plugins\\');
      pluginData.is_template = isTemplate;
      pluginData.template_category = isTemplate ? 'example' : null;

      // Auto-compile if no compiled code present
      if (!pluginData.compiled && pluginData.nodes && pluginData.edges) {
        try {
          logger.info(`Auto-compiling plugin: ${pluginData.name}`);
          pluginData.compiled = this.compiler.compile(pluginData.nodes, pluginData.edges);
          logger.success(`Plugin compiled: ${pluginData.name} (${pluginData.compiled.split('\n').length} lines)`);
        } catch (compileError) {
          logger.error(`Failed to compile plugin ${pluginData.name}:`, compileError.message);
          logger.error(`Skipping plugin: ${filePath}`);
          return;
        }
      } else if (!pluginData.compiled) {
        logger.error(`Plugin ${pluginData.name} missing compiled code and nodes/edges`);
        logger.error(`Skipping plugin: ${filePath}`);
        return;
      }

      // Save to database
      const saved = await this.pluginModel.upsert(pluginData);
      if (!saved) {
        logger.error(`Failed to save plugin ${pluginData.name} to database`);
        return;
      }

      // Register with plugin manager
      const registered = this.pluginManager.register(pluginData);
      if (registered) {
        logger.success(`Plugin loaded: ${pluginData.name} v${pluginData.version}`);
        
        // Only trigger plugin change callback if not during initial loading
        // This prevents premature command registration during startup
        if (this.onPluginChange && !this.isInitialLoading) {
          // Clear command cache to force re-registration on next sync
          if (this.botClient && typeof this.botClient.clearCommandCache === 'function') {
            this.botClient.clearCommandCache();
          }
          await this.onPluginChange();
        }
      }
    } catch (error) {
      logger.error(`Failed to load plugin from ${filePath}:`, error);
    }
  }

  /**
   * Unload plugin from file
   * @param {string} filePath - Plugin file path
   */
  async unloadPluginFromFile(filePath) {
    try {
      // Extract plugin ID from file path
      const parts = filePath.split(/[/\\]/);
      const pluginDir = parts[parts.length - 2];
      
      // Try to find plugin by directory name
      const plugins = await this.pluginModel.getAll();
      const plugin = plugins.find(p => p.id === pluginDir || p.name === pluginDir);
      
      if (plugin) {
        this.pluginManager.unregister(plugin.id);
        await this.pluginModel.delete(plugin.id);
        logger.success(`Plugin unloaded: ${plugin.name}`);
      }
    } catch (error) {
      logger.error(`Failed to unload plugin from ${filePath}:`, error);
    }
  }

  /**
   * Load all plugins from database
   */
  async loadAllFromDatabase() {
    try {
      this.isInitialLoading = true; // Prevent premature command registration
      
      const plugins = await this.pluginModel.getAll(true); // Only enabled
      
      logger.info(`Loading ${plugins.length} plugins from database...`);
      
      let loaded = 0;
      for (const plugin of plugins) {
        if (this.pluginManager.register(plugin)) {
          loaded++;
        }
      }
      
      logger.success(`Loaded ${loaded}/${plugins.length} plugins`);
      
      // Trigger plugin change callback after all plugins are loaded
      if (this.onPluginChange) {
        await this.onPluginChange();
      }
      
      this.isInitialLoading = false; // Re-enable callback for future changes
    } catch (error) {
      logger.error('Failed to load plugins from database:', error);
      this.isInitialLoading = false; // Reset flag on error
    }
  }

  /**
   * Validate plugin data (compiled is optional - will be auto-generated)
   * @param {Object} pluginData - Plugin data
   * @returns {boolean} Validation result
   */
  validatePluginData(pluginData) {
    // Only require basic fields - compiled will be auto-generated if missing
    const required = ['id', 'name', 'version', 'type'];
    
    for (const field of required) {
      if (!pluginData[field]) {
        logger.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Scan plugins directory for plugin.json files
   * @returns {Promise<string[]>} Array of plugin file paths
   */
  async scanPluginsDirectory() {
    try {
      const dirs = await readdir(this.pluginsDir, { withFileTypes: true });
      const pluginFiles = [];

      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const pluginFile = join(this.pluginsDir, dir.name, 'plugin.json');
          try {
            await readFile(pluginFile); // Check if file exists
            pluginFiles.push(pluginFile);
          } catch {
            // File doesn't exist, skip
          }
        }
      }

      logger.success(`Scanned ${pluginFiles.length} plugin(s) from directory`);
      return pluginFiles;
    } catch (error) {
      logger.error('Failed to scan plugins directory:', error);
      return [];
    }
  }

  /**
   * Load all plugins from filesystem
   * @returns {Promise<void>}
   */
  async loadAllFromFilesystem() {
    try {
      this.isInitialLoading = true; // Prevent premature command registration
      
      const pluginFiles = await this.scanPluginsDirectory();

      for (const pluginFile of pluginFiles) {
        await this.loadPluginFromFile(pluginFile);
      }
      
      this.isInitialLoading = false; // Re-enable callback for future changes
    } catch (error) {
      logger.error('Failed to load plugins from filesystem:', error);
      this.isInitialLoading = false; // Reset flag on error
    }
  }

  /**
   * Initialize plugin loader
   * Loads plugins from filesystem, then starts watching for changes
   */
  async initialize() {
    await this.loadAllFromFilesystem();
    await this.loadAllFromDatabase();
    this.startWatching();
  }

  /**
   * Scan plugins directory and sync with database
   */
  async syncPlugins() {
    logger.info('Syncing plugins...');
    
    // First, load all plugins from filesystem (this will save them to database)
    await this.loadAllFromFilesystem();
    
    // Then, load all plugins from database (includes scanned + previously saved)
    await this.loadAllFromDatabase();
    
    // Finally, start watching for file changes
    this.startWatching();
  }
}

export default PluginLoader;
