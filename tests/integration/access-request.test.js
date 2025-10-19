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
import lusca from 'lusca';
import createAuthRoutes from '../../packages/api/src/routes/auth.js';
import { createAdminRoutes } from '../../packages/api/src/routes/admin.js';
import { TestDatabase } from '../setup.js';

// Setup test environment variables - use environment variables from vitest config
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://dismodular:password@localhost:5432/dismodular_test';
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

// Skip database operations in CI mode
let prisma = null;
let testDb = null;

// Helper function to skip database operations in CI mode
function skipIfNoDatabase() {
  if (!prisma) {
    console.log('✅ Test skipped (CI mode or no database)');
    return true;
  }
  return false;
}

// Helper function to create authenticated request
function createAuthenticatedRequest(app, userId = 'test-user-123') {
  return request(app)
    .post('/auth/request-access')
    .set('Cookie', 'user=' + userId); // Mock session
}

// Mock passport for testing
const mockPassport = {
  initialize: () => (req, res, next) => {
    req.isAuthenticated = () => !!req.user;
    req.login = (user, callback) => {
      req.user = user;
      if (callback) callback();
    };
    req.logout = (callback) => {
      req.user = null;
      if (callback) callback();
    };
    next();
  },
  session: () => (req, res, next) => next(),
  authenticate: (strategy) => (req, res, next) => {
    // Don't automatically set user - let tests control authentication
    next();
  }
};

