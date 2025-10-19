#!/usr/bin/env node

/**
 * Setup Admin Script
 * Helps set up the initial admin Discord ID
 * @author fkndean_
 * @date 2025-10-18
 */

import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin access...\n');
    
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
          console.log(`   - ${user.username}#${user.discriminator} (ID: ${user.discord_id}) - Admin: ${user.is_admin ? '✅' : '❌'}`);
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
    const user = await prisma.user.findUnique({
      where: { discord_id: adminId }
    });
    
    if (user) {
      if (user.is_admin) {
        console.log(`✅ User ${user.username} already has admin access`);
      } else {
        console.log(`🔧 Granting admin access to ${user.username}...`);
        await prisma.user.update({
          where: { discord_id: adminId },
          data: { 
            is_admin: true, 
            access_status: 'approved',
            admin_notes: 'Initial admin from setup script'
          }
        });
        console.log(`✅ Admin access granted to ${user.username}`);
      }
    } else {
      console.log(`⚠️  User with Discord ID ${adminId} not found in database.`);
      console.log('   This user needs to log in at least once before admin access can be granted.');
      console.log('   Please:');
      console.log('   1. Make sure the Discord OAuth is properly configured');
      console.log('   2. Visit the login page and authenticate with Discord');
      console.log('   3. Run this script again');
    }
    
  } catch (error) {
    console.error('💥 Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
