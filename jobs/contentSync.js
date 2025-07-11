const cron = require('node-cron');
const youtubeService = require('../services/youtubeService');
const twitterService = require('../services/twitterService');
const instagramService = require('../services/instagramService');
const threadsService = require('../services/threadsService');
const tiktokService = require('../services/tiktokService');
const podcastsService = require('../services/podcastsService');
const chromaService = require('../services/chromaService');

// Helper to handle service calls with error handling
async function syncPlatformContent(service, platform) {
  try {
    console.log(`Starting ${platform} sync...`);
    const result = await service.pullContent();
    console.log(`${platform} sync completed:`, result);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error syncing ${platform}:`, error);
    return { success: false, error };
  }
}

// Main sync function that pulls from all platforms
async function syncAllContent() {
  console.log('Starting daily content sync...');
  
  // Sync all platforms in parallel
  const syncResults = await Promise.allSettled([
    syncPlatformContent(youtubeService, 'YouTube'),
    syncPlatformContent(twitterService, 'Twitter'),
    syncPlatformContent(instagramService, 'Instagram'),
    syncPlatformContent(threadsService, 'Threads'),
    syncPlatformContent(tiktokService, 'TikTok'),
    syncPlatformContent(podcastsService, 'Podcasts')
  ]);

  // Log results
  syncResults.forEach((result, index) => {
    const platforms = ['YouTube', 'Twitter', 'Instagram', 'Threads', 'TikTok', 'Podcasts'];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${platforms[index]} sync completed`);
    } else {
      console.error(`❌ ${platforms[index]} sync failed:`, result.reason);
    }
  });

  // Update ChromaDB with new content
  try {
    await chromaService.initializeChromaDB();
    console.log('ChromaDB updated with new content');
  } catch (error) {
    console.error('Error updating ChromaDB:', error);
  }

  console.log('Daily content sync completed');
}

// Schedule daily sync at 00:00 (midnight)
function scheduleDailySync() {
  // Run sync every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled content sync...');
    await syncAllContent();
  });

  console.log('Content sync scheduled to run daily at midnight');
}

// Export functions for manual triggering and scheduling
module.exports = {
  syncAllContent,
  scheduleDailySync
}; 