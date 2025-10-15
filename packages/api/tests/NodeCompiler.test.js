/**
 * NodeCompiler Unit Tests
 * @author fkndean_
 * @date 2025-10-14
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NodeCompiler } from '../src/services/NodeCompiler.js';

describe('NodeCompiler', () => {
  const compiler = new NodeCompiler();

  describe('validate', () => {
    it('should accept valid node graph', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: { label: 'Trigger' } },
        { id: '2', type: 'response', data: { label: 'Response' } }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' }
      ];

      const result = compiler.validate(nodes, edges);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject graph without trigger node', () => {
      const nodes = [
        { id: '1', type: 'response', data: { label: 'Response' } }
      ];
      const edges = [];

      const result = compiler.validate(nodes, edges);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('trigger')));
    });

    it('should reject graph with multiple trigger nodes', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: { label: 'Trigger 1' } },
        { id: '2', type: 'trigger', data: { label: 'Trigger 2' } },
        { id: '3', type: 'response', data: { label: 'Response' } }
      ];
      const edges = [];

      const result = compiler.validate(nodes, edges);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('one trigger')));
    });

    it('should reject graph without response node', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: { label: 'Trigger' } }
      ];
      const edges = [];

      const result = compiler.validate(nodes, edges);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('response')));
    });

    it('should detect orphaned nodes', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: { label: 'Trigger' } },
        { id: '2', type: 'response', data: { label: 'Response' } },
        { id: '3', type: 'variable', data: { label: 'Orphan' } }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' }
      ];

      const result = compiler.validate(nodes, edges);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('not connected')));
    });
  });

  describe('compile', () => {
    it('should compile simple trigger-response flow', () => {
      const nodes = [
        {
          id: '1',
          type: 'trigger',
          data: { label: 'Command', config: { command: 'test' } }
        },
        {
          id: '2',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Hello!' } }
        }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' }
      ];

      const code = compiler.compile(nodes, edges);

      assert.ok(code.includes('async function execute'));
      assert.ok(code.includes('__resolve'));
      assert.ok(code.includes('Hello!'));
    });

    it('should compile variable node', () => {
      const nodes = [
        {
          id: '1',
          type: 'trigger',
          data: { label: 'Command' }
        },
        {
          id: '2',
          type: 'variable',
          data: {
            label: 'Get User',
            config: { name: 'username', type: 'user_name' }
          }
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Hi {username}!' } }
        }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' }
      ];

      const code = compiler.compile(nodes, edges);

      assert.ok(code.includes("variables['username']"));
      assert.ok(code.includes('user?.username'));
    });

    it('should compile condition node with branches', () => {
      const nodes = [
        {
          id: '1',
          type: 'trigger',
          data: { label: 'Command' }
        },
        {
          id: '2',
          type: 'condition',
          data: {
            label: 'Check',
            config: { condition: 'true' }
          }
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'True Response', config: { message: 'True!' } }
        },
        {
          id: '4',
          type: 'response',
          data: { label: 'False Response', config: { message: 'False!' } }
        }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3', sourceHandle: 'true' },
        { id: 'e3', source: '2', target: '4', sourceHandle: 'false' }
      ];

      const code = compiler.compile(nodes, edges);

      assert.ok(code.includes('if ('));
      assert.ok(code.includes('} else {'));
      assert.ok(code.includes('True!'));
      assert.ok(code.includes('False!'));
    });

    it('should compile action node', () => {
      const nodes = [
        {
          id: '1',
          type: 'trigger',
          data: { label: 'Command' }
        },
        {
          id: '2',
          type: 'action',
          data: {
            label: 'Wait',
            config: { actionType: 'wait', duration: 1000 }
          }
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Done!' } }
        }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' }
      ];

      const code = compiler.compile(nodes, edges);

      assert.ok(code.includes('setTimeout'));
      assert.ok(code.includes('1000'));
    });

    it('should compile data node', () => {
      const nodes = [
        {
          id: '1',
          type: 'trigger',
          data: { label: 'Command' }
        },
        {
          id: '2',
          type: 'data',
          data: {
            label: 'Get Server',
            config: { dataType: 'server_name', name: 'server' }
          }
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Server: {server}' } }
        }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' }
      ];

      const code = compiler.compile(nodes, edges);

      assert.ok(code.includes("variables['server']"));
      assert.ok(code.includes('guild?.name'));
    });
  });

  describe('interpolateVariables', () => {
    it('should interpolate single variable', () => {
      const result = compiler.interpolateVariables('Hello {name}!');
      assert.ok(result.includes("variables['name']"));
    });

    it('should interpolate multiple variables', () => {
      const result = compiler.interpolateVariables('Hello {first} {last}!');
      assert.ok(result.includes("variables['first']"));
      assert.ok(result.includes("variables['last']"));
    });

    it('should not modify text without variables', () => {
      const result = compiler.interpolateVariables('Hello world!');
      assert.strictEqual(result, 'Hello world!');
    });
  });

  describe('buildExecutionGraph', () => {
    it('should build graph from nodes and edges', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: {} },
        { id: '2', type: 'response', data: {} }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' }
      ];

      const graph = compiler.buildExecutionGraph(nodes, edges);

      assert.strictEqual(graph.size, 2);
      assert.ok(graph.has('1'));
      assert.ok(graph.has('2'));

      const node1 = graph.get('1');
      assert.strictEqual(node1.next.length, 1);
      assert.strictEqual(node1.next[0].nodeId, '2');

      const node2 = graph.get('2');
      assert.strictEqual(node2.previous.length, 1);
      assert.strictEqual(node2.previous[0].nodeId, '1');
    });

    it('should handle multiple connections', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: {} },
        { id: '2', type: 'variable', data: {} },
        { id: '3', type: 'variable', data: {} },
        { id: '4', type: 'response', data: {} }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '1', target: '3' },
        { id: 'e3', source: '2', target: '4' },
        { id: 'e4', source: '3', target: '4' }
      ];

      const graph = compiler.buildExecutionGraph(nodes, edges);

      const node1 = graph.get('1');
      assert.strictEqual(node1.next.length, 2);

      const node4 = graph.get('4');
      assert.strictEqual(node4.previous.length, 2);
    });
  });
});

