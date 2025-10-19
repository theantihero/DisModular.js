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
      prismaClient = new PrismaClient();
    } catch (error) {
      // If Prisma client generation failed, return null for testing scenarios
      if (process.env.NODE_ENV === 'test' || process.env.CI) {
        console.warn('⚠️ Prisma client not available (test/CI mode)');
        return null;
      }
      throw error;
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
