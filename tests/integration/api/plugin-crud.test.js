/**
 * Plugin CRUD Integration Tests
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { TestDatabase, testFixtures, testHelpers } from '../../setup.js';
import { createPluginRoutes } from '../../packages/api/src/routes/plugins.js';
import { PluginController } from '../../packages/api/src/controllers/PluginController.js';
import { requireAdmin } from '../../packages/api/src/middleware/auth.js';

describe('Plugin CRUD Integration Tests', () => {
  let app;
  let testDb;
  let prisma;
  let pluginController;

  beforeEach(async () => {
    testDb = new TestDatabase();
    prisma = testDb.getClient();
    await testDb.setup();
    await testDb.cleanup();

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Initialize plugin controller
    pluginController = new PluginController(prisma, './test-plugins');

    // Add plugin routes
    app.use('/plugins', createPluginRoutes(pluginController));
  });

  afterEach(async () => {
    await testDb.close();
  });

  describe('GET /plugins', () => {
    it('should return empty array when no plugins exist', async () => {
      const response = await request(app)
        .get('/plugins')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all plugins', async () => {
      // Create test plugins
      const plugin1 = await testHelpers.createTestPlugin(prisma, {
        ...testFixtures.plugins.helloWorld,
        name: 'Plugin 1'
      });
      const plugin2 = await testHelpers.createTestPlugin(prisma, {
        ...testFixtures.plugins.helloWorld,
        name: 'Plugin 2'
      });

      const response = await request(app)
        .get('/plugins')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(p => p.name)).toContain('Plugin 1');
      expect(response.body.data.map(p => p.name)).toContain('Plugin 2');
    });
  });

  describe('GET /plugins/:id', () => {
    it('should return 404 for non-existent plugin', async () => {
      const response = await request(app)
        .get('/plugins/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Plugin not found');
    });

    it('should return plugin by ID', async () => {
      const plugin = await testHelpers.createTestPlugin(prisma);

      const response = await request(app)
        .get(`/plugins/${plugin.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(plugin.id);
      expect(response.body.data.name).toBe(plugin.name);
    });
  });

  describe('POST /plugins', () => {
    it('should create new plugin successfully', async () => {
      const pluginData = {
        name: 'New Test Plugin',
        version: '1.0.0',
        description: 'A new test plugin',
        author: 'Test Author',
        type: 'command',
        enabled: true,
        trigger_type: 'command',
        trigger_command: 'test',
        options: [],
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Test Command' }
          }
        ],
        edges: [],
        compiled: 'module.exports = { name: "New Test Plugin" };'
      };

      const response = await request(app)
        .post('/plugins')
        .send(pluginData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(pluginData.name);
      expect(response.body.data.version).toBe(pluginData.version);

      // Verify plugin was created in database
      const createdPlugin = await prisma.plugin.findUnique({
        where: { id: response.body.data.id }
      });
      expect(createdPlugin).toBeDefined();
      expect(createdPlugin.name).toBe(pluginData.name);
    });

    it('should return 400 for invalid plugin data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        version: '1.0.0'
      };

      const response = await request(app)
        .post('/plugins')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /plugins/:id', () => {
    it('should update plugin successfully', async () => {
      const plugin = await testHelpers.createTestPlugin(prisma);
      
      const updateData = {
        name: 'Updated Plugin Name',
        description: 'Updated description',
        enabled: false
      };

      const response = await request(app)
        .put(`/plugins/${plugin.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.enabled).toBe(updateData.enabled);

      // Verify plugin was updated in database
      const updatedPlugin = await prisma.plugin.findUnique({
        where: { id: plugin.id }
      });
      expect(updatedPlugin.name).toBe(updateData.name);
      expect(updatedPlugin.enabled).toBe(updateData.enabled);
    });

    it('should return 404 for non-existent plugin', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put('/plugins/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Plugin not found');
    });
  });

  describe('DELETE /plugins/:id', () => {
    it('should delete plugin successfully', async () => {
      const plugin = await testHelpers.createTestPlugin(prisma);

      const response = await request(app)
        .delete(`/plugins/${plugin.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Plugin deleted successfully');

      // Verify plugin was deleted from database
      const deletedPlugin = await prisma.plugin.findUnique({
        where: { id: plugin.id }
      });
      expect(deletedPlugin).toBeNull();
    });

    it('should return 404 for non-existent plugin', async () => {
      const response = await request(app)
        .delete('/plugins/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Plugin not found');
    });
  });

  describe('POST /plugins/compile', () => {
    it('should compile plugin nodes and edges', async () => {
      const compileData = {
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Test Command' }
          },
          {
            id: 'action',
            type: 'action',
            position: { x: 300, y: 100 },
            data: { label: 'Send Message' }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'start',
            target: 'action'
          }
        ]
      };

      const response = await request(app)
        .post('/plugins/compile')
        .send(compileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.compiled).toBeDefined();
      expect(typeof response.body.data.compiled).toBe('string');
    });

    it('should return 400 for invalid compilation data', async () => {
      const invalidData = {
        nodes: [] // Invalid: empty nodes
      };

      const response = await request(app)
        .post('/plugins/compile')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Database Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Create plugin
      const pluginData = {
        name: 'Consistency Test Plugin',
        version: '1.0.0',
        description: 'Test plugin for data consistency',
        author: 'Test Author',
        type: 'command',
        enabled: true,
        trigger_type: 'command',
        trigger_command: 'consistency',
        options: [],
        nodes: [],
        edges: [],
        compiled: 'module.exports = {};'
      };

      const createResponse = await request(app)
        .post('/plugins')
        .send(pluginData)
        .expect(201);

      const pluginId = createResponse.body.data.id;

      // Update plugin
      const updateData = { enabled: false };
      await request(app)
        .put(`/plugins/${pluginId}`)
        .send(updateData)
        .expect(200);

      // Verify update
      const getResponse = await request(app)
        .get(`/plugins/${pluginId}`)
        .expect(200);

      expect(getResponse.body.data.enabled).toBe(false);

      // Delete plugin
      await request(app)
        .delete(`/plugins/${pluginId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/plugins/${pluginId}`)
        .expect(404);
    });
  });
});
