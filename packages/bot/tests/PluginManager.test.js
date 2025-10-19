/**
 * PluginManager Unit Tests
 * @author fkndean_
 * @date 2025-10-14
 */

// Load .env file if it exists (for local development)
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
const envPath = join(process.cwd(), '../../.env');
if (existsSync(envPath)) {
  config({ path: envPath });
}

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PluginManager } from '../src/plugins/PluginManager.js';
import { PluginModel } from '../src/models/PluginModel.js';
// import { Client } from 'discord.js';

describe('PluginManager', () => {
  let pluginManager;
  let pluginModel;
  let mockClient;

  before(() => {
    // Create mock client
    mockClient = {
      user: { tag: 'TestBot#0000' },
    };

    // Create test database in memory
    pluginModel = new PluginModel(':memory:');
    pluginManager = new PluginManager(mockClient, pluginModel);
  });

  after(() => {
    pluginModel.close();
  });

  beforeEach(() => {
    // Clear plugins before each test
    pluginManager.plugins.clear();
  });

  describe('register', () => {
    it('should register a valid plugin', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'test',
        compiled: 'console.log("test");',
      };

      const result = pluginManager.register(plugin);
      assert.strictEqual(result, true);
      assert.strictEqual(pluginManager.plugins.size, 1);
    });

    it('should reject plugin without id', () => {
      const plugin = {
        name: 'Test Plugin',
        compiled: 'console.log("test");',
      };

      const result = pluginManager.register(plugin);
      assert.strictEqual(result, false);
      assert.strictEqual(pluginManager.plugins.size, 0);
    });

    it('should reject plugin without name', () => {
      const plugin = {
        id: 'test-plugin',
        compiled: 'console.log("test");',
      };

      const result = pluginManager.register(plugin);
      assert.strictEqual(result, false);
      assert.strictEqual(pluginManager.plugins.size, 0);
    });

    it('should reject plugin with dangerous code', () => {
      const plugin = {
        id: 'malicious-plugin',
        name: 'Malicious Plugin',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'hack',
        compiled: 'require("fs").readFileSync("/etc/passwd");',
      };

      const result = pluginManager.register(plugin);
      assert.strictEqual(result, false);
      assert.strictEqual(pluginManager.plugins.size, 0);
    });
  });

  describe('unregister', () => {
    it('should unregister an existing plugin', () => {
      const plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'test',
        compiled: 'console.log("test");',
      };

      pluginManager.register(plugin);
      assert.strictEqual(pluginManager.plugins.size, 1);

      const result = pluginManager.unregister('test-plugin');
      assert.strictEqual(result, true);
      assert.strictEqual(pluginManager.plugins.size, 0);
    });

    it('should return false for non-existent plugin', () => {
      const result = pluginManager.unregister('non-existent');
      assert.strictEqual(result, false);
    });
  });

  describe('getPluginByCommand', () => {
    beforeEach(() => {
      const plugins = [
        {
          id: 'slash-plugin',
          name: 'Slash Plugin',
          version: '1.0.0',
          type: 'slash',
          enabled: true,
          trigger_command: 'slashcmd',
          compiled: 'console.log("slash");',
        },
        {
          id: 'text-plugin',
          name: 'Text Plugin',
          version: '1.0.0',
          type: 'text',
          enabled: true,
          trigger_command: 'textcmd',
          compiled: 'console.log("text");',
        },
        {
          id: 'both-plugin',
          name: 'Both Plugin',
          version: '1.0.0',
          type: 'both',
          enabled: true,
          trigger_command: 'bothcmd',
          compiled: 'console.log("both");',
        },
      ];

      plugins.forEach(p => pluginManager.register(p));
    });

    it('should find slash command plugin', () => {
      const plugin = pluginManager.getPluginByCommand('slashcmd', 'slash');
      assert.notStrictEqual(plugin, null);
      assert.strictEqual(plugin.id, 'slash-plugin');
    });

    it('should find text command plugin', () => {
      const plugin = pluginManager.getPluginByCommand('textcmd', 'text');
      assert.notStrictEqual(plugin, null);
      assert.strictEqual(plugin.id, 'text-plugin');
    });

    it('should find both-type plugin with slash', () => {
      const plugin = pluginManager.getPluginByCommand('bothcmd', 'slash');
      assert.notStrictEqual(plugin, null);
      assert.strictEqual(plugin.id, 'both-plugin');
    });

    it('should find both-type plugin with text', () => {
      const plugin = pluginManager.getPluginByCommand('bothcmd', 'text');
      assert.notStrictEqual(plugin, null);
      assert.strictEqual(plugin.id, 'both-plugin');
    });

    it('should not find mismatched type', () => {
      const plugin = pluginManager.getPluginByCommand('slashcmd', 'text');
      assert.strictEqual(plugin, null);
    });

    it('should be case-insensitive', () => {
      const plugin = pluginManager.getPluginByCommand('SLASHCMD', 'slash');
      assert.notStrictEqual(plugin, null);
      assert.strictEqual(plugin.id, 'slash-plugin');
    });
  });

  describe('enablePlugin and disablePlugin', () => {
    beforeEach(() => {
      const plugin = {
        id: 'toggle-plugin',
        name: 'Toggle Plugin',
        version: '1.0.0',
        type: 'slash',
        enabled: true,
        trigger_command: 'toggle',
        compiled: 'console.log("toggle");',
      };
      pluginManager.register(plugin);
    });

    it('should disable an enabled plugin', async () => {
      const result = await pluginManager.disablePlugin('toggle-plugin');
      assert.strictEqual(result, true);
      
      const plugin = pluginManager.plugins.get('toggle-plugin');
      assert.strictEqual(plugin.enabled, false);
    });

    it('should enable a disabled plugin', async () => {
      await pluginManager.disablePlugin('toggle-plugin');
      const result = await pluginManager.enablePlugin('toggle-plugin');
      assert.strictEqual(result, true);
      
      const plugin = pluginManager.plugins.get('toggle-plugin');
      assert.strictEqual(plugin.enabled, true);
    });

    it('should return false for non-existent plugin', async () => {
      const result = await pluginManager.enablePlugin('non-existent');
      assert.strictEqual(result, false);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', () => {
      const plugins = [
        {
          id: 'plugin1',
          name: 'Plugin 1',
          version: '1.0.0',
          type: 'slash',
          enabled: true,
          trigger_command: 'cmd1',
          compiled: 'console.log("1");',
        },
        {
          id: 'plugin2',
          name: 'Plugin 2',
          version: '1.0.0',
          type: 'text',
          enabled: false,
          trigger_command: 'cmd2',
          compiled: 'console.log("2");',
        },
        {
          id: 'plugin3',
          name: 'Plugin 3',
          version: '1.0.0',
          type: 'both',
          enabled: true,
          trigger_command: 'cmd3',
          compiled: 'console.log("3");',
        },
      ];

      plugins.forEach(p => pluginManager.register(p));

      const stats = pluginManager.getStatistics();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.enabled, 2);
      assert.strictEqual(stats.disabled, 1);
      assert.strictEqual(stats.byType.slash, 2); // plugin1 and plugin3
      assert.strictEqual(stats.byType.text, 2); // plugin2 and plugin3
    });

    it('should return zero statistics for empty manager', () => {
      const stats = pluginManager.getStatistics();
      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.enabled, 0);
      assert.strictEqual(stats.disabled, 0);
    });
  });
});

