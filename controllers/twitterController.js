const { pullTwitterContent } = require('../services/twitterService');

// Controller to trigger Twitter data pull
async function fetchTwitterData(req, res) {
  try {
    const result = await pullTwitterContent();
    res.json({ success: true, message: `Fetched and saved ${result.count} tweets.` });
  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  fetchTwitterData,
}; 