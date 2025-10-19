/**
 * Integration Tests
 * Tests end-to-end plugin creation and execution flow
 * @author fkndean_
 * @date 2025-10-14
 */

// Load .env file if it exists (for local development)
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';

const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  config({ path: envPath });
}

import { describe, it, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { PluginModel } from '../packages/bot/src/models/PluginModel.js';
import { PluginManager } from '../packages/bot/src/plugins/PluginManager.js';
import { NodeCompiler } from '../packages/api/src/services/NodeCompiler.js';
import { TestDatabase } from './setup.js';
import { MockPluginModel } from './mocks/MockPluginModel.js';

// Set test database URL
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://dismodular:password@localhost:5432/dismodular_test';
process.env.DATABASE_URL = TEST_DATABASE_URL;

describe('Integration Tests', () => {
  let pluginModel;
  let pluginManager;
  let compiler;
  let testDb;

  beforeAll(async () => {
    // Initialize components - use mock in CI mode
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      pluginModel = new MockPluginModel();
      testDb = null; // No database needed in CI mode
    } else {
      // Setup test database
      testDb = new TestDatabase();
      await testDb.setup();
      await testDb.cleanup();
      pluginModel = new PluginModel(TEST_DATABASE_URL);
    }
    pluginManager = new PluginManager({ user: { tag: 'TestBot#0000' } }, pluginModel);
    compiler = new NodeCompiler();
  });

  afterAll(async () => {
    // Cleanup
    await pluginModel.close();
    if (testDb) {
      await testDb.close();
    }
  });

  describe('Plugin Creation Flow', () => {
    it('should create, compile, and register a simple plugin', async () => {
      // 1. Define plugin nodes (as created in dashboard)
      const nodes = [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'Hello Command',
            config: { command: 'hello' }
          }
        },
        {
          id: 'response_1',
          type: 'response',
          data: {
            label: 'Reply',
            config: { message: 'Hello World!' }
          }
        }
      ];

      const edges = [
        { id: 'e1', source: 'trigger_1', target: 'response_1' }
      ];

      // 2. Validate node graph
      const validation = compiler.validate(nodes, edges);
      expect(validation.valid).toBe(true);

      // 3. Compile to JavaScript
      const compiled = compiler.compile(nodes, edges);
      expect(compiled).toContain('__resolve');

      // 4. Create plugin data
      const pluginData = {
        id: 'test-hello',
        name: 'Test Hello',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'hello',
        nodes,
        edges,
        compiled
      };

      // 5. Save to database
      const saved = await pluginModel.upsert(pluginData);
      expect(saved).toBe(true);

      // 6. Register with plugin manager
      const registered = pluginManager.register(pluginData);
      expect(registered).toBe(true);

      // 7. Verify plugin is accessible
      const plugin = pluginManager.getPluginByCommand('hello', 'slash');
      expect(plugin).not.toBeNull();
      expect(plugin.name).toBe('Test Hello');
    });

    it('should handle complex plugin with variables and conditions', async () => {
      const nodes = [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: { label: 'Greet Command' }
        },
        {
          id: 'variable_1',
          type: 'variable',
          data: {
            label: 'Get Username',
            config: { name: 'username', type: 'user_name' }
          }
        },
        {
          id: 'condition_1',
          type: 'condition',
          data: {
            label: 'Check Username',
            config: { condition: 'variables["username"] !== "Unknown"' }
          }
        },
        {
          id: 'response_true',
          type: 'response',
          data: {
            label: 'Personal Greeting',
            config: { message: 'Hello {username}!' }
          }
        },
        {
          id: 'response_false',
          type: 'response',
          data: {
            label: 'Generic Greeting',
            config: { message: 'Hello there!' }
          }
        }
      ];

      const edges = [
        { id: 'e1', source: 'trigger_1', target: 'variable_1' },
        { id: 'e2', source: 'variable_1', target: 'condition_1' },
        { id: 'e3', source: 'condition_1', target: 'response_true', sourceHandle: 'true' },
        { id: 'e4', source: 'condition_1', target: 'response_false', sourceHandle: 'false' }
      ];

      const validation = compiler.validate(nodes, edges);
      expect(validation.valid).toBe(true);

      const compiled = compiler.compile(nodes, edges);
      expect(compiled).toContain('if (');
      expect(compiled).toContain('} else {');
      expect(compiled).toContain('variables["username"]');

      const pluginData = {
        id: 'test-greet',
        name: 'Test Greet',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'greet',  // Changed from trigger.command to trigger_command
        nodes,
        edges,
        compiled
      };

      await pluginModel.upsert(pluginData);
      const registered = pluginManager.register(pluginData);
      expect(registered).toBe(true);
    });
  });

  describe('Plugin State Management', () => {
    it('should save and retrieve plugin state', async () => {
      const pluginId = 'test-state-plugin';
      
      // First create the plugin in the database
      const pluginData = {
        id: pluginId,
        name: 'Test State Plugin',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'teststate',
        nodes: [],
        edges: [],
        compiled: '// Test plugin'
      };
      await pluginModel.upsert(pluginData);

      // Save state
      await pluginModel.setState(pluginId, 'counter', 42);
      await pluginModel.setState(pluginId, 'name', 'TestPlugin');

      // Retrieve state
      const counter = await pluginModel.getState(pluginId, 'counter');
      const name = await pluginModel.getState(pluginId, 'name');

      expect(counter).toBe(42);
      expect(name).toBe('TestPlugin');
    });

    it('should update existing state', async () => {
      const pluginId = 'test-update-state';
      
      // First create the plugin in the database
      const pluginData = {
        id: pluginId,
        name: 'Test Update State Plugin',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'testupdate',
        edges: [],
        compiled: '// Test plugin'
      };
      await pluginModel.upsert(pluginData);

      await pluginModel.setState(pluginId, 'value', 10);
      expect(await pluginModel.getState(pluginId, 'value')).toBe(10);

      await pluginModel.setState(pluginId, 'value', 20);
      expect(await pluginModel.getState(pluginId, 'value')).toBe(20);
    });

    it('should return null for non-existent state', async () => {
      const result = await pluginModel.getState('non-existent', 'key');
      expect(result).toBeNull();
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should enable and disable plugins', async () => {
      const pluginData = {
        id: 'test-lifecycle',
        name: 'Lifecycle Test',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'lifecycle',  // Changed from trigger.command to trigger_command
        nodes: [
          { id: '1', type: 'trigger', data: {} },
          { id: '2', type: 'response', data: { config: { message: 'Test' } } }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' }
        ],
        compiled: '__resolve("test");'
      };

      await pluginModel.upsert(pluginData);
      pluginManager.register(pluginData);

      // Plugin starts enabled
      let plugin = pluginManager.plugins.get('test-lifecycle');
      expect(plugin.enabled).toBe(true);

      // Disable plugin
      pluginManager.disablePlugin('test-lifecycle');
      plugin = pluginManager.plugins.get('test-lifecycle');
      expect(plugin.enabled).toBe(false);

      // Enable plugin
      pluginManager.enablePlugin('test-lifecycle');
      plugin = pluginManager.plugins.get('test-lifecycle');
      expect(plugin.enabled).toBe(true);
    });

    it('should unregister and re-register plugins', async () => {
      const pluginData = {
        id: 'test-reload',
        name: 'Reload Test',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'reload',  // Changed from trigger.command to trigger_command
        nodes: [
          { id: '1', type: 'trigger', data: {} },
          { id: '2', type: 'response', data: { config: { message: 'Test' } } }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' }
        ],
        compiled: '__resolve("test");'
      };

      await pluginModel.upsert(pluginData);
      pluginManager.register(pluginData);

      expect(pluginManager.plugins.has('test-reload')).toBe(true);

      pluginManager.unregister('test-reload');
      expect(pluginManager.plugins.has('test-reload')).toBe(false);

      pluginManager.register(pluginData);
      expect(pluginManager.plugins.has('test-reload')).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should reject plugins with dangerous code patterns', () => {
      const dangerousPatterns = [
        'require("fs")',
        'import fs from "fs"',
        'process.exit()',
        'eval("code")',
        'new Function("code")',
        'global.hack = true',
        '__dirname',
        'child_process'
      ];

      for (const code of dangerousPatterns) {
        const pluginData = {
          id: `dangerous-${Math.random()}`,
          name: 'Dangerous Plugin',
          version: '1.0.0',
          type: 'slash',
          enabled: true,
          trigger_command: 'dangerous',
          compiled: code
        };

        const result = pluginManager.register(pluginData);
        expect(result).toBe(false);
      }
    });

    it('should accept safe code patterns', () => {
      const safePatterns = [
        'console.log("Hello")',
        'Math.random()',
        'JSON.stringify({})',
        'new Date()',
        'variables["test"] = "value"'
      ];

      for (const code of safePatterns) {
        const pluginData = {
          id: `safe-${Math.random()}`,
          name: 'Safe Plugin',
          version: '1.0.0',
          type: 'slash',
          enabled: true,
          trigger_command: 'safe',
          compiled: code
        };

        const result = pluginManager.register(pluginData);
        expect(result).toBe(true);
      }
    });
  });

  describe('Database Operations', () => {
    it('should retrieve all plugins from database', async () => {
      const plugins = await pluginModel.getAll();
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });

    it('should retrieve only enabled plugins', async () => {
      const allPlugins = await pluginModel.getAll(false);
      const enabledPlugins = await pluginModel.getAll(true);

      expect(enabledPlugins.length).toBeLessThanOrEqual(allPlugins.length);
      expect(enabledPlugins.every(p => p.enabled === true)).toBe(true);
    });

    it('should retrieve plugin by ID', async () => {
      const plugins = await pluginModel.getAll();
      if (plugins.length > 0) {
        const firstPlugin = plugins[0];
        const retrieved = await pluginModel.getById(firstPlugin.id);
        
        expect(retrieved).not.toBeNull();
        expect(retrieved.id).toBe(firstPlugin.id);
        expect(retrieved.name).toBe(firstPlugin.name);
      }
    });

    it('should return null for non-existent plugin', async () => {
      const plugin = await pluginModel.getById('non-existent-id');
      expect(plugin).toBeNull();
    });

    it('should delete plugin from database', async () => {
      const pluginData = {
        id: 'test-delete',
        name: 'Delete Test',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'delete',
        nodes: [],
        edges: [],
        compiled: ''
      };

      await pluginModel.upsert(pluginData);
      expect(await pluginModel.getById('test-delete')).not.toBeNull();

      await pluginModel.delete('test-delete');
      expect(await pluginModel.getById('test-delete')).toBeNull();
    });
  });

  describe('Plugin Statistics', () => {
    it('should calculate correct statistics', () => {
      const stats = pluginManager.getStatistics();

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.enabled).toBe('number');
      expect(typeof stats.disabled).toBe('number');
      expect(typeof stats.byType).toBe('object');
      expect(typeof stats.byType.slash).toBe('number');
      expect(typeof stats.byType.text).toBe('number');

      expect(stats.total).toBe(stats.enabled + stats.disabled);
    });
  });
});

