/**
 * Prisma Client Service
 * Centralized Prisma client management with lazy initialization
 * @author fkndean_
 * @date 2025-01-27
 */

import { PrismaClient } from '@prisma/client';

let prismaClient = null;

/**
 * Get or create Prisma client instance
 * Uses lazy initialization to avoid issues during testing
 * @returns {PrismaClient} Prisma client instance
 */
export function getPrismaClient() {
  // Check if there's a global test client available (for testing)
  if (global.testPrismaClient) {
    console.log('Using global test Prisma client');
    console.log('Global test client exists:', !!global.testPrismaClient);
    console.log('Global test client type:', typeof global.testPrismaClient);
    return global.testPrismaClient;
  }
  
  console.log('No test client found, creating new client');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    CI: process.env.CI,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL ? 'SET' : 'NOT SET'
  });
  
  if (!prismaClient) {
    try {
      // Check if we're in test mode and use test database URL if available
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.CI;
      const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
      
      console.log('Creating Prisma client with:', {
        isTestMode,
        testDatabaseUrl: testDatabaseUrl ? 'SET' : 'NOT SET',
        willUseTestUrl: isTestMode && testDatabaseUrl
      });
      
      if (isTestMode && testDatabaseUrl) {
        prismaClient = new PrismaClient({
          datasources: {
            db: {
              url: testDatabaseUrl
            }
          }
        });
        console.log('Created Prisma client with test database URL');
      } else {
        prismaClient = new PrismaClient();
        console.log('Created Prisma client with default configuration');
      }
    } catch (error) {
      console.error('Error creating Prisma client:', error);
      // If Prisma client generation failed, try with test database URL
      if (process.env.NODE_ENV === 'test' || process.env.CI) {
        try {
          const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
          if (testDatabaseUrl) {
            prismaClient = new PrismaClient({
              datasources: {
                db: {
                  url: testDatabaseUrl
                }
              }
            });
            console.log('Created Prisma client with fallback test database URL');
          } else {
            console.warn('⚠️ Prisma client not available (no test database URL)');
            return null;
          }
        } catch (testError) {
          console.warn('⚠️ Prisma client not available (test mode):', testError.message);
          return null;
        }
      } else {
        throw error;
      }
    }
  }
  return prismaClient;
}

/**
 * Close Prisma client connection
 */
export async function closePrismaClient() {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

/**
 * Reset Prisma client (for testing)
 */
export function resetPrismaClient() {
  prismaClient = null;
}

export default getPrismaClient;
