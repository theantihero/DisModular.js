#!/usr/bin/env node

/**
 * Fix Prisma Migration Script
 * Fixes the P3005 error by creating a proper baseline migration
 * @author fkndean_
 * @date 2025-01-27
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

/**
 * Fix Prisma migration issues
 */
async function fixPrismaMigration() {
  try {
    console.log('🔧 Fixing Prisma migration issues...\n');
    
    // Check if database is accessible
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
    
    // Check if migrations table exists
    let migrationsTableExists = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM "_prisma_migrations" LIMIT 1`;
      migrationsTableExists = true;
      console.log('✅ Migrations table exists');
    } catch (error) {
      console.log('⚠️  Migrations table does not exist');
    }
    
    // Check if we have any tables
    let hasTables = false;
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT LIKE '_prisma%'
        LIMIT 1
      `;
      hasTables = result.length > 0;
      console.log(`📊 Database has tables: ${hasTables ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log('⚠️  Could not check existing tables');
    }
    
    if (hasTables && !migrationsTableExists) {
      console.log('🔧 Database has tables but no migrations table - creating baseline...');
      
      try {
        // Create a baseline migration
        execSync('npx prisma migrate resolve --applied 20251018173737_init', { 
          stdio: 'inherit',
          cwd: join(__dirname, '..'),
          env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
        });
        console.log('✅ Baseline migration created');
      } catch (error) {
        console.log('⚠️  Could not create baseline migration, trying db push...');
        
        // Try db push as fallback
        execSync('npx prisma db push', { 
          stdio: 'inherit',
          cwd: join(__dirname, '..'),
          env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
        });
        console.log('✅ Schema synced with db push');
      }
    } else if (!hasTables) {
      console.log('🔧 Fresh database detected - running initial migration...');
      
      try {
        execSync('npx prisma migrate dev --name init', { 
          stdio: 'inherit',
          cwd: join(__dirname, '..'),
          env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
        });
        console.log('✅ Initial migration completed');
      } catch (error) {
        console.log('⚠️  Migrate dev failed, trying db push...');
        
        execSync('npx prisma db push', { 
          stdio: 'inherit',
          cwd: join(__dirname, '..'),
          env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
        });
        console.log('✅ Schema synced with db push');
      }
    } else {
      console.log('✅ Database and migrations are in sync');
    }
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: join(__dirname, '..')
      });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message);
    }
    
    // Verify tables exist
    console.log('🔍 Verifying database tables...');
    const requiredTables = [
      'users', 'plugins', 'plugin_state', 'bot_config', 
      'audit_log', 'guilds', 'guild_plugins', 
      'user_guild_permissions', 'discord_api_cache'
    ];
    
    try {
      const existingTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT LIKE '_prisma%'
      `;
      
      const existingTableNames = existingTables.map(row => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
      
      if (missingTables.length > 0) {
        console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
        console.log('🔧 Creating missing tables...');
        
        execSync('npx prisma db push', { 
          stdio: 'inherit',
          cwd: join(__dirname, '..'),
          env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
        });
        
        console.log('✅ Missing tables created');
      } else {
        console.log('✅ All required tables exist');
      }
    } catch (error) {
      console.error('❌ Error verifying tables:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Error fixing Prisma migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 DisModular.js Prisma Migration Fixer');
  console.log('=======================================\n');
  
  await fixPrismaMigration();
  
  console.log('\n✅ Prisma migration fix completed!');
}

// Run the script
main();
