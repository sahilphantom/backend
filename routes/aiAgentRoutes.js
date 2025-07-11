const express = require('express');
const router = express.Router();
const aiAgentService = require('../services/aiAgentService');
const cors = require('cors');

// Configure CORS for this route
const corsOptions = {
  origin: [
    'https://mozi-ai.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true
};

// Apply CORS to all routes in this router
router.use(cors(corsOptions));

// Handle preflight requests
router.options('/chat', cors(corsOptions));

// POST /api/agent/chat - Handle chat conversations
router.post('/chat', async (req, res) => {
  try {
    await aiAgentService.handleConversation(req, res);
  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router; 