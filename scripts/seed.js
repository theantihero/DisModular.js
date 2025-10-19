#!/usr/bin/env node

/**
 * Database Seed Script
 * Seeds the database with example plugins and initial data
 * @author fkndean_
 * @date 2025-10-18
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Note: Plugin seeding removed - using file-based plugins from plugins/ directory instead

/**
 * Seed bot configuration
 */
async function seedBotConfig() {
  console.log('[SEED] Seeding bot configuration...');
  
  const configEntries = [
    { key: 'prefix', value: '!' },
    { key: 'welcome_message', value: 'Welcome to our server!' },
    { key: 'auto_role', value: 'Member' },
    { key: 'log_channel', value: 'bot-logs' }
  ];
  
  for (const config of configEntries) {
    try {
      await prisma.botConfig.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: config
      });
      
      console.log(`[SEED] Set bot config: ${config.key} = ${config.value}`);
      
    } catch (error) {
      console.error(`[SEED] Failed to set config "${config.key}":`, error.message);
    }
  }
  
  console.log('[SEED] Bot configuration seeding completed');
}

/**
 * Seed existing users to approved status for backward compatibility
 */
async function updateExistingUsers() {
  console.log('[SEED] Updating existing users to approved status...');

  try {
    const result = await prisma.user.updateMany({
      where: {
        access_status: null // Users without access_status field
      },
      data: {
        access_status: 'approved'
      }
    });

    console.log(`[SEED] Updated ${result.count} existing users to approved status`);
  } catch (error) {
    console.error('[SEED] Failed to update existing users:', error.message);
  }
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('[SEED] Starting database seeding...');

    await seedBotConfig();
    await updateExistingUsers();

    console.log('[SEED] Database seeding completed successfully!');

  } catch (error) {
    console.error('[SEED] Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seed();
