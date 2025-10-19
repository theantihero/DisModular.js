#!/usr/bin/env node

/**
 * Quick fix script to create missing tables
 * Run this if you're getting "UserGuildPermission table not found" errors
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[QUICK-FIX] Creating missing tables...');

try {
  // Use prisma db push to sync schema and create missing tables
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  console.log('[QUICK-FIX] ✅ Missing tables created successfully!');
  console.log('[QUICK-FIX] The UserGuildPermission and DiscordApiCache tables should now exist.');
  
} catch (error) {
  console.error('[QUICK-FIX] ❌ Failed to create missing tables:', error.message);
  console.log('[QUICK-FIX] Make sure your database is running and accessible.');
  process.exit(1);
}
