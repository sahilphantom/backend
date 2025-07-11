const express = require('express');
const router = express.Router();
const { fetchYouTubeData } = require('../controllers/youtubeController');

// POST /api/youtube/fetch - Trigger YouTube data pull
router.post('/fetch', fetchYouTubeData);

module.exports = router; 