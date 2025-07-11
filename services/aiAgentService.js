const axios = require('axios');
const searchService = require('./searchService');
require('dotenv').config();

// Debug logging for environment
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Has RAPIDAPI_KEY:', !!process.env.RAPIDAPI_KEY);

const generateResponse = async (messages) => {
  // Temporarily hardcode the API key
  const apiKey = 'df318559e4msha0132b05f51e5f1p17a0e5jsn21ec099089a2';
  
  // Debug log the key being used (mask most of it)
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  console.log('Using API key:', maskedKey);

  const options = {
    method: 'POST',
    url: 'https://chatgpt-42.p.rapidapi.com/conversationllama3',
    headers: {
      'x-rapidapi-key': apiKey,
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
      
      if (error.response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
    }
    throw error;
  }
};

const handleUserQuery = async (query, context) => {
  try {
    // Search for relevant content using the new search service
    const relevantContent = await searchService.searchContent(query);
    console.log('Search results:', relevantContent);

    // If no relevant content found, return an appropriate message
    if (!relevantContent || relevantContent.length === 0) {
      return {
        answer: "I could not find any relevant information in Alex Hormozi's content to answer this question accurately."
      };
    }

    const systemPrompt = `You are an AI assistant that helps search through Alex Hormozi's content across YouTube, Twitter, Instagram, Threads, TikTok, and podcasts. 

Your task is to:
1. ONLY use the provided content to answer questions
2. If the provided content doesn't directly answer the question, say so
3. Do not make up information or try to stay in character
4. Be direct and factual about what the content actually says

Here is the relevant content found to help answer this question:
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

module.exports = {
  handleConversation: async (req, res) => {
    try {
      const { query, context } = req.body;
      
      if (!query) {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: 'Query is required'
        });
      }

      const response = await handleUserQuery(query, context);
      res.json(response);
    } catch (error) {
      console.error('Error in conversation handler:', error);
      
      if (error.message.includes('rate limit exceeded')) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          details: 'Please try again in a few minutes'
        });
      }

      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  },
  handleUserQuery,
  generateResponse
}; 