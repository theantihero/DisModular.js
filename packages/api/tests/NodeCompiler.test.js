/**
 * NodeCompiler Unit Tests
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

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NodeCompiler } from '../src/services/NodeCompiler.js';

describe('NodeCompiler', () => {
  const compiler = new NodeCompiler();

  describe('validate', () => {
    it('should accept valid node graph', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: { label: 'Trigger' } },
        { id: '2', type: 'response', data: { label: 'Response' } },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
      ];

      const result = compiler.validate(nodes, edges);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject graph without trigger node', () => {
      const nodes = [
        { id: '1', type: 'response', data: { label: 'Response' } },
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
        { id: '3', type: 'response', data: { label: 'Response' } },
      ];
      const edges = [];

      const result = compiler.validate(nodes, edges);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('one trigger')));
    });

    it('should reject graph without response node', () => {
      const nodes = [
        { id: '1', type: 'trigger', data: { label: 'Trigger' } },
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
        { id: '3', type: 'variable', data: { label: 'Orphan' } },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
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
          data: { label: 'Command', config: { command: 'test' } },
        },
        {
          id: '2',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Hello!' } },
        },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
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
          data: { label: 'Command' },
        },
        {
          id: '2',
          type: 'variable',
          data: {
            label: 'Get User',
            config: { name: 'username', type: 'user_name' },
          },
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Hi {username}!' } },
        },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
      ];

      const code = compiler.compile(nodes, edges);

      assert.ok(code.includes('variables[\'username\']'));
      assert.ok(code.includes('user?.username'));
    });

    it('should compile condition node with branches', () => {
      const nodes = [
        {
          id: '1',
          type: 'trigger',
          data: { label: 'Command' },
        },
        {
          id: '2',
          type: 'condition',
          data: {
            label: 'Check',
            config: { condition: 'true' },
          },
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'True Response', config: { message: 'True!' } },
        },
        {
          id: '4',
          type: 'response',
          data: { label: 'False Response', config: { message: 'False!' } },
        },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3', sourceHandle: 'true' },
        { id: 'e3', source: '2', target: '4', sourceHandle: 'false' },
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
          data: { label: 'Command' },
        },
        {
          id: '2',
          type: 'action',
          data: {
            label: 'Wait',
            config: { actionType: 'wait', duration: 1000 },
          },
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Done!' } },
        },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
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
          data: { label: 'Command' },
        },
        {
          id: '2',
          type: 'data',
          data: {
            label: 'Get Server',
            config: { dataType: 'server_name', name: 'server' },
          },
        },
        {
          id: '3',
          type: 'response',
          data: { label: 'Reply', config: { message: 'Server: {server}' } },
        },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
      ];

      const code = compiler.compile(nodes, edges);

      assert.ok(code.includes('variables[\'server\']'));
      assert.ok(code.includes('guild?.name'));
    });
  });

  describe('interpolateVariables', () => {
    it('should interpolate single variable', () => {
      const result = compiler.interpolateVariables('Hello {name}!');
      assert.ok(result.includes('variables[\'name\']'));
    });

    it('should interpolate multiple variables', () => {
      const result = compiler.interpolateVariables('Hello {first} {last}!');
      assert.ok(result.includes('variables[\'first\']'));
      assert.ok(result.includes('variables[\'last\']'));
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
        { id: '2', type: 'response', data: {} },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
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
        { id: '4', type: 'response', data: {} },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '1', target: '3' },
        { id: 'e3', source: '2', target: '4' },
        { id: 'e4', source: '3', target: '4' },
      ];

      const graph = compiler.buildExecutionGraph(nodes, edges);

      const node1 = graph.get('1');
      assert.strictEqual(node1.next.length, 2);

      const node4 = graph.get('4');
      assert.strictEqual(node4.previous.length, 2);
    });
  });

  describe('security - resource exhaustion prevention', () => {
    it('should handle deep nesting without resource exhaustion', () => {
      // Test getSafeIndent method with extreme values
      const testIndents = [-1, 0, 1, 25, 50, 100, 1000, Number.MAX_SAFE_INTEGER];
      
      for (const indent of testIndents) {
        const result = compiler.getSafeIndent(indent);
        
        // Should always return a string
        assert.strictEqual(typeof result, 'string');
        
        // Should never exceed 100 characters (50 * 2 spaces)
        assert.ok(result.length <= 100, `Indent ${indent} produced string of length ${result.length}`);
        
        // Should be multiples of 2 (since each level is 2 spaces)
        assert.strictEqual(result.length % 2, 0);
      }
    });

    it('should cap indentation at 50 levels', () => {
      const result50 = compiler.getSafeIndent(50);
      const result100 = compiler.getSafeIndent(100);
      const resultMax = compiler.getSafeIndent(Number.MAX_SAFE_INTEGER);
      
      // All should produce the same result (50 levels = 100 characters)
      assert.strictEqual(result50.length, 100);
      assert.strictEqual(result100.length, 100);
      assert.strictEqual(resultMax.length, 100);
      assert.strictEqual(result50, result100);
      assert.strictEqual(result100, resultMax);
    });

    it('should handle negative indentation gracefully', () => {
      const result = compiler.getSafeIndent(-100);
      assert.strictEqual(result, ''); // Should be empty string (0 levels)
    });

    it('should compile code with deep nesting safely', () => {
      // Create a deeply nested condition structure
      const nodes = [];
      const edges = [];
      
      // Start with trigger
      nodes.push({ id: 'trigger', type: 'trigger', data: { label: 'Start' } });
      
      // Create 55 levels of nested conditions (more than the 50 limit)
      for (let i = 0; i < 55; i++) {
        const nodeId = `condition_${i}`;
        
        nodes.push({
          id: nodeId,
          type: 'condition',
          data: { label: `Condition ${i}`, config: { condition: 'true' } },
        });
        
        if (i === 0) {
          edges.push({ id: `e_${i}`, source: 'trigger', target: nodeId });
        } else {
          edges.push({ 
            id: `e_${i}`, 
            source: `condition_${i - 1}`, 
            target: nodeId, 
            sourceHandle: 'true',
          });
        }
        
        if (i === 54) {
          // Add response at the end
          nodes.push({ 
            id: 'response', 
            type: 'response', 
            data: { label: 'Final Response', config: { message: 'Deep nesting complete!' } },
          });
          edges.push({ 
            id: 'e_final', 
            source: nodeId, 
            target: 'response', 
            sourceHandle: 'true',
          });
        }
      }
      
      // This should compile without throwing or causing resource exhaustion
      const code = compiler.compile(nodes, edges);
      
      assert.ok(code.includes('async function execute'));
      assert.ok(code.includes('Deep nesting complete!'));
      
      // Verify the code doesn't have excessive indentation (should cap at 50 levels)
      const lines = code.split('\n');
      const maxIndentLength = Math.max(...lines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      }));
      
      // Should not exceed 100 characters of indentation (50 levels * 2 spaces)
      assert.ok(maxIndentLength <= 100, `Maximum indentation was ${maxIndentLength} characters`);
    });
  });
});

