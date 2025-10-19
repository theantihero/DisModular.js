/**
 * Serialization Utilities Tests
 * @author fkndean_
 * @date 2025-01-27
 */

import { describe, it, expect } from 'vitest';
import { safeStringify, safeParse, safeClone, serializeState } from '../utils/serialization.js';

describe('Serialization Utilities', () => {
  describe('safeStringify', () => {
    it('should handle simple objects', () => {
      const obj = { name: 'test', value: 42 };
      const result = safeStringify(obj);
      expect(result).toBe('{"name":"test","value":42}');
    });

    it('should handle circular references', () => {
      const obj = { name: 'test' };
      obj.self = obj;
      
      const result = safeStringify(obj);
      const parsed = JSON.parse(result);
      
      expect(parsed.name).toBe('test');
      expect(parsed.self).toBe('[Circular Reference]');
    });

    it('should handle complex circular references', () => {
      const obj1 = { name: 'obj1' };
      const obj2 = { name: 'obj2' };
      const obj3 = { name: 'obj3' };
      
      obj1.ref = obj2;
      obj2.ref = obj3;
      obj3.ref = obj1;
      
      const result = safeStringify(obj1);
      const parsed = JSON.parse(result);
      
      expect(parsed.name).toBe('obj1');
      expect(parsed.ref.name).toBe('obj2');
      expect(parsed.ref.ref.name).toBe('obj3');
      expect(parsed.ref.ref.ref).toBe('[Circular Reference]');
    });

    it('should handle special object types', () => {
      const obj = {
        date: new Date('2025-01-27T10:00:00Z'),
        regex: /test/gi,
        error: new Error('Test error'),
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3]),
      };
      
      const result = safeStringify(obj);
      const parsed = JSON.parse(result);
      
      expect(parsed.date).toBe('2025-01-27T10:00:00.000Z');
      expect(parsed.regex).toEqual({
        source: 'test',
        flags: 'gi',
      });
      expect(parsed.error).toEqual({
        message: 'Test error',
        name: 'Error',
      });
      expect(parsed.map).toEqual({
        key: 'value',
      });
      expect(parsed.set).toEqual([1, 2, 3]);
    });

    it('should respect max depth limit', () => {
      const obj = { level: 0 };
      let current = obj;
      
      for (let i = 1; i < 15; i++) {
        current.next = { level: i };
        current = current.next;
      }
      
      const result = safeStringify(obj, { maxDepth: 5 });
      const parsed = JSON.parse(result);
      
      let level = parsed;
      for (let i = 0; i < 4; i++) {
        expect(level.level).toBe(i);
        level = level.next;
      }
      expect(level.next).toBe('[Max Depth Reached]');
    });

    it('should handle null and undefined', () => {
      expect(safeStringify(null)).toBe('null');
      expect(safeStringify(undefined)).toBe('undefined');
    });

    it('should handle functions and promises', () => {
      const obj = {
        func: () => 'test',
        promise: Promise.resolve('test'),
        data: 'valid',
      };
      
      const result = safeStringify(obj);
      const parsed = JSON.parse(result);
      
      expect(parsed.func).toBeNull();
      expect(parsed.promise).toBeNull();
      expect(parsed.data).toBe('valid');
    });
  });

  describe('safeParse', () => {
    it('should parse valid JSON', () => {
      const obj = { name: 'test', value: 42 };
      const json = JSON.stringify(obj);
      const result = safeParse(json);
      
      expect(result).toEqual(obj);
    });

    it('should return default value for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const result = safeParse(invalidJson, { default: true });
      
      expect(result).toEqual({ default: true });
    });

    it('should return null by default for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const result = safeParse(invalidJson);
      
      expect(result).toBeNull();
    });
  });

  describe('safeClone', () => {
    it('should clone simple objects', () => {
      const obj = { name: 'test', value: 42 };
      const cloned = safeClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it('should handle circular references', () => {
      const obj = { name: 'test' };
      obj.self = obj;
      
      const cloned = safeClone(obj);
      
      expect(cloned.name).toBe('test');
      expect(cloned.self).toBe('[Circular Reference]');
      expect(cloned).not.toBe(obj);
    });

    it('should clone special object types', () => {
      const original = {
        date: new Date('2025-01-27T10:00:00Z'),
        regex: /test/gi,
        error: new Error('Test error'),
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3]),
      };
      
      const cloned = safeClone(original);
      
      expect(cloned.date).toEqual(original.date);
      expect(cloned.regex).toEqual(original.regex);
      expect(cloned.error.message).toBe(original.error.message);
      expect(cloned.map).toEqual(original.map);
      expect(cloned.set).toEqual(original.set);
      
      // Ensure they are different instances
      expect(cloned.date).not.toBe(original.date);
      expect(cloned.regex).not.toBe(original.regex);
      expect(cloned.error).not.toBe(original.error);
      expect(cloned.map).not.toBe(original.map);
      expect(cloned.set).not.toBe(original.set);
    });

    it('should respect max depth limit', () => {
      const obj = { level: 0 };
      let current = obj;
      
      for (let i = 1; i < 15; i++) {
        current.next = { level: i };
        current = current.next;
      }
      
      const cloned = safeClone(obj, { maxDepth: 5 });
      
      let level = cloned;
      for (let i = 0; i < 4; i++) {
        expect(level.level).toBe(i);
        level = level.next;
      }
      expect(level.next).toBe('[Max Depth Reached]');
    });
  });

  describe('serializeState', () => {
    it('should serialize simple state', () => {
      const state = { variables: { count: 5 }, settings: { theme: 'dark' } };
      const result = serializeState(state);
      
      expect(result).toEqual(state);
    });

    it('should handle circular references in state', () => {
      const state = {
        variables: { count: 5 },
        circular: {},
      };
      state.circular.self = state.circular;
      
      const result = serializeState(state);
      
      expect(result.variables.count).toBe(5);
      expect(result.circular.self).toBe('[Circular Reference]');
    });

    it('should handle null and undefined state', () => {
      expect(serializeState(null)).toEqual({});
      expect(serializeState(undefined)).toEqual({});
    });

    it('should handle complex state with special types', () => {
      const state = {
        variables: {
          date: new Date('2025-01-27T10:00:00Z'),
          regex: /test/gi,
          error: new Error('Test error'),
        },
        settings: {
          enabled: true,
          options: ['option1', 'option2'],
        },
      };
      
      const result = serializeState(state);
      
      expect(result.variables.date).toBe('2025-01-27T10:00:00.000Z');
      expect(result.variables.regex).toEqual({
        source: 'test',
        flags: 'gi',
      });
      expect(result.variables.error).toEqual({
        message: 'Test error',
        name: 'Error',
      });
      expect(result.settings.enabled).toBe(true);
      expect(result.settings.options).toEqual(['option1', 'option2']);
    });
  });
});
