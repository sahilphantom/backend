const { pullInstagramContent } = require('../services/instagramService');

// Controller to trigger Instagram data pull
async function fetchInstagramData(req, res) {
  try {
    const result = await pullInstagramContent();
    res.json({ success: true, message: `Fetched and saved ${result.count} Instagram posts.` });
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  fetchInstagramData,
}; 