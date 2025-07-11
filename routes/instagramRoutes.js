const express = require('express');
const router = express.Router();
const { fetchInstagramData } = require('../controllers/instagramController');

// POST /api/instagram/fetch - Trigger Instagram data pull
router.post('/fetch', fetchInstagramData);

module.exports = router; 