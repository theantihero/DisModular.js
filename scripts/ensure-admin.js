#!/usr/bin/env node

/**
 * Ensure Admin Access Script
 * Creates or updates the initial admin user to ensure they have proper access
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
 * Ensure the initial admin user exists and has proper access
 */
async function ensureAdminAccess() {
  try {
    console.log('🔧 Ensuring admin access...\n');
    
    // Check if INITIAL_ADMIN_DISCORD_ID is set
    const adminId = process.env.INITIAL_ADMIN_DISCORD_ID;
    
    if (!adminId || adminId === 'your_discord_id_here') {
      console.log('❌ INITIAL_ADMIN_DISCORD_ID is not set or is still the placeholder value.');
      console.log('📝 To fix this:');
      console.log('   1. Find your Discord ID:');
      console.log('      - Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)');
      console.log('      - Right-click on your username and select "Copy User ID"');
      console.log('   2. Set the environment variable:');
      console.log('      - Add INITIAL_ADMIN_DISCORD_ID=YOUR_DISCORD_ID to your .env file');
      console.log('      - Or set it in your Docker environment');
      console.log('   3. Restart the application\n');
      
      // Check if there are any existing users in the database
      const users = await prisma.user.findMany();
      if (users.length > 0) {
        console.log('👥 Existing users in database:');
        users.forEach(user => {
          console.log(`   - ${user.username}#${user.discriminator || '0000'} (ID: ${user.discord_id}) - Admin: ${user.is_admin ? '✅' : '❌'} - Status: ${user.access_status || 'unknown'}`);
        });
        console.log('\n💡 If you see your user above, you can manually grant admin access using:');
        console.log('   docker exec -it dismodular-app node -e "');
        console.log('   const { PrismaClient } = require(\'@prisma/client\');');
        console.log('   const prisma = new PrismaClient();');
        console.log('   prisma.user.update({');
        console.log('     where: { discord_id: \"YOUR_DISCORD_ID\" },');
        console.log('     data: { is_admin: true, access_status: \"approved\" }');
        console.log('   }).then(() => console.log(\"Admin access granted!\")).finally(() => prisma.$disconnect());');
        console.log('   "');
      }
      
      process.exit(1);
    }
    
    console.log(`✅ INITIAL_ADMIN_DISCORD_ID is set to: ${adminId}`);
    
    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { discord_id: adminId }
    });
    
    if (user) {
      console.log(`👤 Found existing user: ${user.username}#${user.discriminator || '0000'}`);
      
      // Update user to ensure they have admin access
      user = await prisma.user.update({
        where: { discord_id: adminId },
        data: { 
          is_admin: true, 
          access_status: 'approved',
          admin_notes: 'Initial admin - access ensured by script'
        }
      });
      
      console.log(`✅ Admin access ensured for ${user.username}`);
      console.log(`   - Admin: ${user.is_admin ? '✅' : '❌'}`);
      console.log(`   - Access Status: ${user.access_status}`);
      console.log(`   - Admin Notes: ${user.admin_notes}`);
      
    } else {
      console.log(`⚠️  User with Discord ID ${adminId} not found in database.`);
      console.log('   Creating initial admin user...');
      
      // Create the initial admin user
      user = await prisma.user.create({
        data: {
          discord_id: adminId,
          username: 'Initial Admin',
          discriminator: '0000',
          is_admin: true,
          access_status: 'approved',
          admin_notes: 'Initial admin user created by ensure-admin script',
          created_at: new Date(),
          last_login: new Date()
        }
      });
      
      console.log(`✅ Initial admin user created: ${user.username}`);
      console.log(`   - Discord ID: ${user.discord_id}`);
      console.log(`   - Admin: ${user.is_admin ? '✅' : '❌'}`);
      console.log(`   - Access Status: ${user.access_status}`);
    }
    
    // Verify the user can access admin endpoints
    console.log('\n🔍 Verifying admin access...');
    
    if (user.is_admin && user.access_status === 'approved') {
      console.log('✅ Admin access verified successfully!');
      console.log('   The user should now be able to access admin endpoints.');
    } else {
      console.log('❌ Admin access verification failed!');
      console.log(`   - is_admin: ${user.is_admin}`);
      console.log(`   - access_status: ${user.access_status}`);
    }
    
    // Check if there are any other users that might need admin access
    const allUsers = await prisma.user.findMany();
    const nonAdminUsers = allUsers.filter(u => !u.is_admin);
    
    if (nonAdminUsers.length > 0) {
      console.log(`\n👥 Found ${nonAdminUsers.length} non-admin users:`);
      nonAdminUsers.forEach(u => {
        console.log(`   - ${u.username}#${u.discriminator || '0000'} (${u.discord_id}) - Status: ${u.access_status || 'unknown'}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error ensuring admin access:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 DisModular.js Admin Access Ensurer');
  console.log('=====================================\n');
  
  await ensureAdminAccess();
  
  console.log('\n✅ Admin access setup completed!');
}

// Run the script
main();
