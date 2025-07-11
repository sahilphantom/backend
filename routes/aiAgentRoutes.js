const express = require('express');
const router = express.Router();
const aiAgentService = require('../services/aiAgentService');
const cors = require('cors');

// Configure CORS for this route
const corsOptions = {
  origin: ['https://mozi-ai.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Apply CORS to all routes in this router
router.use(cors(corsOptions));

// Handle preflight requests explicitly
router.options('*', cors(corsOptions));

// Ensure CORS headers are set for this route
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://mozi-ai.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  next();
});

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