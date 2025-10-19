/**
 * Test Setup Configuration
 * @author fkndean_
 * @date 2025-10-18
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test database URL
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://dismodular:password@localhost:5432/dismodular_test';

// Global test configuration
global.testConfig = {
  databaseUrl: TEST_DATABASE_URL,
  timeout: 30000, // 30 seconds
  retries: 3
};

// Test database utilities
export class TestDatabase {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL
        }
      }
    });
  }

  /**
   * Setup test database
   */
  async setup() {
    try {
      // Run migrations
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        stdio: 'inherit'
      });

      // Generate Prisma client
      execSync('npx prisma generate', { stdio: 'inherit' });

      console.log('✅ Test database setup completed');
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  /**
   * Clean test database
   */
  async cleanup() {
    try {
      // Delete all data from tables
      await this.prisma.auditLog.deleteMany();
      await this.prisma.pluginState.deleteMany();
      await this.prisma.plugin.deleteMany();
      await this.prisma.botConfig.deleteMany();
      await this.prisma.user.deleteMany();

      console.log('✅ Test database cleaned');
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.prisma.$disconnect();
  }

  /**
   * Get Prisma client
   */
  getClient() {
    return this.prisma;
  }
}

// Test fixtures
export const testFixtures = {
  users: {
    admin: {
      discord_id: '189921902553202688',
      username: 'TestAdmin',
      discriminator: '0001',
      avatar: null,
      is_admin: true,
      admin_notes: 'Test admin user'
    },
    regular: {
      discord_id: '123456789012345678',
      username: 'TestUser',
      discriminator: '0002',
      avatar: null,
      is_admin: false,
      admin_notes: null
    }
  },
  plugins: {
    helloWorld: {
      name: 'Hello World Test',
      version: '1.0.0',
      description: 'Test hello world plugin',
      author: 'Test Author',
      type: 'command',
      enabled: true,
      trigger_type: 'command',
      trigger_command: 'hello',
      options: [],
      nodes: [
        {
          id: 'start',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { label: 'Hello Command' }
        }
      ],
      edges: [],
      compiled: 'module.exports = { name: "Hello World Test" };'
    }
  },
  botConfig: {
    prefix: '!',
    welcome_message: 'Welcome to test server!',
    auto_role: 'TestMember',
    log_channel: 'test-logs'
  }
};

// Test helpers
export const testHelpers = {
  /**
   * Create test user
   */
  async createTestUser(prisma, userData = testFixtures.users.regular) {
    return await prisma.user.create({
      data: userData
    });
  },

  /**
   * Create test plugin
   */
  async createTestPlugin(prisma, pluginData = testFixtures.plugins.helloWorld) {
    return await prisma.plugin.create({
      data: pluginData
    });
  },

  /**
   * Create test bot config
   */
  async createTestBotConfig(prisma, configData = testFixtures.botConfig) {
    const configs = [];
    for (const [key, value] of Object.entries(configData)) {
      configs.push(
        prisma.botConfig.create({
          data: { key, value }
        })
      );
    }
    return await Promise.all(configs);
  },

  /**
   * Wait for async operation
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Mock Discord profile
   */
  createMockDiscordProfile(overrides = {}) {
    return {
      id: '189921902553202688',
      username: 'TestUser',
      discriminator: '0001',
      avatar: null,
      ...overrides
    };
  }
};

export default TestDatabase;
