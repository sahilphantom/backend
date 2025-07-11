const { pullPodcastsContent } = require('../services/podcastsService');

// Controller to trigger Podcasts data pull
async function fetchPodcastsData(req, res) {
  try {
    const result = await pullPodcastsContent();
    res.json({ success: true, message: `Fetched and saved ${result.count} podcast episodes.` });
  } catch (error) {
    console.error('Error fetching Podcasts data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  fetchPodcastsData,
}; 