const axios = require('axios');
const searchService = require('./searchService');
require('dotenv').config();

// Debug logging for environment
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Has RAPIDAPI_KEY:', !!process.env.RAPIDAPI_KEY);

const generateResponse = async (messages) => {
  // Get API key from environment variable
  const apiKey = process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not configured');
  }

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
    // Search for relevant content using the enhanced search service
    const relevantContent = await searchService.searchContent(query);
    console.log('Search results:', relevantContent);

    // If no relevant content found, provide a more helpful response
    if (!relevantContent || relevantContent.length === 0) {
      return {
        answer: `I apologize, but I couldn't find any specific information in Alex Hormozi's content to answer your question about "${query}". 

Here are some suggestions:
1. Try rephrasing your question using different keywords
2. Ask about broader topics that Alex frequently discusses like business growth, scaling, or offer creation
3. Check Alex's YouTube channel directly for the most recent content

Popular topics you can ask about include:
- Alex's entrepreneurial journey
- His experience scaling businesses
- Business acquisition strategies
- Creating and scaling offers
- Marketing and customer acquisition
- Business systems and processes`
      };
    }

    const systemPrompt = `You are an AI assistant that helps search through Alex Hormozi's content across YouTube, Twitter, Instagram, Threads, TikTok, and podcasts. 

Your task is to:
1. ONLY use the provided content to answer questions
2. If the provided content doesn't directly answer the question, acknowledge this and explain what related information you did find
3. When possible, include specific examples or quotes from Alex's content
4. Cite specific videos or content pieces when referencing information
5. Be direct and factual about what the content actually says
6. If the answer is partial, acknowledge what aspects you can and cannot answer based on the available content

Here is the relevant content found to help answer this question:
${relevantContent.join('\n\n')}

Additional context:
- If you're unsure about specific details, say so
- If you need to make assumptions, state them clearly
- Focus on practical, actionable insights from Alex's content
- Maintain Alex's direct communication style while being accurate`;

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
    
    // If the response seems too generic, add a note about content limitations
    if (response.answer && response.answer.length < 50) {
      response.answer += `\n\nNote: I have access to a selection of Alex's content. If you'd like more detailed information, try asking about specific topics from his videos or business experiences.`;
    }
    
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