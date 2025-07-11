const express = require('express');
const router = express.Router();
const aiAgentService = require('../services/aiAgentService');

// POST /api/agent/chat - Handle chat conversations
router.post('/chat', aiAgentService.handleConversation);

module.exports = router; 