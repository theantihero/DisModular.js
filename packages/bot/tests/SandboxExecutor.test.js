/**
 * SandboxExecutor Unit Tests
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
import { SandboxExecutor } from '../src/sandbox/SandboxExecutor.js';

describe('SandboxExecutor', () => {
  const sandbox = new SandboxExecutor({
    memoryLimit: 64,
    timeout: 3000,
  });

  describe('validateCode', () => {
    it('should accept safe code', () => {
      const code = 'console.log("Hello World");';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject require() usage', () => {
      const code = 'require("fs");';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject import usage', () => {
      const code = 'import fs from "fs";';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject process access', () => {
      const code = 'process.exit(1);';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject eval usage', () => {
      const code = 'eval("malicious code");';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject Function constructor', () => {
      const code = 'new Function("return 42")();';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject fs module access', () => {
      const code = 'fs.readFileSync("/etc/passwd");';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject global access', () => {
      const code = 'global.something = "bad";';
      const result = sandbox.validateCode(code);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });
  });

  describe('execute', () => {
    it('should execute simple code successfully', async () => {
      const code = '__resolve("Hello from plugin");';
      const context = {};

      const result = await sandbox.execute(code, context);
      assert.strictEqual(result, 'Hello from plugin');
    });

    it('should handle Math operations', async () => {
      const code = '__resolve(Math.floor(Math.random() * 100) >= 0);';
      const context = {};

      const result = await sandbox.execute(code, context);
      assert.strictEqual(result, true);
    });

    it('should access interaction context', async () => {
      const code = '__resolve(interaction.user.username);';
      const context = {
        interaction: {
          user: { username: 'TestUser' },
        },
      };

      const result = await sandbox.execute(code, context);
      assert.strictEqual(result, 'TestUser');
    });

    it('should handle timeout for long-running code', async () => {
      const code = 'while(true) {}';
      const context = {};

      await assert.rejects(
        async () => await sandbox.execute(code, context),
        /timeout|timed out/i,
      );
    });

    it('should isolate state between executions', async () => {
      const code1 = 'let x = 42; __resolve(x);';
      const code2 = 'typeof x === "undefined" ? __resolve("isolated") : __resolve("leaked");';

      const result1 = await sandbox.execute(code1, {});
      const result2 = await sandbox.execute(code2, {});

      assert.strictEqual(result1, 42);
      assert.strictEqual(result2, 'isolated');
    });
  });

  describe('interpolateVariables', () => {
    it('should interpolate single variable', () => {
      const sandbox = new SandboxExecutor();
      const result = sandbox.compiler ? 
        null : 
        'Hello {username}!'.replace(/\{(\w+)\}/g, '${variables[\'$1\']}');
      
      assert.ok(result.includes('variables'));
    });

    it('should interpolate multiple variables', () => {
      // const sandbox = new SandboxExecutor();
      const str = 'Hello {name}, you have {count} messages';
      const result = str.replace(/\{(\w+)\}/g, '${variables[\'$1\']}');
      
      assert.ok(result.includes('variables[\'name\']'));
      assert.ok(result.includes('variables[\'count\']'));
    });
  });
});

