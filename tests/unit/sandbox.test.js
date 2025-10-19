/**
 * Sandbox State Serialization Tests
 * Tests the serializeState method to ensure proper handling of non-serializable values
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect } from 'vitest';
import { SandboxExecutor } from '../../packages/bot/src/sandbox/SandboxExecutor.js';

describe('SandboxExecutor State Serialization', () => {
  let sandboxExecutor;

  beforeEach(() => {
    sandboxExecutor = new SandboxExecutor();
  });

  describe('serializeState', () => {
    it('should handle empty state', () => {
      const result = sandboxExecutor.serializeState({});
      expect(result).toEqual({});
    });

    it('should handle null state', () => {
      const result = sandboxExecutor.serializeState(null);
      expect(result).toEqual({});
    });

    it('should handle undefined state', () => {
      const result = sandboxExecutor.serializeState(undefined);
      expect(result).toEqual({});
    });

    it('should serialize basic types', () => {
      const state = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' }
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result).toEqual(state);
    });

    it('should replace Promises with null', () => {
      const promise = Promise.resolve('test');
      const state = {
        data: 'test',
        promise: promise,
        nested: {
          anotherPromise: Promise.reject('error')
        }
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result.data).toBe('test');
      expect(result.promise).toBeNull();
      expect(result.nested.anotherPromise).toBeNull();
    });

    it('should replace functions with null', () => {
      const func = () => 'test';
      const state = {
        data: 'test',
        func: func,
        nested: {
          anotherFunc: function() { return 'test'; }
        }
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result.data).toBe('test');
      expect(result.func).toBeNull();
      expect(result.nested.anotherFunc).toBeNull();
    });

    it('should serialize Error objects', () => {
      const error = new Error('Test error');
      const state = {
        data: 'test',
        error: error
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result.data).toBe('test');
      expect(result.error).toEqual({
        message: 'Test error',
        name: 'Error'
      });
    });

    it('should serialize Date objects', () => {
      const date = new Date('2025-10-18T12:00:00Z');
      const state = {
        data: 'test',
        date: date
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result.data).toBe('test');
      expect(result.date).toBe('2025-10-18T12:00:00.000Z');
    });

    it('should serialize RegExp objects', () => {
      const regex = /test/gi;
      const state = {
        data: 'test',
        regex: regex
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result.data).toBe('test');
      expect(result.regex).toEqual({
        source: 'test',
        flags: 'gi'
      });
    });

    it('should serialize Map objects', () => {
      const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
      const state = {
        data: 'test',
        map: map
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result.data).toBe('test');
      expect(result.map).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should serialize Set objects', () => {
      const set = new Set(['value1', 'value2', 'value3']);
      const state = {
        data: 'test',
        set: set
      };

      const result = sandboxExecutor.serializeState(state);
      expect(result.data).toBe('test');
      expect(result.set).toEqual(['value1', 'value2', 'value3']);
    });

    it('should handle complex nested objects', () => {
      const state = {
        string: 'hello',
        number: 42,
        promise: Promise.resolve('test'),
        func: () => 'test',
        error: new Error('Test'),
        date: new Date('2025-10-18T12:00:00Z'),
        regex: /test/gi,
        map: new Map([['key', 'value']]),
        set: new Set(['value1', 'value2']),
        nested: {
          promise: Promise.resolve('nested'),
          func: function() { return 'nested'; },
          array: [1, 2, Promise.resolve('array')]
        }
      };

      const result = sandboxExecutor.serializeState(state);
      
      expect(result.string).toBe('hello');
      expect(result.number).toBe(42);
      expect(result.promise).toBeNull();
      expect(result.func).toBeNull();
      expect(result.error).toEqual({ message: 'Test', name: 'Error' });
      expect(result.date).toBe('2025-10-18T12:00:00.000Z');
      expect(result.regex).toEqual({ source: 'test', flags: 'gi' });
      expect(result.map).toEqual({ key: 'value' });
      expect(result.set).toEqual(['value1', 'value2']);
      expect(result.nested.promise).toBeNull();
      expect(result.nested.func).toBeNull();
      expect(result.nested.array).toEqual([1, 2, null]);
    });

    it('should handle circular references gracefully', () => {
      const state = {
        data: 'test'
      };
      state.self = state; // Create circular reference

      const result = sandboxExecutor.serializeState(state);
      // Circular reference should be replaced with marker instead of causing failure
      expect(result).toEqual({
        data: 'test',
        self: '[Circular Reference]'
      });
    });

    it('should return empty object on serialization error', () => {
      // Mock console.error to suppress expected error logging
      const originalError = console.error;
      console.error = () => {}; // Suppress error output for this test

      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = () => {
        throw new Error('Serialization failed');
      };

      const result = sandboxExecutor.serializeState({ data: 'test' });
      expect(result).toEqual({});

      // Restore original functions
      JSON.stringify = originalStringify;
      console.error = originalError;
    });

    it('should handle complex circular reference scenarios', () => {
      // Create a complex object with multiple circular references
      const obj1 = { name: 'obj1', data: { value: 1 } };
      const obj2 = { name: 'obj2', data: { value: 2 } };
      const obj3 = { name: 'obj3', data: { value: 3 } };
      
      // Create circular references
      obj1.ref = obj2;
      obj2.ref = obj3;
      obj3.ref = obj1; // Full circle
      
      // Add self-reference
      obj1.self = obj1;
      
      const state = {
        objects: [obj1, obj2, obj3],
        metadata: { count: 3 }
      };

      const result = sandboxExecutor.serializeState(state);
      
      // Should handle all circular references properly
      expect(result.metadata.count).toBe(3);
      expect(result.objects).toHaveLength(3);
      expect(result.objects[0].name).toBe('obj1');
      expect(result.objects[0].self).toBe('[Circular Reference]');
      expect(result.objects[0].ref.name).toBe('obj2');
      expect(result.objects[0].ref.ref.name).toBe('obj3');
      expect(result.objects[0].ref.ref.ref).toBe('[Circular Reference]');
    });

    it('should handle nested circular references in arrays', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      items[0].next = items[1];
      items[1].next = items[2];
      items[2].next = items[0]; // Circular reference
      
      const state = {
        items,
        total: items.length
      };

      const result = sandboxExecutor.serializeState(state);
      
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].next.id).toBe(2);
      expect(result.items[0].next.next.id).toBe(3);
      expect(result.items[0].next.next.next).toBe('[Circular Reference]');
    });

    it('should handle circular references with special object types', () => {
      const date = new Date();
      const regex = /test/gi;
      const error = new Error('Test error');
      
      const state = {
        date,
        regex,
        error,
        circular: {}
      };
      
      // Create circular reference
      state.circular.self = state.circular;
      state.circular.parent = state;

      const result = sandboxExecutor.serializeState(state);
      
      expect(result.date).toBe(date.toISOString());
      expect(result.regex).toEqual({
        source: 'test',
        flags: 'gi'
      });
      expect(result.error).toEqual({
        message: 'Test error',
        name: 'Error'
      });
      expect(result.circular.self).toBe('[Circular Reference]');
      expect(result.circular.parent).toBe('[Circular Reference]');
    });

    it('should respect max depth limit', () => {
      // Create a deeply nested object
      let deepObj = { level: 0 };
      let current = deepObj;
      
      for (let i = 1; i < 15; i++) {
        current.next = { level: i };
        current = current.next;
      }
      
      const state = { deep: deepObj };

      const result = sandboxExecutor.serializeState(state);
      
      // Should truncate at max depth (10)
      expect(result.deep.level).toBe(0);
      expect(result.deep.next.level).toBe(1);
      // The 10th level should be marked as max depth reached
      let level = result.deep;
      for (let i = 0; i < 9; i++) {
        level = level.next;
      }
      expect(level.next).toBe('[Max Depth Reached]');
    });
  });
});
