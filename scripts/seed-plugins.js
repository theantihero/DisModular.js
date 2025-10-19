#!/usr/bin/env node

/**
 * Seed Plugins Script
 * Reads plugin.json files from the plugins directory and seeds them into the database
 * @author fkndean_
 * @date 2025-10-19
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function seedPlugins() {
  try {
    console.log('🌱 Starting plugin seeding...');
    
    const pluginsDir = path.join(__dirname, '..', 'plugins');
    
    // Check if plugins directory exists
    if (!fs.existsSync(pluginsDir)) {
      console.error('❌ Plugins directory not found:', pluginsDir);
      process.exit(1);
    }
    
    // Read all plugin directories
    const pluginDirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`📁 Found ${pluginDirs.length} plugin directories:`, pluginDirs);
    
    let seededCount = 0;
    let skippedCount = 0;
    
    for (const pluginDir of pluginDirs) {
      const pluginPath = path.join(pluginsDir, pluginDir, 'plugin.json');
      
      if (!fs.existsSync(pluginPath)) {
        console.warn(`⚠️  Plugin.json not found in ${pluginDir}, skipping...`);
        skippedCount++;
        continue;
      }
      
      try {
        const pluginData = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
        
        // Check if plugin already exists
        const existingPlugin = await prisma.plugin.findUnique({
          where: { id: pluginData.id }
        });
        
        if (existingPlugin) {
          console.log(`⏭️  Plugin ${pluginData.name} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create plugin in database
        const createdPlugin = await prisma.plugin.create({
          data: {
            id: pluginData.id,
            name: pluginData.name,
            version: pluginData.version,
            description: pluginData.description,
            author: pluginData.author,
            type: pluginData.type,
            enabled: pluginData.enabled || true,
            trigger_type: pluginData.trigger?.type || pluginData.trigger_type,
            trigger_command: pluginData.trigger?.command || pluginData.trigger_command,
            trigger_event: pluginData.trigger?.event || pluginData.trigger_event,
            trigger_pattern: pluginData.trigger?.pattern || pluginData.trigger_pattern,
            options: pluginData.options || [],
            nodes: pluginData.nodes || [],
            edges: pluginData.edges || [],
            is_template: true, // Mark as template since these are example plugins
            template_category: 'example'
          }
        });
        
        console.log(`✅ Seeded plugin: ${createdPlugin.name} (${createdPlugin.id})`);
        seededCount++;
        
      } catch (error) {
        console.error(`❌ Error processing plugin ${pluginDir}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Plugin seeding completed!`);
    console.log(`   ✅ Seeded: ${seededCount} plugins`);
    console.log(`   ⏭️  Skipped: ${skippedCount} plugins`);
    
  } catch (error) {
    console.error('❌ Error during plugin seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedPlugins();
