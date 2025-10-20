/**
 * Test-specific PrismaService for CI environments
 * This service ensures consistent database client usage in tests
 * @author fkndean_
 * @date 2025-01-27
 */

let testPrismaClient = null;

/**
 * Set the test Prisma client
 * @param {PrismaClient} client - The test Prisma client
 */
export function setTestPrismaClient(client) {
  testPrismaClient = client;
  console.log('Test Prisma client set:', !!client);
}

/**
 * Get the test Prisma client
 * @returns {PrismaClient|null} The test Prisma client
 */
export function getTestPrismaClient() {
  if (testPrismaClient) {
    console.log('Using test Prisma client');
    return testPrismaClient;
  }
  
  console.log('No test Prisma client available');
  return null;
}

/**
 * Reset the test Prisma client
 */
export function resetTestPrismaClient() {
  testPrismaClient = null;
  console.log('Test Prisma client reset');
}

export default {
  setTestPrismaClient,
  getTestPrismaClient,
  resetTestPrismaClient
};
