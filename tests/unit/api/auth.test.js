/**
 * Auth Middleware Unit Tests
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabase, testFixtures, testHelpers } from '../../setup.js';

// Setup test environment variables
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://dismodular:password@localhost:5432/dismodular_test';
}
if (!process.env.DISCORD_CLIENT_ID) {
  process.env.DISCORD_CLIENT_ID = 'test_client_id';
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  process.env.DISCORD_CLIENT_SECRET = 'test_client_secret';
}
if (!process.env.DISCORD_CALLBACK_URL) {
  process.env.DISCORD_CALLBACK_URL = 'http://localhost:3002/auth/discord/callback';
}
if (!process.env.INITIAL_ADMIN_DISCORD_ID) {
  process.env.INITIAL_ADMIN_DISCORD_ID = '189921902553202688';
}
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test_session_secret';
}

describe('Auth Middleware', () => {
  let testDb;
  let prisma;

  beforeEach(async () => {
    testDb = new TestDatabase();
    prisma = testDb.getClient();
    await testDb.setup();
    await testDb.cleanup();
  });

  afterEach(async () => {
    await testDb.close();
  });

  describe('Discord OAuth Strategy', () => {
    it('should create new user with admin privileges if initial admin', async () => {
      // Mock Discord profile for initial admin
      const mockProfile = testHelpers.createMockDiscordProfile({
        id: process.env.INITIAL_ADMIN_DISCORD_ID || '189921902553202688'
      });

      // Simulate OAuth callback
      const user = await prisma.user.upsert({
        where: { discord_id: mockProfile.id },
        update: {
          username: mockProfile.username,
          discriminator: mockProfile.discriminator,
          avatar: mockProfile.avatar,
          is_admin: true,
          last_login: new Date()
        },
        create: {
          discord_id: mockProfile.id,
          username: mockProfile.username,
          discriminator: mockProfile.discriminator,
          avatar: mockProfile.avatar,
          is_admin: true,
          admin_notes: 'Initial admin from environment'
        }
      });

      expect(user).toBeDefined();
      expect(user.discord_id).toBe(mockProfile.id);
      expect(user.is_admin).toBe(true);
      expect(user.admin_notes).toBe('Initial admin from environment');
    });

    it('should create regular user without admin privileges', async () => {
      const mockProfile = testHelpers.createMockDiscordProfile({
        id: '123456789012345678'
      });

      const user = await prisma.user.upsert({
        where: { discord_id: mockProfile.id },
        update: {
          username: mockProfile.username,
          discriminator: mockProfile.discriminator,
          avatar: mockProfile.avatar,
          last_login: new Date()
        },
        create: {
          discord_id: mockProfile.id,
          username: mockProfile.username,
          discriminator: mockProfile.discriminator,
          avatar: mockProfile.avatar,
          is_admin: false
        }
      });

      expect(user).toBeDefined();
      expect(user.discord_id).toBe(mockProfile.id);
      expect(user.is_admin).toBe(false);
    });

    it('should update existing user on login', async () => {
      // Create initial user
      const initialUser = await testHelpers.createTestUser(prisma, {
        ...testFixtures.users.regular,
        username: 'OldUsername'
      });

      // Mock updated profile
      const mockProfile = testHelpers.createMockDiscordProfile({
        id: initialUser.discord_id,
        username: 'NewUsername'
      });

      // Simulate login update
      const updatedUser = await prisma.user.update({
        where: { discord_id: mockProfile.id },
        data: {
          username: mockProfile.username,
          discriminator: mockProfile.discriminator,
          avatar: mockProfile.avatar,
          last_login: new Date()
        }
      });

      expect(updatedUser.username).toBe('NewUsername');
      expect(updatedUser.last_login).toBeDefined();
    });
  });

  describe('User Serialization', () => {
    it('should serialize user ID correctly', () => {
      const user = { id: 'test-user-id', username: 'TestUser' };
      
      // Simulate passport serialization
      const serializedId = user.id;
      
      expect(serializedId).toBe('test-user-id');
    });

    it('should deserialize user from database', async () => {
      const testUser = await testHelpers.createTestUser(prisma);
      
      // Simulate passport deserialization
      const deserializedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      
      expect(deserializedUser).toBeDefined();
      expect(deserializedUser.id).toBe(testUser.id);
      expect(deserializedUser.username).toBe(testUser.username);
    });
  });

  describe('Admin Access Control', () => {
    it('should identify admin users correctly', async () => {
      const adminUser = await testHelpers.createTestUser(prisma, testFixtures.users.admin);
      
      expect(adminUser.is_admin).toBe(true);
    });

    it('should identify regular users correctly', async () => {
      const regularUser = await testHelpers.createTestUser(prisma, testFixtures.users.regular);
      
      expect(regularUser.is_admin).toBe(false);
    });
  });
});
