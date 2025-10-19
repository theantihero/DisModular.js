/**
 * Smoke Tests - Basic functionality verification
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect } from 'vitest';

describe('Smoke Tests', () => {
  describe('Environment Setup', () => {
    it('should have required environment variables', () => {
      expect(process.env.NODE_ENV).toBeDefined();
      expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should have Discord configuration', () => {
      expect(process.env.DISCORD_CLIENT_ID).toBeDefined();
      expect(process.env.DISCORD_CLIENT_SECRET).toBeDefined();
    });
  });

  describe('Module Imports', () => {
    it('should import Prisma Client successfully', async () => {
      const { PrismaClient } = await import('@prisma/client');
      expect(PrismaClient).toBeDefined();
    });

    it('should import Express successfully', async () => {
      const express = await import('express');
      expect(express.default).toBeDefined();
    });

    it('should import Passport successfully', async () => {
      const passport = await import('passport');
      expect(passport.default).toBeDefined();
    });

    it('should import Discord.js successfully', async () => {
      const { Client } = await import('discord.js');
      expect(Client).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate Discord OAuth configuration', () => {
      const config = {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackUrl: process.env.VITE_DISCORD_OAUTH_CALLBACK || 'http://localhost:3002/auth/discord/callback'
      };

      expect(config.clientId).toBeTruthy();
      expect(config.clientSecret).toBeTruthy();
      expect(config.callbackUrl).toBeTruthy();
      expect(config.callbackUrl).toContain('/auth/callback');
    });

    it('should validate database URL format', () => {
      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toBeTruthy();
      expect(dbUrl).toMatch(/^postgresql:\/\//);
    });
  });

  describe('File Structure', () => {
    it('should have required directories', async () => {
      const fs = await import('fs/promises');
      
      const requiredDirs = [
        'packages/api/src',
        'packages/bot/src',
        'packages/dashboard/src',
        'packages/shared',
        'prisma',
        'scripts',
        'tests'
      ];

      for (const dir of requiredDirs) {
        try {
          const stat = await fs.stat(dir);
          expect(stat.isDirectory()).toBe(true);
        } catch (error) {
          throw new Error(`Required directory ${dir} not found`);
        }
      }
    });

    it('should have required files', async () => {
      const fs = await import('fs/promises');
      
      const requiredFiles = [
        'package.json',
        'prisma/schema.prisma',
        'Dockerfile',
        'docker-compose.yml',
        'scripts/docker-init.js',
        'scripts/docker-startup.js',
        'scripts/seed.js'
      ];

      for (const file of requiredFiles) {
        try {
          const stat = await fs.stat(file);
          expect(stat.isFile()).toBe(true);
        } catch (error) {
          throw new Error(`Required file ${file} not found`);
        }
      }
    });
  });

  describe('Package.json Configuration', () => {
    it('should have correct workspace configuration', async () => {
      const pkg = await import('../package.json', { assert: { type: 'json' } });
      
      expect(pkg.default.name).toBe('dismodular.js');
      expect(pkg.default.workspaces).toContain('packages/*');
      expect(pkg.default.scripts.test).toBe('vitest');
    });

    it('should have required dependencies', async () => {
      const pkg = await import('../package.json', { assert: { type: 'json' } });
      
      const requiredDeps = [
        'vitest',
        'supertest',
        '@vitest/coverage-v8'
      ];

      for (const dep of requiredDeps) {
        expect(pkg.default.devDependencies[dep]).toBeDefined();
      }
    });
  });

  describe('API Route Structure', () => {
    it('should have auth middleware functions', async () => {
      const authMiddleware = await import('../packages/api/src/middleware/auth.js');
      
      expect(authMiddleware.initializePassport).toBeDefined();
      expect(authMiddleware.requireAuth).toBeDefined();
      expect(authMiddleware.requireAdmin).toBeDefined();
      expect(authMiddleware.optionalAuth).toBeDefined();
    });

    it('should have route creators', async () => {
      const authRoutes = await import('../packages/api/src/routes/auth.js');
      const adminRoutes = await import('../packages/api/src/routes/admin.js');
      const pluginRoutes = await import('../packages/api/src/routes/plugins.js');
      
      expect(authRoutes.createAuthRoutes).toBeDefined();
      expect(adminRoutes.createAdminRoutes).toBeDefined();
      expect(pluginRoutes.createPluginRoutes).toBeDefined();
    });
  });

  describe('Bot Structure', () => {
    it('should have bot client class', async () => {
      const botClient = await import('../packages/bot/src/core/BotClient.js');
      expect(botClient.BotClient).toBeDefined();
    });

    it('should have plugin manager', async () => {
      const pluginManager = await import('../packages/bot/src/plugins/PluginManager.js');
      expect(pluginManager.PluginManager).toBeDefined();
    });

    it('should have plugin loader', async () => {
      const pluginLoader = await import('../packages/bot/src/plugins/PluginLoader.js');
      expect(pluginLoader.PluginLoader).toBeDefined();
    });
  });

  describe('Dashboard Structure', () => {
    it('should have app store', async () => {
      const appStore = await import('../packages/dashboard/src/viewmodels/AppViewModel.js');
      expect(appStore.useAppStore).toBeDefined();
    });

    it('should have API service', async () => {
      const apiService = await import('../packages/dashboard/src/services/api.js');
      expect(apiService.api).toBeDefined();
    });
  });
});
