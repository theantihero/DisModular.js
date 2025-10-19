#!/usr/bin/env node

/**
 * Cleanup Migration Script
 * Removes the problematic migration record from the database
 * @author fkndean_
 * @date 2025-10-18
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupMigration() {
  try {
    console.log('🧹 Cleaning up problematic migration record...');
    
    // Delete the problematic migration record
    const deletedCount = await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20250127000001_complete_schema'`;
    
    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} problematic migration record(s)`);
    } else {
      console.log('ℹ️ No problematic migration records found');
    }
    
    // Show current migrations
    const migrations = await prisma.$queryRaw`SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at`;
    console.log('📋 Current migrations:', migrations);
    
  } catch (error) {
    console.error('❌ Error cleaning up migration:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupMigration();
