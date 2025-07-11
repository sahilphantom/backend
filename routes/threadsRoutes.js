const express = require('express');
const router = express.Router();
const { fetchThreadsData } = require('../controllers/threadsController');

// POST /api/threads/fetch - Trigger Threads data pull
router.post('/fetch', fetchThreadsData);

module.exports = router; 