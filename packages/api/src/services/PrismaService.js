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
  if (!prismaClient) {
    try {
      // Check if we're in test mode and use test database URL if available
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.CI;
      const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
      
      if (isTestMode && testDatabaseUrl) {
        prismaClient = new PrismaClient({
          datasources: {
            db: {
              url: testDatabaseUrl
            }
          }
        });
      } else {
        prismaClient = new PrismaClient();
      }
    } catch (error) {
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
