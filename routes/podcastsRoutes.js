const express = require('express');
const router = express.Router();
const { fetchPodcastsData } = require('../controllers/podcastsController');

// POST /api/podcasts/fetch - Trigger Podcasts data pull
router.post('/fetch', fetchPodcastsData);

module.exports = router; 