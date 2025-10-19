#!/usr/bin/env node

/**
 * Test script to verify database schema
 * This script checks if all required tables exist and can be accessed
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

const requiredTables = [
  'users',
  'plugins', 
  'plugin_state',
  'bot_config',
  'audit_log',
  'guilds',
  'guild_plugins',
  'user_guild_permissions',
  'discord_api_cache'
];

async function testDatabaseConnection() {
  console.log('[TEST-SCHEMA] Testing database connection...');
  
  try {
    await prisma.$connect();
    console.log('[TEST-SCHEMA] ✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('[TEST-SCHEMA] ❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkTables() {
  console.log('[TEST-SCHEMA] Checking required tables...');
  
  try {
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE '_prisma%'
    `;
    
    const existingTableNames = existingTables.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
    
    console.log(`[TEST-SCHEMA] Found ${existingTableNames.length} tables:`);
    existingTableNames.forEach(table => {
      console.log(`  ✅ ${table}`);
    });
    
    if (missingTables.length > 0) {
      console.log(`[TEST-SCHEMA] Missing ${missingTables.length} tables:`);
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
      return false;
    } else {
      console.log('[TEST-SCHEMA] ✅ All required tables exist');
      return true;
    }
  } catch (error) {
    console.error('[TEST-SCHEMA] ❌ Error checking tables:', error.message);
    return false;
  }
}

async function testTableAccess() {
  console.log('[TEST-SCHEMA] Testing table access...');
  
  const testQueries = [
    { table: 'users', query: 'SELECT COUNT(*) FROM users' },
    { table: 'plugins', query: 'SELECT COUNT(*) FROM plugins' },
    { table: 'guilds', query: 'SELECT COUNT(*) FROM guilds' },
    { table: 'user_guild_permissions', query: 'SELECT COUNT(*) FROM user_guild_permissions' },
    { table: 'discord_api_cache', query: 'SELECT COUNT(*) FROM discord_api_cache' }
  ];
  
  for (const test of testQueries) {
    try {
      await prisma.$queryRawUnsafe(test.query);
      console.log(`  ✅ ${test.table} - accessible`);
    } catch (error) {
      console.log(`  ❌ ${test.table} - error: ${error.message}`);
    }
  }
}

async function syncSchema() {
  console.log('[TEST-SCHEMA] Attempting to sync schema...');
  
  try {
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    console.log('[TEST-SCHEMA] ✅ Schema sync completed');
    return true;
  } catch (error) {
    console.error('[TEST-SCHEMA] ❌ Schema sync failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('[TEST-SCHEMA] Starting schema test...\n');
  
  try {
    // Test database connection
    const connected = await testDatabaseConnection();
    if (!connected) {
      console.log('[TEST-SCHEMA] Cannot proceed without database connection');
      process.exit(1);
    }
    
    console.log('');
    
    // Check if tables exist
    const tablesExist = await checkTables();
    
    console.log('');
    
    if (!tablesExist) {
      console.log('[TEST-SCHEMA] Attempting to create missing tables...');
      const synced = await syncSchema();
      
      if (synced) {
        console.log('');
        await checkTables();
        console.log('');
      }
    }
    
    // Test table access
    await testTableAccess();
    
    console.log('\n[TEST-SCHEMA] Schema test completed!');
    
  } catch (error) {
    console.error('[TEST-SCHEMA] Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
main();
