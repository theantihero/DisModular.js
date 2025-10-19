/**
 * Serialization Fix Tests
 * Tests for the improved serialization handling to prevent AI server errors
 * @author fkndean_
 * @date 2025-01-27
 */

import { describe, it, expect } from 'vitest';
import { safeStringify, validateSerialization } from '../utils/serialization.js';

describe('Serialization Fix Tests', () => {
  describe('Discord.js Object Handling', () => {
    it('should handle Discord.js Client objects safely', () => {
      const mockClient = {
        constructor: { name: 'Client' },
        user: { id: '123' },
        guilds: new Map(),
      };

      const result = safeStringify(mockClient);
      const parsed = JSON.parse(result);
      
      // Should replace Discord.js objects with null
      expect(parsed.constructor).toBeNull();
      expect(parsed.user).toBeNull();
      expect(parsed.guilds).toBeNull();
    });

    it('should handle Discord.js Guild objects safely', () => {
      const mockGuild = {
        constructor: { name: 'Guild' },
        id: '123',
        name: 'Test Guild',
        members: new Map(),
      };

      const result = safeStringify(mockGuild);
      const parsed = JSON.parse(result);
      
      // Should replace Discord.js objects with null
      expect(parsed.constructor).toBeNull();
      expect(parsed.members).toBeNull();
    });

    it('should handle Discord.js Interaction objects safely', () => {
      const mockInteraction = {
        constructor: { name: 'ChatInputCommandInteraction' },
        id: '123',
        commandName: 'test',
        user: {
          constructor: { name: 'User' },
          id: '456',
          username: 'testuser',
        },
      };

      const result = safeStringify(mockInteraction);
      const parsed = JSON.parse(result);
      
      // Should replace Discord.js objects with null
      expect(parsed.constructor).toBeNull();
      expect(parsed.user).toBeNull();
    });
  });

  describe('Circular Reference Handling', () => {
    it('should handle circular references in complex objects', () => {
      const obj = { name: 'test' };
      obj.self = obj; // Create circular reference

      const result = safeStringify(obj);
      const parsed = JSON.parse(result);
      
      expect(parsed.name).toBe('test');
      expect(parsed.self).toBe('[Circular Reference]');
    });

    it('should handle nested circular references', () => {
      const obj = {
        level1: {
          level2: {
            level3: {},
          },
        },
      };
      obj.level1.level2.level3.parent = obj.level1;

      const result = safeStringify(obj);
      const parsed = JSON.parse(result);
      
      expect(parsed.level1.level2.level3.parent).toBe('[Circular Reference]');
    });
  });

  describe('DOM and Browser Object Handling', () => {
    it('should handle DOM elements safely', () => {
      const mockElement = {
        nodeType: 1,
        tagName: 'DIV',
        innerHTML: 'test',
      };

      const result = safeStringify(mockElement);
      const parsed = JSON.parse(result);
      
      // Should replace DOM elements with null
      expect(parsed).toBeNull();
    });

    it('should handle Event objects safely', () => {
      const mockEvent = {
        type: 'click',
        target: {},
        preventDefault: () => {},
      };

      const result = safeStringify(mockEvent);
      const parsed = JSON.parse(result);
      
      // Should replace Event objects with null
      expect(parsed).toBeNull();
    });

    it('should handle WebSocket objects safely', () => {
      const mockWebSocket = {
        readyState: 1,
        url: 'ws://localhost:3000',
        send: () => {},
      };

      const result = safeStringify(mockWebSocket);
      const parsed = JSON.parse(result);
      
      // Should replace WebSocket objects with null
      expect(parsed).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate Discord.js objects correctly', () => {
      const mockContext = {
        interaction: {
          constructor: { name: 'ChatInputCommandInteraction' },
          id: '123',
          user: {
            constructor: { name: 'User' },
            id: '456',
          },
        },
        client: {
          constructor: { name: 'Client' },
          user: { id: '789' },
        },
      };

      const validation = validateSerialization(mockContext);
      
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues.some(issue => issue.type === 'function')).toBe(true);
    });

    it('should validate circular references correctly', () => {
      const obj = { name: 'test' };
      obj.self = obj;

      const validation = validateSerialization(obj);
      
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.type === 'circular_reference')).toBe(true);
    });
  });

  describe('Safe Context Serialization', () => {
    it('should serialize safe context without errors', () => {
      const safeContext = {
        interaction: {
          id: '123',
          commandName: 'test',
          user: {
            id: '456',
            username: 'testuser',
            tag: 'testuser#1234',
          },
          guild: {
            id: '789',
            name: 'Test Guild',
          },
          channel: {
            id: '101112',
            name: 'general',
          },
        },
        guildId: '789',
        pluginId: 'plugin-1',
        pluginName: 'Test Plugin',
        state: {
          variables: { count: 5 },
          settings: { enabled: true },
        },
      };

      const result = safeStringify(safeContext);
      const parsed = JSON.parse(result);
      
      expect(parsed.interaction.id).toBe('123');
      expect(parsed.interaction.user.username).toBe('testuser');
      expect(parsed.guildId).toBe('789');
      expect(parsed.state.variables.count).toBe(5);
    });
  });
});
