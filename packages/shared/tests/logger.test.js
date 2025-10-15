/**
 * Logger Unit Tests
 * @author fkndean_
 * @date 2025-10-15
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Logger } from '../utils/logger.js';

describe('Logger', () => {
  let logger;
  let originalConsoleLog;
  let originalConsoleWarn;
  let originalConsoleError;
  let originalNodeEnv;

  beforeEach(() => {
    // Store original console methods
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalNodeEnv = process.env.NODE_ENV;

    // Create new logger instance
    logger = new Logger('TestContext');
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('constructor', () => {
    it('should create logger with default context', () => {
      const defaultLogger = new Logger();
      assert.strictEqual(defaultLogger.context, 'App');
    });

    it('should create logger with custom context', () => {
      const customLogger = new Logger('CustomContext');
      assert.strictEqual(customLogger.context, 'CustomContext');
    });
  });

  describe('info', () => {
    it('should log info message with correct format', () => {
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.info('Test info message');

      assert.ok(loggedMessage.includes('[INFO]'));
      assert.ok(loggedMessage.includes('[TestContext]'));
      assert.ok(loggedMessage.includes('Test info message'));
      assert.ok(loggedMessage.includes('2025-')); // ISO timestamp
    });

    it('should log info message with additional arguments', () => {
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.info('Test message', { key: 'value' }, 123);

      assert.ok(loggedMessage.includes('Test message'));
      assert.ok(loggedMessage.includes('[object Object]'));
      assert.ok(loggedMessage.includes('123'));
    });
  });

  describe('success', () => {
    it('should log success message with correct format', () => {
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.success('Test success message');

      assert.ok(loggedMessage.includes('[SUCCESS]'));
      assert.ok(loggedMessage.includes('[TestContext]'));
      assert.ok(loggedMessage.includes('Test success message'));
    });
  });

  describe('warn', () => {
    it('should log warning message with correct format', () => {
      let loggedMessage = '';
      console.warn = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.warn('Test warning message');

      assert.ok(loggedMessage.includes('[WARN]'));
      assert.ok(loggedMessage.includes('[TestContext]'));
      assert.ok(loggedMessage.includes('Test warning message'));
    });
  });

  describe('error', () => {
    it('should log error message with correct format', () => {
      let loggedMessage = '';
      console.error = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.error('Test error message');

      assert.ok(loggedMessage.includes('[ERROR]'));
      assert.ok(loggedMessage.includes('[TestContext]'));
      assert.ok(loggedMessage.includes('Test error message'));
    });
  });

  describe('debug', () => {
    it('should log debug message in development mode', () => {
      process.env.NODE_ENV = 'development';
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.debug('Test debug message');

      assert.ok(loggedMessage.includes('[DEBUG]'));
      assert.ok(loggedMessage.includes('[TestContext]'));
      assert.ok(loggedMessage.includes('Test debug message'));
    });

    it('should not log debug message in production mode', () => {
      process.env.NODE_ENV = 'production';
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.debug('Test debug message');

      assert.strictEqual(loggedMessage, '');
    });

    it('should not log debug message when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.debug('Test debug message');

      assert.strictEqual(loggedMessage, '');
    });
  });

  describe('timestamp format', () => {
    it('should include valid ISO timestamp', () => {
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.info('Test message');

      // Check for ISO timestamp pattern (YYYY-MM-DDTHH:mm:ss.sssZ)
      const timestampMatch = loggedMessage.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
      assert.ok(timestampMatch, 'Should include valid ISO timestamp');
    });
  });

  describe('color codes', () => {
    it('should include color codes in output', () => {
      let loggedMessage = '';
      console.log = (...args) => {
        loggedMessage = args.join(' ');
      };

      logger.info('Test message');

      // Check for ANSI color codes
      assert.ok(loggedMessage.includes('\x1b['), 'Should include ANSI color codes');
    });
  });
});
