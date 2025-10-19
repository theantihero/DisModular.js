#!/usr/bin/env node

/**
 * Docker Database Initialization Script
 * This script runs when the Docker container starts to ensure the database is properly set up
 * @author fkndean_
 * @date 2025-10-18
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

/**
 * Wait for database to be ready
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 */
async function waitForDatabase(maxRetries = 30, delay = 2000) {
  console.log('[DOCKER-INIT] Waiting for database to be ready...');
  console.log(`[DOCKER-INIT] DATABASE_URL: ${process.env.DATABASE_URL}`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[DOCKER-INIT] Database is ready!');
      return;
    } catch (error) {
      console.log(`[DOCKER-INIT] Database not ready yet (attempt ${i + 1}/${maxRetries})`);
      console.log(`[DOCKER-INIT] Error: ${error.message}`);
      if (i === maxRetries - 1) {
        console.error('[DOCKER-INIT] Final error details:', error);
        throw new Error('Database failed to become ready within timeout period');
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('[DOCKER-INIT] Running database migrations...');
  
  try {
    // First, check if migrations table exists
    let migrationsTableExists = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM "_prisma_migrations" LIMIT 1`;
      migrationsTableExists = true;
      console.log('[DOCKER-INIT] Migrations table exists, running migrations...');
      
      // Proactively clean up any problematic migration records
      console.log('[DOCKER-INIT] Cleaning up any problematic migration records...');
      const deletedCount = await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20250127000001_complete_schema'`;
      if (deletedCount > 0) {
        console.log(`[DOCKER-INIT] Cleaned up ${deletedCount} problematic migration record(s)`);
      }
    } catch (error) {
      console.log('[DOCKER-INIT] Migrations table does not exist, initializing...');
    }
    
    // Check if we have any tables at all
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
    } catch (error) {
      console.log('[DOCKER-INIT] Could not check existing tables');
    }
    
    if (!hasTables && !migrationsTableExists) {
      console.log('[DOCKER-INIT] Fresh database detected, running initial migration...');
      // For fresh databases, use migrate dev to create the initial migration
      execSync('npx prisma migrate dev --name init', { 
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
        env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
      });
    } else {
      // Use prisma migrate deploy for existing databases (non-interactive)
      try {
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: join(__dirname, '..'),
          env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
        });
        console.log('[DOCKER-INIT] Migrations deployed successfully');
      } catch (migrateError) {
        console.log('[DOCKER-INIT] Migrate deploy failed:', migrateError.message);
        
        // Check if it's a missing migration file error
        if (migrateError.message.includes('Could not find the migration file')) {
          console.log('[DOCKER-INIT] Missing migration file detected, cleaning up migration state...');
          
          try {
            // First, try to delete the problematic migration record from the database
            console.log('[DOCKER-INIT] Deleting problematic migration record from database...');
            await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20250127000001_complete_schema'`;
            console.log('[DOCKER-INIT] Problematic migration record deleted');
            
            // Now try migrate deploy again
            execSync('npx prisma migrate deploy', { 
              stdio: 'inherit',
              cwd: join(__dirname, '..'),
              env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
            });
            console.log('[DOCKER-INIT] Migrations deployed successfully after cleanup');
          } catch (resolveError) {
            console.log('[DOCKER-INIT] Could not resolve migration state, using db push...');
            // If resolve fails, use db push to ensure schema is synced
            execSync('npx prisma db push', { 
              stdio: 'inherit',
              cwd: join(__dirname, '..'),
              env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
            });
            console.log('[DOCKER-INIT] Schema synced with db push');
          }
        } else {
          console.log('[DOCKER-INIT] Other migration error, using db push to sync schema...');
          // If migrate deploy fails for other reasons, use db push to ensure schema is synced
          execSync('npx prisma db push', { 
            stdio: 'inherit',
            cwd: join(__dirname, '..'),
            env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
          });
          console.log('[DOCKER-INIT] Schema synced with db push');
        }
      }
    }
    
    console.log('[DOCKER-INIT] Database migrations completed successfully');
  } catch (error) {
    console.error('[DOCKER-INIT] Migration failed:', error.message);
    
    // Try to reset and migrate if there are issues
    console.log('[DOCKER-INIT] Attempting to reset and migrate...');
    try {
      execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
        env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
      });
      console.log('[DOCKER-INIT] Database reset and migration completed successfully');
    } catch (resetError) {
      console.error('[DOCKER-INIT] Reset and migration also failed:', resetError.message);
      
      // Last resort: try to create tables directly from schema
      console.log('[DOCKER-INIT] Attempting direct schema push...');
      try {
        execSync('npx prisma db push --force-reset', { 
          stdio: 'inherit',
          cwd: join(__dirname, '..'),
          env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
        });
        console.log('[DOCKER-INIT] Direct schema push completed successfully');
      } catch (pushError) {
        console.error('[DOCKER-INIT] All migration attempts failed:', pushError.message);
        throw pushError;
      }
    }
  }
}

/**
 * Generate Prisma client (force regeneration to ensure schema is up to date)
 */
