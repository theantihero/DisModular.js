/**
 * Unit Tests for NodeCompiler JSON functionality
 * Tests JSON path parsing and extraction
 * @author fkndean_
 * @date 2025-10-14
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NodeCompiler } from '../src/services/NodeCompiler.js';

describe('NodeCompiler - JSON Operations', () => {
  const compiler = new NodeCompiler();

  describe('parseJSONPath', () => {
    it('should parse simple dot notation', () => {
      const result = compiler.parseJSONPath('data.temperature');
      assert.strictEqual(result.length, 2);
      assert.deepStrictEqual(result[0], { type: 'property', value: 'data' });
      assert.deepStrictEqual(result[1], { type: 'property', value: 'temperature' });
    });

    it('should parse nested dot notation', () => {
      const result = compiler.parseJSONPath('current.weather.temp');
      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result[0], { type: 'property', value: 'current' });
      assert.deepStrictEqual(result[1], { type: 'property', value: 'weather' });
      assert.deepStrictEqual(result[2], { type: 'property', value: 'temp' });
    });

    it('should parse array index notation', () => {
      const result = compiler.parseJSONPath('items[0]');
      assert.strictEqual(result.length, 2);
      assert.deepStrictEqual(result[0], { type: 'property', value: 'items' });
      assert.deepStrictEqual(result[1], { type: 'index', value: '0' });
    });

    it('should parse mixed notation', () => {
      const result = compiler.parseJSONPath('data.items[0].name');
      assert.strictEqual(result.length, 4);
      assert.deepStrictEqual(result[0], { type: 'property', value: 'data' });
      assert.deepStrictEqual(result[1], { type: 'property', value: 'items' });
      assert.deepStrictEqual(result[2], { type: 'index', value: '0' });
      assert.deepStrictEqual(result[3], { type: 'property', value: 'name' });
    });

    it('should parse bracket string notation', () => {
      const result = compiler.parseJSONPath('data["key-with-dash"]');
      assert.strictEqual(result.length, 2);
      assert.deepStrictEqual(result[0], { type: 'property', value: 'data' });
      assert.deepStrictEqual(result[1], { type: 'property', value: 'key-with-dash' });
    });

    it('should handle complex paths', () => {
      const result = compiler.parseJSONPath('response.data.users[0].profile.settings["notification-prefs"]');
      assert.ok(result.length >= 7);
      assert.deepStrictEqual(result[0], { type: 'property', value: 'response' });
      assert.deepStrictEqual(result[6], { type: 'property', value: 'notification-prefs' });
    });

    it('should handle empty path', () => {
      const result = compiler.parseJSONPath('');
      assert.strictEqual(result.length, 0);
    });
  });

  describe('generateJSONCode - extract operation', () => {
    it('should generate code for simple path extraction', () => {
      const node = {
        type: 'json',
        data: {
          config: {
            operation: 'extract',
            path: 'data.temp',
            inputVar: 'response',
            outputVar: 'temperature'
          }
        }
      };

      const codeLines = [];
      compiler.generateJSONCode(node, codeLines, '  ');

      const code = codeLines.join('\n');
      assert.ok(code.includes('// JSON: extract'));
      assert.ok(code.includes("variables['response']"));
      assert.ok(code.includes("variables['temperature']"));
      assert.ok(code.includes('jsonExtractResult'));
      assert.ok(code.includes('try {'));
      assert.ok(code.includes('catch(e)'));
    });

    it('should generate safe navigation with optional chaining', () => {
      const node = {
        type: 'json',
        data: {
          config: {
            operation: 'extract',
            path: 'a.b.c',
            inputVar: 'data',
            outputVar: 'result'
          }
        }
      };

      const codeLines = [];
      compiler.generateJSONCode(node, codeLines, '  ');

      const code = codeLines.join('\n');
      // Should have optional chaining for each level
      assert.ok(code.includes("?.['")||code.includes('?.['));
    });

    it('should handle array index extraction', () => {
      const node = {
        type: 'json',
        data: {
          config: {
            operation: 'extract',
            path: 'items[0]',
            inputVar: 'data',
            outputVar: 'firstItem'
          }
        }
      };

      const codeLines = [];
      compiler.generateJSONCode(node, codeLines, '  ');

      const code = codeLines.join('\n');
      assert.ok(code.includes('[0]'));
      assert.ok(code.includes('firstItem'));
    });

    it('should generate error handling', () => {
      const node = {
        type: 'json',
        data: {
          config: {
            operation: 'extract',
            path: 'data.value',
            inputVar: 'source',
            outputVar: 'extracted'
          }
        }
      };

      const codeLines = [];
      compiler.generateJSONCode(node, codeLines, '  ');

      const code = codeLines.join('\n');
      assert.ok(code.includes('extracted_error'));
      assert.ok(code.includes('undefined'));
    });
  });

  describe('generateJSONCode - parse operation', () => {
    it('should generate JSON.parse code', () => {
      const node = {
        type: 'json',
        data: {
          config: {
            operation: 'parse',
            inputVar: 'jsonString',
            outputVar: 'parsed'
          }
        }
      };

      const codeLines = [];
      compiler.generateJSONCode(node, codeLines, '  ');

      const code = codeLines.join('\n');
      assert.ok(code.includes('JSON.parse'));
      assert.ok(code.includes("variables['jsonString']"));
      assert.ok(code.includes("variables['parsed']"));
    });
  });

  describe('generateJSONCode - stringify operation', () => {
    it('should generate JSON.stringify code', () => {
      const node = {
        type: 'json',
        data: {
          config: {
            operation: 'stringify',
            inputVar: 'object',
            outputVar: 'jsonString'
          }
        }
      };

      const codeLines = [];
      compiler.generateJSONCode(node, codeLines, '  ');

      const code = codeLines.join('\n');
      assert.ok(code.includes('JSON.stringify'));
      assert.ok(code.includes("variables['object']"));
      assert.ok(code.includes("variables['jsonString']"));
    });
  });

  describe('Full compilation with JSON extract', () => {
    it('should compile a plugin with JSON extraction', () => {
      const nodes = [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: { label: 'Start', config: {} }
        },
        {
          id: 'http_1',
          type: 'http_request',
          data: {
            label: 'Fetch API',
            config: {
              url: 'https://api.example.com/data',
              method: 'GET',
              responseVar: 'apiResponse'
            }
          }
        },
        {
          id: 'json_1',
          type: 'json',
          data: {
            label: 'Extract Temperature',
            config: {
              operation: 'extract',
              path: 'current.temperature',
              inputVar: 'apiResponse',
              outputVar: 'temp'
            }
          }
        },
        {
          id: 'response_1',
          type: 'response',
          data: {
            label: 'Send Result',
            config: { message: 'Temperature: {temp}°C' }
          }
        }
      ];

      const edges = [
        { id: 'e1', source: 'trigger_1', target: 'http_1' },
        { id: 'e2', source: 'http_1', target: 'json_1' },
        { id: 'e3', source: 'json_1', target: 'response_1' }
      ];

      const compiledCode = compiler.compile(nodes, edges);

      assert.ok(compiledCode.includes('fetch'));
      assert.ok(compiledCode.includes('// JSON: extract') || compiledCode.includes('JSON extract'));
      assert.ok(compiledCode.includes('current'));
      assert.ok(compiledCode.includes('temperature'));
      assert.ok(compiledCode.includes('Temperature:'));
      assert.ok(compiledCode.includes('temp'));
    });
  });
});

