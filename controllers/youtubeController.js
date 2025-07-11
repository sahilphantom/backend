const { pullYouTubeContent } = require('../services/youtubeService');

// Controller to trigger YouTube data pull
async function fetchYouTubeData(req, res) {
  try {
    const result = await pullYouTubeContent();
    res.json({ success: true, message: `Fetched and saved ${result.count} videos.` });
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  fetchYouTubeData,
}; 