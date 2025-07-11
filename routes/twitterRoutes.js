const express = require('express');
const router = express.Router();
const { fetchTwitterData } = require('../controllers/twitterController');

// POST /api/twitter/fetch - Trigger Twitter data pull
router.post('/fetch', fetchTwitterData);

module.exports = router; 