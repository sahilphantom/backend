const { pullThreadsContent } = require('../services/threadsService');

// Controller to trigger Threads data pull
async function fetchThreadsData(req, res) {
  try {
    const result = await pullThreadsContent();
    res.json({ success: true, message: `Fetched and saved ${result.count} Threads posts.` });
  } catch (error) {
    console.error('Error fetching Threads data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  fetchThreadsData,
}; 