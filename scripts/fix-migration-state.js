#!/usr/bin/env node

/**
 * Fix migration state script
 * This script resolves the missing migration file issue
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[MIGRATION-FIX] Fixing migration state...');

try {
  // First, try to resolve the missing migration
  console.log('[MIGRATION-FIX] Resolving missing migration 20250127000001_complete_schema...');
  execSync('npx prisma migrate resolve --applied 20250127000001_complete_schema', { 
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  console.log('[MIGRATION-FIX] ✅ Migration state resolved');
  
  // Then deploy remaining migrations
  console.log('[MIGRATION-FIX] Deploying remaining migrations...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  console.log('[MIGRATION-FIX] ✅ All migrations deployed successfully');
  
  // Finally, push schema to ensure all tables exist
  console.log('[MIGRATION-FIX] Syncing schema to ensure all tables exist...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  console.log('[MIGRATION-FIX] ✅ Schema synced successfully');
  console.log('[MIGRATION-FIX] The UserGuildPermission and DiscordApiCache tables should now exist.');
  
} catch (error) {
  console.error('[MIGRATION-FIX] ❌ Failed to fix migration state:', error.message);
  
  // Fallback: just push schema
  console.log('[MIGRATION-FIX] Attempting fallback with db push...');
  try {
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    console.log('[MIGRATION-FIX] ✅ Fallback successful - schema synced');
  } catch (pushError) {
    console.error('[MIGRATION-FIX] ❌ Fallback also failed:', pushError.message);
    process.exit(1);
  }
}
