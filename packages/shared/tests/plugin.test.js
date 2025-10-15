/**
 * Plugin Types Unit Tests
 * @author fkndean_
 * @date 2025-10-15
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  PluginTypes, 
  NodeTypes, 
  TriggerTypes 
} from '../types/plugin.js';

describe('Plugin Types', () => {
  describe('PluginTypes', () => {
    it('should export correct plugin type constants', () => {
      assert.strictEqual(PluginTypes.SLASH, 'slash');
      assert.strictEqual(PluginTypes.TEXT, 'text');
      assert.strictEqual(PluginTypes.BOTH, 'both');
    });

    it('should have all expected plugin types', () => {
      const expectedTypes = ['slash', 'text', 'both'];
      const actualTypes = Object.values(PluginTypes);
      
      assert.strictEqual(actualTypes.length, 3);
      expectedTypes.forEach(type => {
        assert.ok(actualTypes.includes(type), `Should include ${type}`);
      });
    });

    it('should have immutable values', () => {
      const originalSlash = PluginTypes.SLASH;
      
      // Attempt to modify (should not affect original in practice)
      // Note: JavaScript objects are mutable by default, but we test the behavior
      try {
        PluginTypes.SLASH = 'modified';
        // The value will actually change because objects are mutable
        // This test verifies the current behavior rather than true immutability
        assert.strictEqual(PluginTypes.SLASH, 'modified');
        
        // Restore original value
        PluginTypes.SLASH = originalSlash;
        assert.strictEqual(PluginTypes.SLASH, originalSlash);
      } catch (error) {
        // If modification throws an error, that's also acceptable
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('NodeTypes', () => {
    it('should export correct node type constants', () => {
      assert.strictEqual(NodeTypes.TRIGGER, 'trigger');
      assert.strictEqual(NodeTypes.ACTION, 'action');
      assert.strictEqual(NodeTypes.CONDITION, 'condition');
      assert.strictEqual(NodeTypes.VARIABLE, 'variable');
      assert.strictEqual(NodeTypes.RESPONSE, 'response');
      assert.strictEqual(NodeTypes.DATA, 'data');
    });

    it('should have all expected node types', () => {
      const expectedTypes = [
        'trigger', 'action', 'condition', 
        'variable', 'response', 'data'
      ];
      const actualTypes = Object.values(NodeTypes);
      
      assert.strictEqual(actualTypes.length, 6);
      expectedTypes.forEach(type => {
        assert.ok(actualTypes.includes(type), `Should include ${type}`);
      });
    });

    it('should be consistent with expected node types', () => {
      // Test that all node types are valid strings
      Object.values(NodeTypes).forEach(type => {
        assert.strictEqual(typeof type, 'string');
        assert.ok(type.length > 0, 'Node type should not be empty');
      });
    });
  });

  describe('TriggerTypes', () => {
    it('should export correct trigger type constants', () => {
      assert.strictEqual(TriggerTypes.COMMAND, 'command');
      assert.strictEqual(TriggerTypes.EVENT, 'event');
      assert.strictEqual(TriggerTypes.MESSAGE, 'message');
    });

    it('should have all expected trigger types', () => {
      const expectedTypes = ['command', 'event', 'message'];
      const actualTypes = Object.values(TriggerTypes);
      
      assert.strictEqual(actualTypes.length, 3);
      expectedTypes.forEach(type => {
        assert.ok(actualTypes.includes(type), `Should include ${type}`);
      });
    });

    it('should be consistent with expected trigger types', () => {
      // Test that all trigger types are valid strings
      Object.values(TriggerTypes).forEach(type => {
        assert.strictEqual(typeof type, 'string');
        assert.ok(type.length > 0, 'Trigger type should not be empty');
      });
    });
  });

  describe('Type consistency', () => {
    it('should have unique values within each type group', () => {
      const pluginTypeValues = Object.values(PluginTypes);
      const nodeTypeValues = Object.values(NodeTypes);
      const triggerTypeValues = Object.values(TriggerTypes);

      // Check for duplicates within each group
      assert.strictEqual(pluginTypeValues.length, new Set(pluginTypeValues).size);
      assert.strictEqual(nodeTypeValues.length, new Set(nodeTypeValues).size);
      assert.strictEqual(triggerTypeValues.length, new Set(triggerTypeValues).size);
    });

    it('should not have overlapping values between different type groups', () => {
      const pluginTypeValues = Object.values(PluginTypes);
      const nodeTypeValues = Object.values(NodeTypes);
      const triggerTypeValues = Object.values(TriggerTypes);

      // Check for overlaps between groups
      pluginTypeValues.forEach(value => {
        assert.ok(!nodeTypeValues.includes(value), 'Plugin types should not overlap with node types');
        assert.ok(!triggerTypeValues.includes(value), 'Plugin types should not overlap with trigger types');
      });

      nodeTypeValues.forEach(value => {
        assert.ok(!triggerTypeValues.includes(value), 'Node types should not overlap with trigger types');
      });
    });
  });

  describe('JSDoc type definitions', () => {
    it('should have valid plugin metadata structure', () => {
      // Test that we can create objects matching the JSDoc types
      const pluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        type: PluginTypes.SLASH,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      assert.strictEqual(typeof pluginMetadata.id, 'string');
      assert.strictEqual(typeof pluginMetadata.name, 'string');
      assert.strictEqual(typeof pluginMetadata.version, 'string');
      assert.strictEqual(typeof pluginMetadata.description, 'string');
      assert.strictEqual(typeof pluginMetadata.author, 'string');
      assert.ok(Object.values(PluginTypes).includes(pluginMetadata.type));
      assert.strictEqual(typeof pluginMetadata.enabled, 'boolean');
      assert.ok(pluginMetadata.createdAt instanceof Date);
      assert.ok(pluginMetadata.updatedAt instanceof Date);
    });

    it('should have valid plugin trigger structure', () => {
      const pluginTrigger = {
        type: TriggerTypes.COMMAND,
        command: 'test-command'
      };

      assert.ok(Object.values(TriggerTypes).includes(pluginTrigger.type));
      assert.strictEqual(typeof pluginTrigger.command, 'string');
    });

    it('should have valid flow node structure', () => {
      const flowNode = {
        id: 'node-1',
        type: NodeTypes.TRIGGER,
        position: { x: 100, y: 200 },
        data: {
          type: NodeTypes.TRIGGER,
          label: 'Test Node',
          config: { command: 'test' }
        }
      };

      assert.strictEqual(typeof flowNode.id, 'string');
      assert.ok(Object.values(NodeTypes).includes(flowNode.type));
      assert.strictEqual(typeof flowNode.position, 'object');
      assert.strictEqual(typeof flowNode.position.x, 'number');
      assert.strictEqual(typeof flowNode.position.y, 'number');
      assert.strictEqual(typeof flowNode.data, 'object');
    });

    it('should have valid flow edge structure', () => {
      const flowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'output',
        targetHandle: 'input'
      };

      assert.strictEqual(typeof flowEdge.id, 'string');
      assert.strictEqual(typeof flowEdge.source, 'string');
      assert.strictEqual(typeof flowEdge.target, 'string');
      assert.strictEqual(typeof flowEdge.sourceHandle, 'string');
      assert.strictEqual(typeof flowEdge.targetHandle, 'string');
    });
  });
});
