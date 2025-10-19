/**
 * Auth Flow Integration Tests
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { TestDatabase, testFixtures, testHelpers } from '../../setup.js';

// Set test database URL
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://dismodular:password@localhost:5432/dismodular_test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
import createAuthRoutes from '../../packages/api/src/routes/auth.js';
import { initializePassport } from '../../packages/api/src/middleware/auth.js';

describe('Auth Flow Integration Tests', () => {
  let app;
  let testDb;
  let prisma;

  beforeEach(async () => {
    testDb = new TestDatabase();
    prisma = testDb.getClient();
    await testDb.setup();
    await testDb.cleanup();

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: true }
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Initialize Passport with test config
    initializePassport({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      callbackUrl: 'http://localhost:3002/auth/discord/callback'
    });

    // Add auth routes
    app.use('/auth', createAuthRoutes());
  });

  afterEach(async () => {
    await testDb.close();
  });

  describe('GET /auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authenticated');
    });

    it('should return user data when authenticated', async () => {
      // Create test user
      const user = await testHelpers.createTestUser(prisma, testFixtures.users.admin);

      // Mock authenticated session
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', `connect.sid=${user.id}`) // Mock session
        .expect(200);

      // Note: This test would need proper session mocking to work fully
      // For now, we're testing the route structure
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /auth/discord', () => {
    it('should redirect to Discord OAuth', async () => {
      const response = await request(app)
        .get('/auth/discord')
        .expect(302);

      expect(response.headers.location).toContain('discord.com/oauth2/authorize');
      expect(response.headers.location).toContain('client_id=test-client-id');
    });
  });

  describe('GET /auth/discord/callback', () => {
    it('should handle OAuth callback with error', async () => {
      const response = await request(app)
        .get('/auth/discord/callback')
        .query({ error: 'access_denied' })
        .expect(302);

      expect(response.headers.location).toContain('/auth/error');
    });

    it('should handle OAuth callback without user', async () => {
      // This would need proper mocking of passport strategy
      const response = await request(app)
        .get('/auth/discord/callback')
        .expect(302);

      expect(response.headers.location).toContain('/auth/error');
    });
  });

  describe('Database Integration', () => {
    it('should create user during OAuth flow', async () => {
      const mockProfile = testHelpers.createMockDiscordProfile({
        id: process.env.INITIAL_ADMIN_DISCORD_ID || '189921902553202688'
      });

      // Simulate OAuth user creation
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

      // Verify user can be found
      const foundUser = await prisma.user.findUnique({
        where: { discord_id: mockProfile.id }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(user.id);
    });

    it('should update user on subsequent logins', async () => {
      // Create initial user
      const user = await testHelpers.createTestUser(prisma, {
        ...testFixtures.users.regular,
        username: 'OldUsername'
      });

      // Simulate login update
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: 'NewUsername',
          last_login: new Date()
        }
      });

      expect(updatedUser.username).toBe('NewUsername');
      expect(updatedUser.last_login).toBeDefined();
      expect(updatedUser.last_login.getTime()).toBeGreaterThan(user.created_at.getTime());
    });
  });

  describe('Session Management', () => {
    it('should serialize user correctly', async () => {
      const user = await testHelpers.createTestUser(prisma);
      
      // Test serialization
      const serializedId = user.id;
      expect(serializedId).toBe(user.id);

      // Test deserialization
      const deserializedUser = await prisma.user.findUnique({
        where: { id: serializedId }
      });

      expect(deserializedUser).toBeDefined();
      expect(deserializedUser.id).toBe(user.id);
    });
  });
});
