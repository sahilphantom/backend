const { pullTikTokContent } = require('../services/tiktokService');

// Controller to trigger TikTok data pull
async function fetchTikTokData(req, res) {
  try {
    const result = await pullTikTokContent();
    res.json({ success: true, message: `Fetched and saved ${result.count} TikTok videos.` });
  } catch (error) {
    console.error('Error fetching TikTok data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  fetchTikTokData,
}; 