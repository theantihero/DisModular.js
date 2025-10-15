/**
 * Unit Tests for nodeAnalyzer utility
 * Tests variable extraction from node graphs
 * @author fkndean_
 * @date 2025-10-14
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getAvailableVariables, formatVariableDisplay, getVariableNames } from '../src/utils/nodeAnalyzer.js';

describe('nodeAnalyzer', () => {
  describe('getAvailableVariables', () => {
    it('should return empty array when no previous nodes', () => {
      const nodes = [
        { id: 'trigger_1', type: 'trigger', data: { config: {} } }
      ];
      const edges = [];
      
      const result = getAvailableVariables('trigger_1', nodes, edges);
      assert.strictEqual(result.length, 0);
    });

    it('should extract variables from connected variable nodes', () => {
      const nodes = [
        { id: 'var_1', type: 'variable', data: { config: { name: 'username', type: 'user_name' }, label: 'Get User' } },
        { id: 'response_1', type: 'response', data: { config: {} } }
      ];
      const edges = [
        { source: 'var_1', target: 'response_1' }
      ];
      
      const result = getAvailableVariables('response_1', nodes, edges);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'username');
      assert.strictEqual(result[0].type, 'user_name');
      assert.strictEqual(result[0].source, 'Variable Node');
    });

    it('should extract variables from HTTP request nodes', () => {
      const nodes = [
        { id: 'http_1', type: 'http_request', data: { config: { responseVar: 'weatherData' }, label: 'Fetch Weather' } },
        { id: 'json_1', type: 'json', data: { config: {} } }
      ];
      const edges = [
        { source: 'http_1', target: 'json_1' }
      ];
      
      const result = getAvailableVariables('json_1', nodes, edges);
      assert.strictEqual(result.length, 3); // responseVar, responseVar_status, responseVar_error
      assert.ok(result.some(v => v.name === 'weatherData'));
      assert.ok(result.some(v => v.name === 'weatherData_status'));
      assert.ok(result.some(v => v.name === 'weatherData_error'));
    });

    it('should extract variables from math operation nodes', () => {
      const nodes = [
        { id: 'math_1', type: 'math_operation', data: { config: { resultVar: 'sum' }, label: 'Add Numbers' } },
        { id: 'response_1', type: 'response', data: { config: {} } }
      ];
      const edges = [
        { source: 'math_1', target: 'response_1' }
      ];
      
      const result = getAvailableVariables('response_1', nodes, edges);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'sum');
      assert.strictEqual(result[0].type, 'number');
    });

    it('should extract variables from JSON nodes', () => {
      const nodes = [
        { id: 'json_1', type: 'json', data: { config: { outputVar: 'parsed', operation: 'parse' }, label: 'Parse JSON' } },
        { id: 'var_1', type: 'variable', data: { config: {} } }
      ];
      const edges = [
        { source: 'json_1', target: 'var_1' }
      ];
      
      const result = getAvailableVariables('var_1', nodes, edges);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'parsed');
      assert.strictEqual(result[0].type, 'object');
    });

    it('should traverse multiple connected nodes', () => {
      const nodes = [
        { id: 'trigger_1', type: 'trigger', data: { config: {} } },
        { id: 'var_1', type: 'variable', data: { config: { name: 'user', type: 'user_name' }, label: 'User' } },
        { id: 'var_2', type: 'variable', data: { config: { name: 'count', type: 'random_number' }, label: 'Count' } },
        { id: 'response_1', type: 'response', data: { config: {} } }
      ];
      const edges = [
        { source: 'trigger_1', target: 'var_1' },
        { source: 'var_1', target: 'var_2' },
        { source: 'var_2', target: 'response_1' }
      ];
      
      const result = getAvailableVariables('response_1', nodes, edges);
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(v => v.name === 'user'));
      assert.ok(result.some(v => v.name === 'count'));
    });

    it('should handle circular dependencies gracefully', () => {
      const nodes = [
        { id: 'var_1', type: 'variable', data: { config: { name: 'a', type: 'string', value: 'test' }, label: 'A' } },
        { id: 'var_2', type: 'variable', data: { config: { name: 'b', type: 'string', value: 'test' }, label: 'B' } }
      ];
      const edges = [
        { source: 'var_1', target: 'var_2' },
        { source: 'var_2', target: 'var_1' } // Circular
      ];
      
      const result = getAvailableVariables('var_2', nodes, edges);
      assert.ok(result.length > 0); // Should not crash
    });

    it('should extract variables from embed builder nodes', () => {
      const nodes = [
        { id: 'embed_1', type: 'embed_builder', data: { config: { embedVar: 'myEmbed' }, label: 'Build Embed' } },
        { id: 'embed_response_1', type: 'embed_response', data: { config: {} } }
      ];
      const edges = [
        { source: 'embed_1', target: 'embed_response_1' }
      ];
      
      const result = getAvailableVariables('embed_response_1', nodes, edges);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'myEmbed');
      assert.strictEqual(result[0].type, 'embed');
    });
  });

  describe('formatVariableDisplay', () => {
    it('should format variable for display', () => {
      const variable = {
        name: 'username',
        type: 'user_name',
        source: 'Variable Node'
      };
      
      const result = formatVariableDisplay(variable);
      assert.strictEqual(result, 'username (user_name from Variable Node)');
    });

    it('should handle all fields correctly', () => {
      const variable = {
        name: 'temp',
        type: 'number',
        source: 'JSON'
      };
      
      const result = formatVariableDisplay(variable);
      assert.ok(result.includes('temp'));
      assert.ok(result.includes('number'));
      assert.ok(result.includes('JSON'));
    });
  });

  describe('getVariableNames', () => {
    it('should return just the variable names', () => {
      const nodes = [
        { id: 'var_1', type: 'variable', data: { config: { name: 'a', type: 'string', value: '' }, label: 'A' } },
        { id: 'var_2', type: 'variable', data: { config: { name: 'b', type: 'string', value: '' }, label: 'B' } },
        { id: 'response_1', type: 'response', data: { config: {} } }
      ];
      const edges = [
        { source: 'var_1', target: 'response_1' },
        { source: 'var_2', target: 'response_1' }
      ];
      
      const result = getVariableNames('response_1', nodes, edges);
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 2);
      assert.ok(result.includes('a'));
      assert.ok(result.includes('b'));
    });
  });
});

