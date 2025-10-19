/**
 * Discord API Cache Cleanup Script
 * Removes expired cache entries to keep the database clean
 * @author fkndean_
 * @date 2025-01-27
 */

import DiscordApiCacheService from '../packages/api/src/services/DiscordApiCacheService.js';

/**
 * Cleanup expired Discord API cache entries
 */
async function cleanupExpiredCache() {
  try {
    console.log('🧹 Starting Discord API cache cleanup...');
    
    const stats = await DiscordApiCacheService.getStats();
    console.log(`📊 Cache stats before cleanup:`, stats);
    
    const clearedCount = await DiscordApiCacheService.clearExpired();
    
    const newStats = await DiscordApiCacheService.getStats();
    console.log(`✅ Cleaned up ${clearedCount} expired cache entries`);
    console.log(`📊 Cache stats after cleanup:`, newStats);
    
    return clearedCount;
  } catch (error) {
    console.error('❌ Error during cache cleanup:', error);
    throw error;
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpiredCache()
    .then(() => {
      console.log('🎉 Cache cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cache cleanup failed:', error);
      process.exit(1);
    });
}

export default cleanupExpiredCache;