async function generatePrismaClient() {
  console.log('[DOCKER-INIT] Generating Prisma client...');
  
  try {
    // First, check if Prisma client already exists and is valid
    console.log('[DOCKER-INIT] Checking if Prisma client exists...');
    execSync('ls -la node_modules/@prisma/client', { 
      stdio: 'pipe',
      cwd: join(__dirname, '..')
    });
    
    // Test if the existing client works
    try {
      const { PrismaClient } = await import('@prisma/client');
      const testClient = new PrismaClient();
      await testClient.$disconnect();
      console.log('[DOCKER-INIT] Existing Prisma client is valid, skipping generation');
      return;
    } catch (testError) {
      console.log('[DOCKER-INIT] Existing Prisma client is invalid, regenerating...');
    }
  } catch (error) {
    console.log('[DOCKER-INIT] No existing Prisma client found, generating new one...');
  }
  
  try {
    // Fix permissions on node_modules before generation
    console.log('[DOCKER-INIT] Fixing node_modules permissions...');
    execSync('chmod -R 755 node_modules', { 
      stdio: 'pipe',
      cwd: join(__dirname, '..')
    });
    
    // Generate the client
    console.log('[DOCKER-INIT] Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    console.log('[DOCKER-INIT] Prisma client generated successfully');
  } catch (error) {
    console.error('[DOCKER-INIT] Prisma client generation failed:', error.message);
    console.log('[DOCKER-INIT] Attempting to use pre-generated client...');
    
    // Check if we can use the pre-generated client
    try {
      const { PrismaClient } = await import('@prisma/client');
      const testClient = new PrismaClient();
      await testClient.$disconnect();
      console.log('[DOCKER-INIT] Successfully using pre-generated Prisma client');
    } catch (importError) {
      console.error('[DOCKER-INIT] Pre-generated Prisma client is also invalid');
      console.error('[DOCKER-INIT] This may cause runtime issues, but continuing...');
    }
  }
}

/**
 * Verify that all required tables exist
 */
async function verifyTables() {
  console.log('[DOCKER-INIT] Verifying database tables...');
  
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
      console.warn(`[DOCKER-INIT] Missing tables: ${missingTables.join(', ')}`);
      console.log('[DOCKER-INIT] Attempting to create missing tables...');
      
      // Check if critical tables are missing (UserGuildPermission, DiscordApiCache)
      const criticalTables = ['user_guild_permissions', 'discord_api_cache'];
      const missingCritical = missingTables.filter(table => criticalTables.includes(table));
      
      if (missingCritical.length > 0) {
        console.log(`[DOCKER-INIT] Critical tables missing: ${missingCritical.join(', ')}`);
        console.log('[DOCKER-INIT] Forcing schema sync to create missing tables...');
      }
      
      // Try to push schema to create missing tables
      execSync('npx prisma db push', { 
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
        env: { ...process.env, PRISMA_MIGRATE_SKIP_GENERATE: 'true' }
      });
      
      console.log('[DOCKER-INIT] Missing tables created successfully');
      
      // Verify again after creating missing tables
      const verifyAgain = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT LIKE '_prisma%'
      `;
      const verifyTableNames = verifyAgain.map(row => row.table_name);
      const stillMissing = requiredTables.filter(table => !verifyTableNames.includes(table));
      
      if (stillMissing.length > 0) {
        console.error(`[DOCKER-INIT] Still missing tables after sync: ${stillMissing.join(', ')}`);
        throw new Error(`Failed to create tables: ${stillMissing.join(', ')}`);
      } else {
        console.log('[DOCKER-INIT] All missing tables created successfully');
      }
    } else {
      console.log('[DOCKER-INIT] All required tables exist');
    }
  } catch (error) {
    console.error('[DOCKER-INIT] Error verifying tables:', error.message);
    throw error;
  }
}

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log('[DOCKER-INIT] Seeding database...');
  
  try {
    // Check if we already have data
    const userCount = await prisma.user.count();
    const pluginCount = await prisma.plugin.count();
    
    if (userCount > 0 || pluginCount > 0) {
      console.log('[DOCKER-INIT] Database already has data, skipping seed');
      return;
    }

    // Note: Initial admin user will be created automatically when they log in via Discord OAuth
    // The auth middleware handles this based on INITIAL_ADMIN_DISCORD_ID environment variable

    // Run the seed script if it exists
    try {
      execSync('npm run db:seed', { 
        stdio: 'inherit',
        cwd: join(__dirname, '..')
      });
      console.log('[DOCKER-INIT] Database seeding completed');
    } catch (error) {
      console.log('[DOCKER-INIT] No seed script found or seed failed, continuing...');
    }

    // Admin access is handled automatically by the auth middleware when users log in


  } catch (error) {
    console.error('[DOCKER-INIT] Database seeding failed:', error.message);
    // Don't throw here, as seeding is optional
  }
}

/**
 * Main initialization function
 */
async function initialize() {
  try {
    console.log('[DOCKER-INIT] Starting database initialization...');
    
    // Wait for database to be ready
    await waitForDatabase();
    
    
    // Run migrations
    await runMigrations();
    
    // Verify all tables exist
    await verifyTables();
    
    // Generate Prisma client
    await generatePrismaClient();
    
    // Seed database
    await seedDatabase();
    
    console.log('[DOCKER-INIT] Database initialization completed successfully!');
    
  } catch (error) {
    console.error('[DOCKER-INIT] Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initialize();
