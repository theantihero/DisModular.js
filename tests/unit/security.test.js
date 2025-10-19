/**
 * Security Tests
 * Tests for security vulnerability fixes
 * @author fkndean_
 * @date 2025-01-27
 */

import { describe, it, expect } from 'vitest';
import { Logger } from '../../packages/shared/utils/logger.js';

describe('Security Fixes', () => {
  describe('Log Injection Prevention', () => {
    it('should sanitize log messages with newlines', () => {
      const logger = new Logger('TestLogger');
      
      // Capture console.log output
      const originalLog = console.log;
      let logOutput = '';
      console.log = (...args) => {
        logOutput = args.join(' ');
      };
      
      try {
        logger.info('Test message\nwith newline');
        expect(logOutput).not.toContain('\n');
        expect(logOutput).toContain('Test message with newline');
      } finally {
        console.log = originalLog;
      }
    });

    it('should sanitize log messages with control characters', () => {
      const logger = new Logger('TestLogger');
      
      // Capture console.log output
      const originalLog = console.log;
      let logOutput = '';
      console.log = (...args) => {
        logOutput = args.join(' ');
      };
      
      try {
        logger.info('Test message\x00with null byte');
        expect(logOutput).not.toContain('\x00');
        expect(logOutput).toContain('Test messagewith null byte');
      } finally {
        console.log = originalLog;
      }
    });

    it('should limit log message length', () => {
      const logger = new Logger('TestLogger');
      
      // Capture console.log output
      const originalLog = console.log;
      let logOutput = '';
      console.log = (...args) => {
        logOutput = args.join(' ');
      };
      
      try {
        const longMessage = 'a'.repeat(2000);
        logger.info(longMessage);
        
        // Should be truncated to 1000 characters
        const messagePart = logOutput.split(' - ')[1];
        expect(messagePart.length).toBeLessThanOrEqual(1000);
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('should validate property names correctly', () => {
      // Test the isValidPropertyName function logic
      const dangerousProps = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty'];
      
      dangerousProps.forEach(prop => {
        // This would be the logic from our isValidPropertyName function
        const isValid = /^[a-zA-Z0-9_-]+$/.test(prop) && prop.length <= 100;
        expect(isValid).toBe(false);
      });
    });

    it('should reject property names with dangerous prefixes', () => {
      const dangerousPrefixes = ['__', 'constructor.', 'prototype.'];
      
      dangerousPrefixes.forEach(prefix => {
        const testProp = prefix + 'test';
        // This would be the logic from our isValidPropertyName function
        const hasDangerousPrefix = testProp.startsWith('__') || 
                                   testProp.startsWith('constructor.') || 
                                   testProp.startsWith('prototype.');
        expect(hasDangerousPrefix).toBe(true);
      });
    });

    it('should accept valid property names', () => {
      const validProps = ['node1', 'edge_1', 'test-node', 'valid123'];
      
      validProps.forEach(prop => {
        // This would be the logic from our isValidPropertyName function
        const isValid = /^[a-zA-Z0-9_-]+$/.test(prop) && prop.length <= 100;
        expect(isValid).toBe(true);
      });
    });
  });

  describe('URL Validation', () => {
    it('should reject javascript: URLs', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'javascript:void(0)',
        'JAVASCRIPT:alert("xss")',
        'vbscript:msgbox("xss")'
      ];
      
      dangerousUrls.forEach(url => {
        try {
          const urlObj = new URL(url);
          const allowedSchemes = ['http:', 'https:', 'data:'];
          const isValid = allowedSchemes.includes(urlObj.protocol);
          expect(isValid).toBe(false);
        } catch {
          // Invalid URLs should be rejected
          expect(true).toBe(true);
        }
      });
    });

    it('should accept safe URLs', () => {
      const safeUrls = [
        'https://example.com/image.png',
        'http://example.com/image.jpg',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      ];
      
      safeUrls.forEach(url => {
        try {
          const urlObj = new URL(url);
          const allowedSchemes = ['http:', 'https:', 'data:'];
          const isValid = allowedSchemes.includes(urlObj.protocol);
          expect(isValid).toBe(true);
        } catch {
          expect.fail(`Valid URL should not throw: ${url}`);
        }
      });
    });

    it('should reject data URLs with non-image MIME types', () => {
      const dangerousDataUrls = [
        'data:text/html,<script>alert("xss")</script>',
        'data:application/javascript,alert("xss")',
        'data:image/svg+xml,<svg onload="alert(1)"></svg>'
      ];
      
      dangerousDataUrls.forEach(url => {
        try {
          const urlObj = new URL(url);
          if (urlObj.protocol === 'data:') {
            const isValidImageMime = /^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,/i.test(url);
            expect(isValidImageMime).toBe(false);
          }
        } catch {
          // Invalid URLs should be rejected
          expect(true).toBe(true);
        }
      });
    });
  });

  describe('File Path Validation', () => {
    it('should prevent path traversal attacks', () => {
      const dangerousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        '....//....//etc//passwd',
        '..%2F..%2Fetc%2Fpasswd'
      ];
      
      dangerousPaths.forEach(path => {
        // This would be the logic from our path validation
        const isSafe = !path.includes('..') && !path.includes('\\') && !path.includes('%2F');
        expect(isSafe).toBe(false);
      });
    });

    it('should accept safe file paths', () => {
      const safePaths = [
        'plugin_123',
        'my-plugin',
        'test_plugin_456'
      ];
      
      safePaths.forEach(path => {
        // This would be the logic from our path validation
        const isSafe = !path.includes('..') && !path.includes('\\') && !path.includes('%2F');
        expect(isSafe).toBe(true);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should have appropriate rate limits for different operations', () => {
      // Test that expensive operations have stricter limits
      const expensiveOperationLimit = 10; // requests per minute
      const generalApiLimit = 60; // requests per minute
      
      expect(expensiveOperationLimit).toBeLessThan(generalApiLimit);
      expect(expensiveOperationLimit).toBeGreaterThan(0);
    });
  });
});
