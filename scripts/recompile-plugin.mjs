/**
 * Recompile a specific plugin and update in database
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import Database from 'better-sqlite3';
import NodeCompiler from '../packages/api/src/services/NodeCompiler.js';

const pluginId = process.argv[2] || 'example-weather';
const dbPath = join(process.cwd(), 'data', 'bot.db');
const pluginFile = join(process.cwd(), 'plugins', pluginId, 'plugin.json');

console.log(`Recompiling plugin: ${pluginId}`);

try {
  // Read plugin
  const content = await readFile(pluginFile, 'utf-8');
  const pluginData = JSON.parse(content);
  
  // Compile
  const compiler = new NodeCompiler();
  const compiled = compiler.compile(pluginData.nodes, pluginData.edges);
  
  console.log(`✓ Compiled successfully (${compiled.split('\n').length} lines)`);
  
  // Update database
  const db = new Database(dbPath);
  const stmt = db.prepare('UPDATE plugins SET compiled = ? WHERE id = ?');
  const result = stmt.run(compiled, pluginId);
  
  if (result.changes > 0) {
    console.log(`✓ Database updated for plugin: ${pluginId}`);
  } else {
    console.log(`⚠ Plugin not found in database: ${pluginId}`);
  }
  
  db.close();
  console.log('\n✅ Done! Restart the bot to use the updated plugin.');
  
} catch (error) {
  console.error('❌ Failed:', error.message);
  process.exit(1);
}

