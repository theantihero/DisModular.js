/**
 * Access Request Flow Integration Tests
 * Tests the complete access request workflow with user messages
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { csrf } from 'lusca';
import createAuthRoutes from '../../packages/api/src/routes/auth.js';
import { createAdminRoutes } from '../../packages/api/src/routes/admin.js';

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
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test_session_secret';
}

const prisma = new PrismaClient();

// Mock passport for testing
const mockPassport = {
  initialize: () => (req, res, next) => next(),
  session: () => (req, res, next) => next(),
  authenticate: (strategy) => (req, res, next) => {
    req.user = { id: 'test-user', username: 'testuser', is_admin: false };
    next();
  }
};

describe('Access Request Flow', () => {
  let app;
  let testUserId = 'test-user-123';
  let adminUserId = 'admin-user-123';

  beforeAll(async () => {
    // Create test app
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      }
    }));
    app.use(csrf());
    app.use(mockPassport.initialize());
    app.use(mockPassport.session());

    // Add routes
    app.use('/auth', createAuthRoutes());
    app.use('/admin', createAdminRoutes());

    // Create test users
    await prisma.user.createMany({
      data: [
        {
          id: testUserId,
          discord_id: '123456789',
          username: 'testuser',
          discriminator: '1234',
          access_status: 'pending',
          is_admin: false
        },
        {
          id: adminUserId,
          discord_id: '987654321',
          username: 'adminuser',
          discriminator: '5678',
          access_status: 'approved',
          is_admin: true
        }
      ]
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: {
        user_id: { in: [testUserId, adminUserId] }
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserId, adminUserId] }
      }
    });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset user access status before each test
    await prisma.user.update({
      where: { id: testUserId },
      data: {
        access_status: 'pending',
        access_requested_at: null,
        access_request_message: null,
        access_message: null
      }
    });
  });

  describe('User Access Request', () => {
    it('should allow user to request access with message', async () => {
      const requestMessage = 'I want to use this platform for my community server';

      const response = await request(app)
        .post('/auth/request-access')
        .send({ message: requestMessage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('submitted successfully');

      // Verify the request was stored
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(user.access_requested_at).toBeTruthy();
      expect(user.access_request_message).toBe(requestMessage);
    });

    it('should allow user to request access without message', async () => {
      const response = await request(app)
        .post('/auth/request-access')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify the request was stored
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(user.access_requested_at).toBeTruthy();
      expect(user.access_request_message).toBeNull();
    });

    it('should reject request with message too long', async () => {
      const longMessage = 'a'.repeat(501); // 501 characters

      const response = await request(app)
        .post('/auth/request-access')
        .send({ message: longMessage })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('500 characters');
    });

    it('should require authentication to request access', async () => {
      // Mock unauthenticated request
      const appUnauth = express();
      appUnauth.use(express.json());
      appUnauth.use('/auth', createAuthRoutes());

      const response = await request(appUnauth)
        .post('/auth/request-access')
        .send({ message: 'test message' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should get user access status', async () => {
      // Set up user with access request
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_requested_at: new Date(),
          access_request_message: 'Test request message'
        }
      });

      const response = await request(app)
        .get('/auth/access-status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.access_status).toBe('pending');
      expect(response.body.data.access_request_message).toBe('Test request message');
      expect(response.body.data.access_requested_at).toBeTruthy();
    });
  });

  describe('Admin Access Management', () => {
    it('should list pending access requests', async () => {
      // Set up pending user
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'pending',
          access_requested_at: new Date(),
          access_request_message: 'I need access for my server'
        }
      });

      const response = await request(app)
        .get('/admin/access-requests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(testUserId);
      expect(response.body.data[0].access_request_message).toBe('I need access for my server');
    });

    it('should approve access request with message', async () => {
      // Set up pending user
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'pending',
          access_requested_at: new Date(),
          access_request_message: 'I need access for my server'
        }
      });

      const approvalMessage = 'Welcome to the platform!';

      const response = await request(app)
        .post(`/admin/access-requests/${testUserId}/approve`)
        .send({ message: approvalMessage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('approved successfully');

      // Verify user was approved
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(user.access_status).toBe('approved');
      expect(user.access_message).toBe(approvalMessage);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          user_id: adminUserId,
          action: 'APPROVE_ACCESS',
          resource_id: testUserId
        }
      });

      expect(auditLog).toBeTruthy();
    });

    it('should deny access request with message', async () => {
      // Set up pending user
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'pending',
          access_requested_at: new Date(),
          access_request_message: 'I need access for my server'
        }
      });

      const denialMessage = 'Your request does not meet our requirements.';

      const response = await request(app)
        .post(`/admin/access-requests/${testUserId}/deny`)
        .send({ message: denialMessage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('denied successfully');

      // Verify user was denied
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(user.access_status).toBe('denied');
      expect(user.access_message).toBe(denialMessage);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          user_id: adminUserId,
          action: 'DENY_ACCESS',
          resource_id: testUserId
        }
      });

      expect(auditLog).toBeTruthy();
    });

    it('should require denial message', async () => {
      const response = await request(app)
        .post(`/admin/access-requests/${testUserId}/deny`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Denial message is required');
    });

    it('should revoke access from approved user', async () => {
      // Set up approved user
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'approved',
          access_message: 'Welcome!'
        }
      });

      const revocationReason = 'Violation of terms of service';

      const response = await request(app)
        .post(`/admin/users/${testUserId}/revoke-access`)
        .send({ reason: revocationReason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('revoked successfully');

      // Verify user access was revoked
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(user.access_status).toBe('denied');
      expect(user.access_message).toBe(revocationReason);
    });

    it('should grant access to user', async () => {
      // Set up denied user
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'denied',
          access_message: 'Previously denied'
        }
      });

      const grantMessage = 'Access has been granted. Welcome!';

      const response = await request(app)
        .post(`/admin/users/${testUserId}/grant-access`)
        .send({ message: grantMessage })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('granted successfully');

      // Verify user access was granted
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(user.access_status).toBe('approved');
      expect(user.access_message).toBe(grantMessage);
    });

    it('should prevent revoking access from admin users', async () => {
      const response = await request(app)
        .post(`/admin/users/${adminUserId}/revoke-access`)
        .send({ reason: 'Test revocation' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot revoke access from admin users');
    });

    it('should require revocation reason', async () => {
      const response = await request(app)
        .post(`/admin/users/${testUserId}/revoke-access`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Revocation reason is required');
    });
  });

  describe('Complete Access Flow', () => {
    it('should handle complete access request workflow', async () => {
      // 1. User requests access with message
      const requestMessage = 'I want to use this platform for my community server';
      
      await request(app)
        .post('/auth/request-access')
        .send({ message: requestMessage })
        .expect(200);

      // 2. Admin sees the request
      const requestsResponse = await request(app)
        .get('/admin/access-requests')
        .expect(200);

      expect(requestsResponse.body.data).toHaveLength(1);
      expect(requestsResponse.body.data[0].access_request_message).toBe(requestMessage);

      // 3. Admin approves the request
      const approvalMessage = 'Welcome to the platform!';
      
      await request(app)
        .post(`/admin/access-requests/${testUserId}/approve`)
        .send({ message: approvalMessage })
        .expect(200);

      // 4. User checks their status
      const statusResponse = await request(app)
        .get('/auth/access-status')
        .expect(200);

      expect(statusResponse.body.data.access_status).toBe('approved');
      expect(statusResponse.body.data.access_message).toBe(approvalMessage);

      // 5. Admin can revoke access later
      const revocationReason = 'Terms violation';
      
      await request(app)
        .post(`/admin/users/${testUserId}/revoke-access`)
        .send({ reason: revocationReason })
        .expect(200);

      // 6. User status shows denied
      const finalStatusResponse = await request(app)
        .get('/auth/access-status')
        .expect(200);

      expect(finalStatusResponse.body.data.access_status).toBe('denied');
      expect(finalStatusResponse.body.data.access_message).toBe(revocationReason);
    });
  });
});
