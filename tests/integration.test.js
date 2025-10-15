/**
 * Integration Tests
 * Tests end-to-end plugin creation and execution flow
 * @author fkndean_
 * @date 2025-10-14
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';
import { PluginModel } from '../packages/bot/src/models/PluginModel.js';
import { PluginManager } from '../packages/bot/src/plugins/PluginManager.js';
import { NodeCompiler } from '../packages/api/src/services/NodeCompiler.js';

describe('Integration Tests', () => {
  let pluginModel;
  let pluginManager;
  let compiler;
  const testDbPath = join(process.cwd(), 'tests', 'test.db');

  before(async () => {
    // Create test directory
    await mkdir(join(process.cwd(), 'tests'), { recursive: true });

    // Initialize components
    pluginModel = new PluginModel(testDbPath);
    pluginManager = new PluginManager({ user: { tag: 'TestBot#0000' } }, pluginModel);
    compiler = new NodeCompiler();
  });

  after(async () => {
    // Cleanup
    pluginModel.close();
    try {
      await rm(testDbPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Plugin Creation Flow', () => {
    it('should create, compile, and register a simple plugin', () => {
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
      assert.strictEqual(validation.valid, true, 'Node graph should be valid');

      // 3. Compile to JavaScript
      const compiled = compiler.compile(nodes, edges);
      assert.ok(compiled.includes('__resolve'), 'Compiled code should include resolve');

      // 4. Create plugin data
      const pluginData = {
        id: 'test-hello',
        name: 'Test Hello',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger: {
          type: 'command',
          command: 'hello'
        },
        nodes,
        edges,
        compiled
      };

      // 5. Save to database
      const saved = pluginModel.upsert(pluginData);
      assert.strictEqual(saved, true, 'Plugin should be saved');

      // 6. Register with plugin manager
      const registered = pluginManager.register(pluginData);
      assert.strictEqual(registered, true, 'Plugin should be registered');

      // 7. Verify plugin is accessible
      const plugin = pluginManager.getPluginByCommand('hello', 'slash');
      assert.notStrictEqual(plugin, null, 'Plugin should be found');
      assert.strictEqual(plugin.name, 'Test Hello');
    });

    it('should handle complex plugin with variables and conditions', () => {
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
      assert.strictEqual(validation.valid, true);

      const compiled = compiler.compile(nodes, edges);
      assert.ok(compiled.includes('if ('));
      assert.ok(compiled.includes('} else {'));
      assert.ok(compiled.includes('variables["username"]'));

      const pluginData = {
        id: 'test-greet',
        name: 'Test Greet',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger: {
          type: 'command',
          command: 'greet'
        },
        nodes,
        edges,
        compiled
      };

      pluginModel.upsert(pluginData);
      const registered = pluginManager.register(pluginData);
      assert.strictEqual(registered, true);
    });
  });

  describe('Plugin State Management', () => {
    it('should save and retrieve plugin state', () => {
      const pluginId = 'test-state-plugin';

      // Save state
      pluginModel.setState(pluginId, 'counter', 42);
      pluginModel.setState(pluginId, 'name', 'TestPlugin');

      // Retrieve state
      const counter = pluginModel.getState(pluginId, 'counter');
      const name = pluginModel.getState(pluginId, 'name');

      assert.strictEqual(counter, 42);
      assert.strictEqual(name, 'TestPlugin');
    });

    it('should update existing state', () => {
      const pluginId = 'test-update-state';

      pluginModel.setState(pluginId, 'value', 10);
      assert.strictEqual(pluginModel.getState(pluginId, 'value'), 10);

      pluginModel.setState(pluginId, 'value', 20);
      assert.strictEqual(pluginModel.getState(pluginId, 'value'), 20);
    });

    it('should return null for non-existent state', () => {
      const result = pluginModel.getState('non-existent', 'key');
      assert.strictEqual(result, null);
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should enable and disable plugins', () => {
      const pluginData = {
        id: 'test-lifecycle',
        name: 'Lifecycle Test',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger: {
          type: 'command',
          command: 'lifecycle'
        },
        nodes: [
          { id: '1', type: 'trigger', data: {} },
          { id: '2', type: 'response', data: { config: { message: 'Test' } } }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' }
        ],
        compiled: '__resolve("test");'
      };

      pluginModel.upsert(pluginData);
      pluginManager.register(pluginData);

      // Plugin starts enabled
      let plugin = pluginManager.plugins.get('test-lifecycle');
      assert.strictEqual(plugin.enabled, true);

      // Disable plugin
      pluginManager.disablePlugin('test-lifecycle');
      plugin = pluginManager.plugins.get('test-lifecycle');
      assert.strictEqual(plugin.enabled, false);

      // Enable plugin
      pluginManager.enablePlugin('test-lifecycle');
      plugin = pluginManager.plugins.get('test-lifecycle');
      assert.strictEqual(plugin.enabled, true);
    });

    it('should unregister and re-register plugins', () => {
      const pluginData = {
        id: 'test-reload',
        name: 'Reload Test',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger: {
          type: 'command',
          command: 'reload'
        },
        nodes: [
          { id: '1', type: 'trigger', data: {} },
          { id: '2', type: 'response', data: { config: { message: 'Test' } } }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' }
        ],
        compiled: '__resolve("test");'
      };

      pluginModel.upsert(pluginData);
      pluginManager.register(pluginData);

      assert.ok(pluginManager.plugins.has('test-reload'));

      pluginManager.unregister('test-reload');
      assert.ok(!pluginManager.plugins.has('test-reload'));

      pluginManager.register(pluginData);
      assert.ok(pluginManager.plugins.has('test-reload'));
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
        assert.strictEqual(result, false, `Should reject code: ${code}`);
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
        assert.strictEqual(result, true, `Should accept code: ${code}`);
      }
    });
  });

  describe('Database Operations', () => {
    it('should retrieve all plugins from database', () => {
      const plugins = pluginModel.getAll();
      assert.ok(Array.isArray(plugins));
      assert.ok(plugins.length > 0);
    });

    it('should retrieve only enabled plugins', () => {
      const allPlugins = pluginModel.getAll(false);
      const enabledPlugins = pluginModel.getAll(true);

      assert.ok(enabledPlugins.length <= allPlugins.length);
      assert.ok(enabledPlugins.every(p => p.enabled === true));
    });

    it('should retrieve plugin by ID', () => {
      const plugins = pluginModel.getAll();
      if (plugins.length > 0) {
        const firstPlugin = plugins[0];
        const retrieved = pluginModel.getById(firstPlugin.id);
        
        assert.notStrictEqual(retrieved, null);
        assert.strictEqual(retrieved.id, firstPlugin.id);
        assert.strictEqual(retrieved.name, firstPlugin.name);
      }
    });

    it('should return null for non-existent plugin', () => {
      const plugin = pluginModel.getById('non-existent-id');
      assert.strictEqual(plugin, null);
    });

    it('should delete plugin from database', () => {
      const pluginData = {
        id: 'test-delete',
        name: 'Delete Test',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger: { type: 'command', command: 'delete' },
        nodes: [],
        edges: [],
        compiled: ''
      };

      pluginModel.upsert(pluginData);
      assert.notStrictEqual(pluginModel.getById('test-delete'), null);

      pluginModel.delete('test-delete');
      assert.strictEqual(pluginModel.getById('test-delete'), null);
    });
  });

  describe('Plugin Statistics', () => {
    it('should calculate correct statistics', () => {
      const stats = pluginManager.getStatistics();

      assert.ok(typeof stats.total === 'number');
      assert.ok(typeof stats.enabled === 'number');
      assert.ok(typeof stats.disabled === 'number');
      assert.ok(typeof stats.byType === 'object');
      assert.ok(typeof stats.byType.slash === 'number');
      assert.ok(typeof stats.byType.text === 'number');

      assert.strictEqual(stats.total, stats.enabled + stats.disabled);
    });
  });
});

