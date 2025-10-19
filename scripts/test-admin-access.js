#!/usr/bin/env node

/**
 * Test Admin Access Script
 * Tests if the admin access is working properly
 * @author fkndean_
 * @date 2025-01-27
 */

import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

/**
 * Test admin access functionality
 */
async function testAdminAccess() {
  try {
    console.log('🧪 Testing admin access...\n');
    
    // Check if INITIAL_ADMIN_DISCORD_ID is set
    const adminId = process.env.INITIAL_ADMIN_DISCORD_ID;
    
    if (!adminId || adminId === 'your_discord_id_here') {
      console.log('❌ INITIAL_ADMIN_DISCORD_ID is not set');
      console.log('   Please set this environment variable to your Discord ID');
      return false;
    }
    
    console.log(`✅ INITIAL_ADMIN_DISCORD_ID is set: ${adminId}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { discord_id: adminId }
    });
    
    if (!user) {
      console.log('❌ Admin user not found in database');
      console.log('   Run: npm run db:ensure-admin');
      return false;
    }
    
    console.log(`✅ Admin user found: ${user.username}#${user.discriminator || '0000'}`);
    
    // Check admin status
    if (!user.is_admin) {
      console.log('❌ User is not marked as admin');
      console.log('   Run: npm run db:ensure-admin');
      return false;
    }
    
    console.log('✅ User is marked as admin');
    
    // Check access status
    if (user.access_status !== 'approved') {
      console.log(`❌ User access status is: ${user.access_status || 'unknown'}`);
      console.log('   Run: npm run db:ensure-admin');
      return false;
    }
    
    console.log('✅ User access status is approved');
    
    // Test admin middleware logic
    console.log('\n🔍 Testing admin middleware logic...');
    
    // Simulate the auth middleware checks
    const isAuthenticated = true; // Simulating logged in user
    const isAdmin = user.is_admin;
    const accessStatus = user.access_status;
    
    if (!isAuthenticated) {
      console.log('❌ User would be rejected: Not authenticated');
      return false;
    }
    
    if (!isAdmin) {
      console.log('❌ User would be rejected: Not admin');
      return false;
    }
    
    if (accessStatus === 'denied') {
      console.log('❌ User would be rejected: Access denied');
      return false;
    }
    
    if (accessStatus === 'pending') {
      console.log('❌ User would be rejected: Access pending');
      return false;
    }
    
    if (accessStatus !== 'approved') {
      console.log('❌ User would be rejected: Access not approved');
      return false;
    }
    
    console.log('✅ User would pass all admin checks');
    
    // Check all users
    const allUsers = await prisma.user.findMany();
    console.log(`\n👥 Total users in database: ${allUsers.length}`);
    
    const adminUsers = allUsers.filter(u => u.is_admin);
    const approvedUsers = allUsers.filter(u => u.access_status === 'approved');
    
    console.log(`   - Admin users: ${adminUsers.length}`);
    console.log(`   - Approved users: ${approvedUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('   Admin users:');
      adminUsers.forEach(u => {
        console.log(`     - ${u.username}#${u.discriminator || '0000'} (${u.discord_id})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Error testing admin access:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 DisModular.js Admin Access Tester');
  console.log('====================================\n');
  
  const success = await testAdminAccess();
  
  if (success) {
    console.log('\n✅ Admin access test passed!');
    console.log('   The admin user should be able to access admin endpoints.');
  } else {
    console.log('\n❌ Admin access test failed!');
    console.log('   Please run: npm run db:ensure-admin');
    process.exit(1);
  }
}

// Run the script
main();
