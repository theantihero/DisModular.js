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

// Set test database URL - use environment variables from vitest config
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://dismodular:password@localhost:5432/dismodular_test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
import { createPluginRoutes } from '../../../packages/api/src/routes/plugins.js';
import { PluginController } from '../../../packages/api/src/controllers/PluginController.js';
import { requireAdmin } from '../../../packages/api/src/middleware/auth.js';

describe('Plugin CRUD Integration Tests', () => {
  let app;
  let testDb;
  let prisma;
  let pluginController;

  beforeEach(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    prisma = testDb.getClient();
    await testDb.cleanup();

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false } // Set to false for testing
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Add authentication helper methods and auto-authenticate for testing
    app.use((req, res, next) => {
      // Set authentication helper methods
      req.isAuthenticated = () => !!req.user;
      req.login = (user, callback) => {
        req.user = user;
        if (callback) callback();
      };
      req.logout = (callback) => {
        req.user = null;
        if (callback) callback();
      };
      
      // For testing, automatically set user if not already set
      if (!req.user) {
        req.user = { 
          id: 'test-user', 
          username: 'testuser', 
          is_admin: true,
          access_status: 'approved'
        };
      }
      
      next();
    });

    // Create test plugins directory
    const { mkdir } = await import('fs/promises');
    try {
      await mkdir('./test-plugins', { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Create test user in database
    if (prisma) {
      try {
        await prisma.user.upsert({
          where: { id: 'test-user' },
          update: {
            username: 'testuser',
            access_status: 'approved',
            is_admin: true
          },
          create: {
            id: 'test-user',
            discord_id: '123456789',
            username: 'testuser',
            discriminator: '1234',
            access_status: 'approved',
            is_admin: true
          }
        });
      } catch (error) {
        console.warn('Failed to create test user:', error.message);
      }
    }

    // Initialize plugin controller
    pluginController = new PluginController(prisma, './test-plugins');

    // Add plugin routes
    app.use('/plugins', createPluginRoutes(pluginController));
  });

  afterEach(async () => {
    await testDb.close();
    
    // Clean up test plugins directory
    try {
      const { rm } = await import('fs/promises');
      await rm('./test-plugins', { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore error
    }
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
        description: 'A new test plugin',
        type: 'command',
        trigger: {
          type: 'command',
          command: 'test'
        },
        options: [],
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Test Command' }
          },
          {
            id: 'response',
            type: 'response',
            position: { x: 300, y: 100 },
            data: { label: 'Send Message' }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'start',
            target: 'response'
          }
        ]
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
      // Skip test if no database available
      if (!prisma) {
        console.log('⚠️ Skipping plugin deletion test - no database available');
        return;
      }

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
      // Skip test if no database available
      if (!prisma) {
        console.log('⚠️ Skipping plugin compilation test - no database available');
        return;
      }

      const compileData = {
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Test Command' }
          },
          {
            id: 'response',
            type: 'response',
            position: { x: 300, y: 100 },
            data: { label: 'Send Message' }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'start',
            target: 'response'
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
      // Skip test if no database available
      if (!prisma) {
        console.log('⚠️ Skipping database integration test - no database available');
        return;
      }

      // Ensure test user exists for this test
      if (prisma) {
        try {
          await prisma.user.upsert({
            where: { id: 'test-user' },
            update: {
              username: 'testuser',
              access_status: 'approved',
              is_admin: true
            },
            create: {
              id: 'test-user',
              discord_id: '123456789',
              username: 'testuser',
              discriminator: '1234',
              access_status: 'approved',
              is_admin: true
            }
          });
        } catch (error) {
          console.warn('Failed to create test user for database integration test:', error.message);
        }
      }

      // Create plugin
      const pluginData = {
        name: 'Consistency Test Plugin',
        description: 'Test plugin for data consistency',
        type: 'command',
        trigger: {
          type: 'command',
          command: 'consistency'
        },
        options: [],
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Consistency Command' }
          },
          {
            id: 'response',
            type: 'response',
            position: { x: 300, y: 100 },
            data: { label: 'Send Message' }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'start',
            target: 'response'
          }
        ]
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
