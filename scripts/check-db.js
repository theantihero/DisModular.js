import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const pluginCount = await prisma.plugin.count();
    const userCount = await prisma.user.count();
    const configCount = await prisma.botConfig.count();
    
    console.log('Database Status:');
    console.log(`- Plugins: ${pluginCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Bot Configs: ${configCount}`);
    
    if (pluginCount > 0) {
      const plugins = await prisma.plugin.findMany({ select: { name: true, enabled: true } });
      console.log('Example plugins:');
      plugins.forEach(plugin => {
        console.log(`  - ${plugin.name} (${plugin.enabled ? 'enabled' : 'disabled'})`);
      });
    }
    
  } catch (error) {
    console.error('Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
