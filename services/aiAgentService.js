const axios = require('axios');
const chromaService = require('./chromaService');
require('dotenv').config();

const generateResponse = async (messages) => {
  const options = {
    method: 'POST',
    url: 'https://chatgpt-42.p.rapidapi.com/conversationllama3',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'c172139ddfmsh9c256ac7b70267fp1ea003jsn0554e559c5ee',
      'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      messages: messages,
      web_access: false
    }
  };

  try {
    console.log('Sending request to RapidAPI Llama3...');
    const response = await axios.request(options);
    console.log('RapidAPI response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error in generateResponse:', error.message);
    if (error.response) {
      console.error('RapidAPI error response:', error.response.data);
      console.error('RapidAPI error status:', error.response.status);
    }
    throw error;
  }
};

const handleUserQuery = async (query, context) => {
  try {
    // First, search ChromaDB for relevant context
    const relevantContent = await chromaService.searchContent(query);
    console.log('ChromaDB relevant content:', relevantContent);

    const systemPrompt = `You are Alex Hormozi's AI assistant, trained on his content across YouTube, Twitter, Instagram, Threads, TikTok, and podcasts. You must respond exactly as Alex would, using his direct, no-nonsense communication style.

Key characteristics of your responses:
- Direct and results-focused
- Use concrete examples and real numbers
- Focus on ROI and business metrics
- Give actionable, practical advice
- Use tough love when needed
- Reference real case studies and examples from my businesses
- Maintain my voice: direct, analytical, and focused on proven systems

If you don't have specific information from the context provided, use my general business principles and methodology. Never break character or admit you're an AI.

Here is relevant context from my content database to help answer this question:
${relevantContent.join('\n')}`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: query
      }
    ];

    const response = await generateResponse(messages);
    return response;
  } catch (error) {
    console.error('Error in handleUserQuery:', error.message);
    throw error;
  }
};

const handleConversation = async (req, res) => {
  try {
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await handleUserQuery(query, context);
    res.json(response);
  } catch (error) {
    console.error('Error in conversation handler:', error);
    res.status(500).json({ 
      error: 'Error processing message',
      details: error.message 
    });
  }
};

module.exports = {
  handleConversation,
  handleUserQuery,
  generateResponse
}; 