/**
 * Database Setup Script
 * Initializes the database with tables and sample plugins
 * @author fkndean_
 * @date 2025-10-14
 */

import { join, dirname } from 'path';
import { mkdir, readdir, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import NodeCompiler from '../src/services/NodeCompiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(process.cwd(), 'data');
const dbPath = join(dataDir, 'bot.db');

console.log('Setting up database...');
console.log(`Database path: ${dbPath}`);

// Create data directory
try {
  await mkdir(dataDir, { recursive: true });
  console.log('✓ Data directory created');
} catch (error) {
  console.error('Failed to create data directory:', error);
  process.exit(1);
}

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      discord_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      discriminator TEXT,
      avatar TEXT,
      access_token TEXT,
      refresh_token TEXT,
      is_admin INTEGER DEFAULT 0,
      admin_notes TEXT,
      access_status TEXT DEFAULT 'pending',
      access_requested_at DATETIME,
      access_message TEXT,
      access_request_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Users table created');

  // Plugins table
  db.exec(`
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
      created_by TEXT,
      is_template INTEGER DEFAULT 0,
      template_category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  console.log('✓ Plugins table created');

  // Plugin state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_state (
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (plugin_id, key),
      FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Plugin state table created');

  // Bot configuration table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Bot config table created');

  // Audit log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log('✓ Audit log table created');

  // Command executions table for analytics
  db.exec(`
    CREATE TABLE IF NOT EXISTS command_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plugin_id TEXT,
      user_id TEXT,
      command_name TEXT NOT NULL,
      success INTEGER DEFAULT 1,
      execution_time_ms INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Command executions table created');

  // Guilds table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guilds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Guilds table created');

  // Guild plugins table (for guild-specific plugin settings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_plugins (
      guild_id TEXT NOT NULL,
      plugin_id TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (guild_id, plugin_id),
      FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
      FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Guild plugins table created');

  // User guild permissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_guild_permissions (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      permissions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, guild_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ User guild permissions table created');

  // Discord API cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS discord_api_cache (
      id TEXT PRIMARY KEY,
      cache_key TEXT UNIQUE NOT NULL,
      cache_type TEXT NOT NULL,
      user_id TEXT,
      data TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Discord API cache table created');

  // Load sample plugins
  console.log('\nLoading sample plugins...');
  await loadSamplePlugins(db);

  console.log('\n✅ Database setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Copy env.example to .env');
  console.log('2. Fill in your Discord bot credentials');
  console.log('3. Run: npm run dev');
  
} catch (error) {
  console.error('❌ Database setup failed:', error);
  process.exit(1);
} finally {
  db.close();
}

/**
 * Load sample plugins from plugins directory
 */
async function loadSamplePlugins(db) {
  try {
    const compiler = new NodeCompiler();
    const pluginsDir = join(process.cwd(), 'plugins');
    
    // Read all subdirectories in plugins directory
    const entries = await readdir(pluginsDir, { withFileTypes: true });
    const pluginDirs = entries.filter(entry => entry.isDirectory());
    
    let loaded = 0;
    for (const dir of pluginDirs) {
      const pluginJsonPath = join(pluginsDir, dir.name, 'plugin.json');
      
      try {
        const content = await readFile(pluginJsonPath, 'utf-8');
        const pluginData = JSON.parse(content);
        
        // Validate required fields
        if (!pluginData.id || !pluginData.name || !pluginData.version || !pluginData.type) {
          console.log(`  ⚠️  Skipping ${dir.name}: missing required fields`);
          continue;
        }
        
        // Validate nodes and edges
        if (!pluginData.nodes || !pluginData.edges) {
          console.log(`  ⚠️  Skipping ${dir.name}: missing nodes or edges`);
          continue;
        }
        
        // Auto-compile plugin
        let compiled;
        try {
          compiled = compiler.compile(pluginData.nodes, pluginData.edges);
        } catch (compileError) {
          console.log(`  ❌ Skipping ${dir.name}: compilation failed - ${compileError.message}`);
          continue;
        }
        
        // Insert into database
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO plugins (
            id, name, version, description, author, type, enabled,
            trigger_type, trigger_command, trigger_event, trigger_pattern,
            options, nodes, edges, compiled
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          pluginData.id,
          pluginData.name,
          pluginData.version,
          pluginData.description || '',
          pluginData.author || 'DisModular.js',
          pluginData.type,
          pluginData.enabled !== false ? 1 : 0,
          pluginData.trigger?.type || 'command',
          pluginData.trigger?.command || pluginData.trigger_command || null,
          pluginData.trigger?.event || pluginData.trigger_event || null,
          pluginData.trigger?.pattern || pluginData.trigger_pattern || null,
          JSON.stringify(pluginData.options || []),
          JSON.stringify(pluginData.nodes),
          JSON.stringify(pluginData.edges),
          compiled
        );
        
        console.log(`  ✓ Loaded: ${pluginData.name} (${compiled.split('\n').length} lines compiled)`);
        loaded++;
      } catch (error) {
        // Silently skip directories without plugin.json
        if (error.code !== 'ENOENT') {
          console.log(`  ⚠️  Failed to load ${dir.name}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✓ Loaded ${loaded} sample plugin(s)`);
  } catch (error) {
    console.warn('⚠️  Could not load sample plugins:', error.message);
    console.log('   (Plugins will be loaded when bot starts)');
  }
}