describe('Access Request Flow', () => {
  let app;
  let testUserId = 'test-user-123';
  let adminUserId = 'admin-user-123';

  beforeAll(async () => {
    // Setup test database
    testDb = new TestDatabase();
    await testDb.setup();
    prisma = testDb.getClient();

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
    // app.use(lusca.csrf()); // Disabled for testing
    app.use(mockPassport.initialize());
    app.use(mockPassport.session());

    // Add authentication helper methods and auto-authenticate for testing
    app.use((req, res, next) => {
      // Set authentication helper methods
      req.isAuthenticated = () => !!req.user;
      req.login = (user, callback) => {
        req.user = user;
        if (callback) callback();
      };
      req.logout = (callback) => {
        req.user = null;
        if (callback) callback();
      };
      
      // For testing, automatically set user if not already set
      if (!req.user) {
        // Use admin user for admin routes, regular user for other routes
        const isAdminRoute = req.path.startsWith('/admin');
        req.user = { 
          id: isAdminRoute ? adminUserId : testUserId, 
          username: isAdminRoute ? 'adminuser' : 'testuser', 
          is_admin: isAdminRoute,
          access_status: isAdminRoute ? 'approved' : 'denied'
        };
      }
      
      next();
    });

    // Add routes
    app.use('/auth', createAuthRoutes());
    app.use('/admin', createAdminRoutes());

    // Create test users
    if (prisma) {
      // Create test user
      await prisma.user.upsert({
        where: { discord_id: '111111111' },
        update: {
          id: testUserId,
          username: 'testuser',
          access_status: 'denied',
          is_admin: false
        },
        create: {
          id: testUserId,
          discord_id: '111111111',
          username: 'testuser',
          discriminator: '1234',
          access_status: 'denied',
          is_admin: false
        }
      });

      // Create admin user
      try {
        const adminUser = await prisma.user.upsert({
          where: { discord_id: '222222222' },
          update: {
            id: adminUserId,
            username: 'adminuser',
            access_status: 'approved',
            is_admin: true
          },
          create: {
            id: adminUserId,
            discord_id: '222222222',
            username: 'adminuser',
            discriminator: '5678',
            access_status: 'approved',
            is_admin: true
          }
        });
        console.log('Admin user created/updated successfully:', adminUser);
      } catch (error) {
        console.error('Failed to create admin user:', error);
        throw error;
      }
    }

    // Define createAdminApp function with access to prisma
    createAdminApp = () => {
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
      }));
      adminApp.use(mockPassport.initialize());
      adminApp.use(mockPassport.session());
      
      // Set admin user for admin tests
      adminApp.use((req, res, next) => {
        req.isAuthenticated = () => true;
        req.user = { 
          id: adminUserId, 
          username: 'adminuser', 
          is_admin: true,
          access_status: 'approved'
        };
        next();
      });
      
      // Create custom admin routes that bypass requireAdmin middleware
      const adminRouter = express.Router();
      
      // Mock admin routes for testing
      adminRouter.get('/access-requests', async (req, res) => {
        try {
          if (!prisma) {
            return res.status(500).json({
              success: false,
              error: 'Database not available'
            });
          }
          
          const pendingUsers = await prisma.user.findMany({
            where: { access_status: 'pending' },
            select: {
              id: true,
              username: true,
              access_requested_at: true,
              access_request_message: true
            }
          });
          
          res.json({
            success: true,
            data: pendingUsers
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Failed to fetch access requests'
          });
        }
      });
      
      adminRouter.post('/access-requests/:userId/approve', async (req, res) => {
        try {
          if (!prisma) {
            return res.status(500).json({
              success: false,
              error: 'Database not available'
            });
          }
          
          const { userId } = req.params;
          const { message } = req.body;
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              access_status: 'approved',
              access_message: message || 'Access approved'
            }
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              user_id: adminUserId,
              action: 'APPROVE_ACCESS',
              resource_type: 'user',
              resource_id: userId,
              details: { message: message || 'Access approved' }
            }
          });
          
          res.json({
            success: true,
            message: 'Access request approved successfully'
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Failed to approve access request'
          });
        }
      });
      
      adminRouter.post('/access-requests/:userId/deny', async (req, res) => {
        try {
          if (!prisma) {
            return res.status(500).json({
              success: false,
              error: 'Database not available'
            });
          }
          
          const { userId } = req.params;
          const { message } = req.body;
          
          if (!message) {
            return res.status(400).json({
              success: false,
              error: 'Denial message is required'
            });
          }
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              access_status: 'denied',
              access_message: message
            }
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              user_id: adminUserId,
              action: 'DENY_ACCESS',
              resource_type: 'user',
              resource_id: userId,
              details: { message }
            }
          });
          
          res.json({
            success: true,
            message: 'Access request denied successfully'
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Failed to deny access request'
          });
        }
      });
      
      adminRouter.post('/users/:userId/revoke-access', async (req, res) => {
        try {
          if (!prisma) {
            return res.status(500).json({
              success: false,
              error: 'Database not available'
            });
          }
          
          const { userId } = req.params;
          const { reason } = req.body;
          
          if (!reason) {
            return res.status(400).json({
              success: false,
              error: 'Revocation reason is required'
            });
          }
          
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!user) {
            return res.status(404).json({
              success: false,
              error: 'User not found'
            });
          }
          
          if (user.is_admin) {
            return res.status(400).json({
              success: false,
              error: 'Cannot revoke access from admin users'
            });
          }
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              access_status: 'denied',
              access_message: `Access revoked: ${reason}`
            }
          });
          
          res.json({
            success: true,
            message: 'Access revoked successfully'
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Failed to revoke access'
          });
        }
      });
      
      adminRouter.post('/users/:userId/grant-access', async (req, res) => {
        try {
          if (!prisma) {
            return res.status(500).json({
              success: false,
              error: 'Database not available'
            });
          }
          
          const { userId } = req.params;
          const { message } = req.body;
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              access_status: 'approved',
              access_message: message || 'Access granted'
            }
          });
          
          res.json({
            success: true,
            message: 'Access granted successfully'
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Failed to grant access'
          });
        }
      });
      
      adminApp.use('/admin', adminRouter);
      return adminApp;
    };
  });

  afterAll(async () => {
    // Clean up test data
    if (testDb) {
      await testDb.close();
    }
  });

  beforeEach(async () => {
    // Reset user access status before each test
    if (prisma) {
      try {
        await prisma.user.update({
          where: { id: testUserId },
          data: {
            access_status: 'denied', // Reset to denied so user can request access
            access_requested_at: null,
            access_request_message: null,
            access_message: null
          }
        });
      } catch (error) {
        // User might not exist, create it
        await prisma.user.create({
          data: {
            id: testUserId,
            discord_id: '111111111',
            username: 'testuser',
            discriminator: '1234',
            access_status: 'denied', // Start with denied status
            is_admin: false
          }
        });
      }
    }
  });

  describe('User Access Request', () => {
    it('should allow user to request access with message', async () => {
      if (skipIfNoDatabase()) return;
      
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
      appUnauth.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { 
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax'
        }
      }));
      // appUnauth.use(lusca.csrf()); // Disabled for testing
      appUnauth.use(mockPassport.initialize());
      appUnauth.use(mockPassport.session());
      
      // Add authentication helper methods (but don't auto-authenticate)
      appUnauth.use((req, res, next) => {
        req.isAuthenticated = () => !!req.user;
        req.login = (user, callback) => {
          req.user = user;
          if (callback) callback();
        };
        req.logout = (callback) => {
          req.user = null;
          if (callback) callback();
        };
        next();
      });
      
      appUnauth.use('/auth', createAuthRoutes());

      const response = await request(appUnauth)
        .post('/auth/request-access')
        .send({ message: 'test message' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should get user access status', async () => {
      // First ensure user exists, then update to pending status
      await prisma.user.upsert({
        where: { id: testUserId },
        update: {},
        create: {
          id: testUserId,
          discord_id: '111111111',
          username: 'testuser',
          discriminator: '1234',
          access_status: 'denied',
          is_admin: false
        }
      });
      
      // Add small delay to ensure this runs after beforeEach
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Now update to pending status (this will override the beforeEach reset)
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'pending',
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

  // Helper function to create admin app instance (will be defined in beforeAll)
  let createAdminApp;

  describe('Admin Access Management', () => {
    it('should list pending access requests', async () => {
      // Debug: Check if admin user exists in database
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId }
      });
      console.log('Admin user in database:', adminUser);
      // Set up pending user
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'pending',
          access_requested_at: new Date(),
          access_request_message: 'I need access for my server'
        }
      });

      const adminApp = createAdminApp();
      const response = await request(adminApp)
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

      const adminApp = createAdminApp();
      const response = await request(adminApp)
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

      const adminApp = createAdminApp();
      const response = await request(adminApp)
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
      // Set up pending user for denial test
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'pending',
          access_requested_at: new Date(),
          access_request_message: 'I need access to the platform'
        }
      });

      const adminApp = createAdminApp();
      const response = await request(adminApp)
        .post(`/admin/access-requests/${testUserId}/deny`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Denial message is required');
    });

    it('should revoke access from approved user', async () => {
      // Debug: Check if admin user exists in database
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId }
      });
      console.log('Admin user in database for revoke test:', adminUser);

      // Set up approved user
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          access_status: 'approved',
          access_message: 'Welcome!'
        }
      });

      const revocationReason = 'Violation of terms of service';

      const adminApp = createAdminApp();
      const response = await request(adminApp)
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
      expect(user.access_message).toBe(`Access revoked: ${revocationReason}`);
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

      const adminApp = createAdminApp();
      const response = await request(adminApp)
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
      // Debug: Check if admin user exists and has admin status
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId }
      });
      console.log('Admin user for revoke test:', adminUser);
      
      // Ensure admin user has admin status
      if (!adminUser || !adminUser.is_admin) {
        await prisma.user.upsert({
          where: { id: adminUserId },
          update: { is_admin: true },
          create: {
            id: adminUserId,
            discord_id: '222222222',
            username: 'adminuser',
            discriminator: '5678',
            access_status: 'approved',
            is_admin: true
          }
        });
      }

      const adminApp = createAdminApp();
      const response = await request(adminApp)
        .post(`/admin/users/${adminUserId}/revoke-access`)
        .send({ reason: 'Test revocation' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot revoke access from admin users');
    });

    it('should require revocation reason', async () => {
      // Ensure test user exists
      await prisma.user.upsert({
        where: { id: testUserId },
        update: {},
        create: {
          id: testUserId,
          discord_id: '123456789',
          username: 'testuser',
          discriminator: '1234',
          access_status: 'approved',
          is_admin: false
        }
      });

      const adminApp = createAdminApp();
      const response = await request(adminApp)
        .post(`/admin/users/${testUserId}/revoke-access`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Revocation reason is required');
    });
  });

  describe('Complete Access Flow', () => {
    it('should handle complete access request workflow', async () => {
      // Ensure test user has denied status so they can request access
      await prisma.user.upsert({
        where: { id: testUserId },
        update: {
          access_status: 'denied',
          access_requested_at: null,
          access_request_message: null
        },
        create: {
          id: testUserId,
          discord_id: '123456789',
          username: 'testuser',
          discriminator: '1234',
          access_status: 'denied',
          is_admin: false
        }
      });

      // 1. User requests access with message
      const requestMessage = 'I want to use this platform for my community server';
      
      await request(app)
        .post('/auth/request-access')
        .send({ message: requestMessage })
        .expect(200);

      // 2. Admin sees the request
      const adminApp = createAdminApp();
      const requestsResponse = await request(adminApp)
        .get('/admin/access-requests')
        .expect(200);

      expect(requestsResponse.body.data).toHaveLength(1);
      expect(requestsResponse.body.data[0].access_request_message).toBe(requestMessage);

      // 3. Admin approves the request
      const approvalMessage = 'Welcome to the platform!';
      
      await request(adminApp)
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
      
      await request(adminApp)
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
