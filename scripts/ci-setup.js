#!/usr/bin/env node

/**
 * CI Setup Script for DisModular.js
 * 
 * This script helps set up the environment for CI/CD pipelines
 * by ensuring all dependencies are properly installed and configured.
 * 
 * @author fkndean_
 * @date 2025-10-19
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Setting up DisModular.js for CI...');

try {
  // Check if package-lock.json exists
  if (!existsSync('package-lock.json')) {
    console.log('📦 Generating package-lock.json...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Run npm ci to ensure clean install
  console.log('🔧 Running npm ci...');
  execSync('npm ci', { stdio: 'inherit' });

  // Generate Prisma client
  console.log('🗄️ Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('✅ CI setup completed successfully!');
  
} catch (error) {
  console.error('❌ CI setup failed:', error.message);
  process.exit(1);
}
