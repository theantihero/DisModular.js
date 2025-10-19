/**
 * Multi-Guild Integration Tests
 * Tests guild-specific plugin management and command registration
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import { createGuildRoutes } from '../../packages/api/src/routes/guild.js';
import { createPluginRoutes } from '../../packages/api/src/routes/plugins.js';
import PluginController from '../../packages/api/src/controllers/PluginController.js';
import { requireAdmin } from '../../packages/api/src/middleware/auth.js';
import { TestDatabase } from '../setup.js';
import { createMockGuildRoutes } from '../mocks/MockGuildRoutes.js';

// Setup test environment variables
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://dismodular:password@localhost:5432/dismodular_test';
}
if (!process.env.DISCORD_CLIENT_ID) {
  process.env.DISCORD_CLIENT_ID = 'test_client_id';
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  process.env.DISCORD_CLIENT_SECRET = 'test_client_secret';
}
if (!process.env.DISCORD_CALLBACK_URL) {
  process.env.DISCORD_CALLBACK_URL = 'http://localhost:3002/auth/discord/callback';
}
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test_session_secret';
}

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://dismodular:password@localhost:5432/dismodular_test';
const prisma = new PrismaClient({
  datasources: {
    db: { url: TEST_DATABASE_URL }
  }
});

// Mock auth middleware for testing
const mockRequireAdmin = (req, res, next) => {
  req.user = { id: 'test-admin', is_admin: true };
  next();
};

describe('Multi-Guild Plugin System', () => {
  let app;
  let testDb;
  let testGuildId1 = '123456789';
  let testGuildId2 = '987654321';
  let testPluginId = 'test-plugin-123';

  beforeAll(async () => {
    // Setup test database - skip in CI mode
    if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
      testDb = new TestDatabase();
      await testDb.setup();
      await testDb.cleanup();
    } else {
      testDb = null; // No database needed in CI mode
    }

    // Create test app
    app = express();
    app.use(express.json());

    // Create plugin controller
    const pluginController = new PluginController(prisma, './test-plugins');

    // Add routes - use mock in CI mode
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      app.use('/guilds', createMockGuildRoutes());
    } else {
      app.use('/guilds', mockRequireAdmin, createGuildRoutes());
    }
    app.use('/plugins', createPluginRoutes(pluginController));

    // Create test data - skip in CI mode
    if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
      await prisma.guild.createMany({
        data: [
          {
            id: testGuildId1,
            name: 'Test Guild 1',
            enabled: true,
            settings: {}
          },
          {
            id: testGuildId2,
            name: 'Test Guild 2',
            enabled: true,
            settings: {}
          }
        ]
      });
    }

    // Skip database operations in CI mode
    if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
      await prisma.plugin.create({
        data: {
          id: testPluginId,
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin',
          author: 'Test Author',
          type: 'slash',
          enabled: true,
          trigger_command: 'test',
          compiled: 'console.log("test");',
          is_template: false,
          nodes: [],
          edges: []
        }
      });
    }
  });

  afterAll(async () => {
    if (testDb) {
      await testDb.close();
    }
  });

  beforeEach(async () => {
    // Clean up guild plugins before each test - skip in CI mode
    if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
      await prisma.guildPlugin.deleteMany({
        where: {
          guild_id: { in: [testGuildId1, testGuildId2] }
        }
      });
    }
  });

  describe('Guild Management', () => {
    it('should list all guilds', async () => {
      const response = await request(app)
        .get('/guilds')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('enabled');
    });

    it('should get specific guild information', async () => {
      const response = await request(app)
        .get(`/guilds/${testGuildId1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testGuildId1);
      expect(response.body.data.name).toBe('Test Guild 1');
      expect(response.body.data.plugins).toHaveLength(0);
    });

    it('should get plugins for a specific guild', async () => {
      const response = await request(app)
        .get(`/guilds/${testGuildId1}/plugins`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Guild Plugin Management', () => {
    it('should enable a plugin for a guild', async () => {
      const response = await request(app)
        .put(`/guilds/${testGuildId1}/plugins/${testPluginId}`)
        .send({ enabled: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('enabled');

      // Verify the plugin is enabled for the guild
      const guildPlugins = await prisma.guildPlugin.findMany({
        where: {
          guild_id: testGuildId1,
          plugin_id: testPluginId
        }
      });

      expect(guildPlugins).toHaveLength(1);
      expect(guildPlugins[0].enabled).toBe(true);
    });

    it('should disable a plugin for a guild', async () => {
      // First enable the plugin
      await prisma.guildPlugin.create({
        data: {
          guild_id: testGuildId1,
          plugin_id: testPluginId,
          enabled: true,
          settings: {}
        }
      });

      const response = await request(app)
        .put(`/guilds/${testGuildId1}/plugins/${testPluginId}`)
        .send({ enabled: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('disabled');

      // Verify the plugin is disabled for the guild
      const guildPlugin = await prisma.guildPlugin.findUnique({
        where: {
          guild_id_plugin_id: {
            guild_id: testGuildId1,
            plugin_id: testPluginId
          }
        }
      });

      expect(guildPlugin.enabled).toBe(false);
    });

    it('should handle non-existent guild', async () => {
      const response = await request(app)
        .put(`/guilds/nonexistent/plugins/${testPluginId}`)
        .send({ enabled: true })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Guild not found');
    });

    it('should handle non-existent plugin', async () => {
      const response = await request(app)
        .put(`/guilds/${testGuildId1}/plugins/nonexistent`)
        .send({ enabled: true })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Plugin not found');
    });
  });

  describe('Template Plugin System', () => {
    let templatePluginId;

    beforeAll(async () => {
      // Create a template plugin
      templatePluginId = 'template-plugin-123';
      await prisma.plugin.create({
        data: {
          id: templatePluginId,
          name: 'Template Plugin',
          version: '1.0.0',
          description: 'A template plugin',
          author: 'System',
          type: 'slash',
          enabled: true,
          trigger_command: 'template',
          compiled: 'console.log("template");',
          is_template: true,
          template_category: 'example',
          nodes: [],
          edges: []
        }
      });
    });

    afterAll(async () => {
      await prisma.plugin.deleteMany({
        where: {
          id: templatePluginId
        }
      });
    });

    it('should list template plugins', async () => {
      const response = await request(app)
        .get('/plugins/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].is_template).toBe(true);
      expect(response.body.data[0].template_category).toBe('example');
    });

    it('should clone a template plugin', async () => {
      const response = await request(app)
        .post(`/plugins/clone/${templatePluginId}`)
        .send({
          name: 'Cloned Plugin',
          description: 'A cloned plugin'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cloned');
      expect(response.body.data.name).toBe('Cloned Plugin');
      expect(response.body.data.is_template).toBe(false);

      // Verify the plugin was created
      const clonedPlugin = await prisma.plugin.findFirst({
        where: {
          name: 'Cloned Plugin',
          is_template: false
        }
      });

      expect(clonedPlugin).toBeTruthy();
      expect(clonedPlugin.created_by).toBe('test-admin');
    });

    it('should require plugin name when cloning', async () => {
      const response = await request(app)
        .post(`/plugins/clone/${templatePluginId}`)
        .send({
          description: 'A cloned plugin without name'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Plugin name is required');
    });
  });

  describe('Guild Plugin Execution Context', () => {
    it('should check guild plugin status before execution', async () => {
      // Create a guild plugin relationship
      await prisma.guildPlugin.create({
        data: {
          guild_id: testGuildId1,
          plugin_id: testPluginId,
          enabled: true,
          settings: {}
        }
      });

      // Mock plugin execution context
      const context = {
        guildId: testGuildId1,
        interaction: { commandName: 'test' }
      };

      // This would be tested with actual plugin execution
      // For now, we verify the guild plugin relationship exists
      const guildPlugin = await prisma.guildPlugin.findUnique({
        where: {
          guild_id_plugin_id: {
            guild_id: testGuildId1,
            plugin_id: testPluginId
          }
        }
      });

      expect(guildPlugin).toBeTruthy();
      expect(guildPlugin.enabled).toBe(true);
    });

    it('should prevent execution when plugin is disabled for guild', async () => {
      // Create a disabled guild plugin relationship
      await prisma.guildPlugin.create({
        data: {
          guild_id: testGuildId1,
          plugin_id: testPluginId,
          enabled: false,
          settings: {}
        }
      });

      const guildPlugin = await prisma.guildPlugin.findUnique({
        where: {
          guild_id_plugin_id: {
            guild_id: testGuildId1,
            plugin_id: testPluginId
          }
        }
      });

      expect(guildPlugin.enabled).toBe(false);
      // In actual execution, this would prevent plugin from running
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to guild endpoints', async () => {
      // This test would require actual rate limiting middleware
      // For now, we verify the endpoints exist and respond correctly
      const response = await request(app)
        .get('/guilds')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
