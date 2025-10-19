/**
 * Unit Tests for nodeAnalyzer utility
 * Tests variable extraction from node graphs
 * @author fkndean_
 * @date 2025-10-14
 */

import { describe, it, expect } from 'vitest';
import { getAvailableVariables, formatVariableDisplay, getVariableNames } from '../src/utils/nodeAnalyzer.js';

describe('nodeAnalyzer', () => {
  describe('getAvailableVariables', () => {
    it('should return empty array when no previous nodes', () => {
      const nodes = [
        { id: 'trigger_1', type: 'trigger', data: { config: {} } }
      ];
      const edges = [];
      
      const result = getAvailableVariables('trigger_1', nodes, edges);
      expect(result.length).toBe(0);
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
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('username');
      expect(result[0].type).toBe('user_name');
      expect(result[0].source).toBe('Variable Node');
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
      expect(result.length).toBe(3); // responseVar, responseVar_status, responseVar_error
      expect(result.some(v => v.name === 'weatherData')).toBe(true);
      expect(result.some(v => v.name === 'weatherData_status')).toBe(true);
      expect(result.some(v => v.name === 'weatherData_error')).toBe(true);
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
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('sum');
      expect(result[0].type).toBe('number');
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
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('parsed');
      expect(result[0].type).toBe('object');
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
      expect(result.length).toBe(2);
      expect(result.some(v => v.name === 'user')).toBe(true);
      expect(result.some(v => v.name === 'count')).toBe(true);
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
      expect(result.length).toBeGreaterThan(0); // Should not crash
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
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('myEmbed');
      expect(result[0].type).toBe('embed');
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
      expect(result).toBe('username (user_name from Variable Node)');
    });

    it('should handle all fields correctly', () => {
      const variable = {
        name: 'temp',
        type: 'number',
        source: 'JSON'
      };
      
      const result = formatVariableDisplay(variable);
      expect(result.includes('temp')).toBe(true);
      expect(result.includes('number')).toBe(true);
      expect(result.includes('JSON')).toBe(true);
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
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result.includes('a')).toBe(true);
      expect(result.includes('b')).toBe(true);
    });
  });
});

