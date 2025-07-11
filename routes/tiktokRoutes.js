const express = require('express');
const router = express.Router();
const { fetchTikTokData } = require('../controllers/tiktokController');

// POST /api/tiktok/fetch - Trigger TikTok data pull
router.post('/fetch', fetchTikTokData);

module.exports = router; 