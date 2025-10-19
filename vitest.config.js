import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    timeout: 30000,
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    setupFiles: ['./tests/setup.js'],
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ],
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json'
    },
    logLevel: 'info',
    env: {
      DATABASE_URL: 'file:./test.db',
      TEST_DATABASE_URL: 'file:./test.db',
      DISCORD_CLIENT_ID: 'test_client_id',
      DISCORD_CLIENT_SECRET: 'test_client_secret',
      DISCORD_CALLBACK_URL: 'http://localhost:3002/auth/discord/callback',
      SESSION_SECRET: 'test_session_secret',
      NODE_ENV: 'test'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        'build/**',
        '**/*.config.js',
        '**/*.config.ts'
      ]
    }
  }
});
