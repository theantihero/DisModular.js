#!/usr/bin/env node

/**
 * Docker Application Startup Script
 * Runs database initialization and then starts the application
 * @author fkndean_
 * @date 2025-10-18
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database initialization
 */
async function runDatabaseInit() {
  console.log('[STARTUP] Running database initialization...');
  
  return new Promise((resolve, reject) => {
    const initProcess = spawn('node', ['scripts/docker-init.js'], {
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        console.log('[STARTUP] Database initialization completed successfully');
        resolve();
      } else {
        console.error('[STARTUP] Database initialization failed with code:', code);
        reject(new Error(`Database initialization failed with code ${code}`));
      }
    });
    
    initProcess.on('error', (error) => {
      console.error('[STARTUP] Database initialization error:', error);
      reject(error);
    });
  });
}

/**
 * Start the application (both API and Bot)
 */
function startApplication() {
  console.log('[STARTUP] Starting application...');
  
  // Start API server
  const apiProcess = spawn('npm', ['run', 'start:api'], {
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  // Start Bot
  const botProcess = spawn('npm', ['run', 'start:bot'], {
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  let apiExited = false;
  let botExited = false;
  
  const checkExit = () => {
    if (apiExited && botExited) {
      console.log('[STARTUP] Both API and Bot have exited');
      process.exit(0);
    }
  };
  
  apiProcess.on('close', (code) => {
    console.log(`[STARTUP] API exited with code: ${code}`);
    apiExited = true;
    checkExit();
  });
  
  botProcess.on('close', (code) => {
    console.log(`[STARTUP] Bot exited with code: ${code}`);
    botExited = true;
    checkExit();
  });
  
  apiProcess.on('error', (error) => {
    console.error('[STARTUP] API error:', error);
    process.exit(1);
  });
  
  botProcess.on('error', (error) => {
    console.error('[STARTUP] Bot error:', error);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('[STARTUP] Received SIGINT, shutting down gracefully...');
    apiProcess.kill('SIGINT');
    botProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('[STARTUP] Received SIGTERM, shutting down gracefully...');
    apiProcess.kill('SIGTERM');
    botProcess.kill('SIGTERM');
  });
}

/**
 * Main startup function
 */
async function startup() {
  try {
    console.log('[STARTUP] Starting DisModular.js Docker container...');
    
    // Run database initialization
    await runDatabaseInit();
    
    // Start the application
    startApplication();
    
  } catch (error) {
    console.error('[STARTUP] Startup failed:', error);
    process.exit(1);
  }
}

// Run startup
startup();
