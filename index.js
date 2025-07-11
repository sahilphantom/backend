require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scheduleDailySync } = require('./jobs/contentSync');

const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS
const corsOptions = {
  origin: ['https://mozi-ai.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Log environment variables (safely)
console.log('Environment Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Has RAPIDAPI_KEY:', !!process.env.RAPIDAPI_KEY);

const youtubeRoutes = require('./routes/youtubeRoutes');
app.use('/api/youtube', youtubeRoutes);

const twitterRoutes = require('./routes/twitterRoutes');
app.use('/api/twitter', twitterRoutes);

const instagramRoutes = require('./routes/instagramRoutes');
app.use('/api/instagram', instagramRoutes);

const threadsRoutes = require('./routes/threadsRoutes');
app.use('/api/threads', threadsRoutes);

const tiktokRoutes = require('./routes/tiktokRoutes');
app.use('/api/tiktok', tiktokRoutes);

const podcastsRoutes = require('./routes/podcastsRoutes');
app.use('/api/podcasts', podcastsRoutes);

const aiAgentRoutes = require('./routes/aiAgentRoutes');
app.use('/api/agent', aiAgentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Mozi AI backend is running.',
    services: {
      rapidapi: !!process.env.RAPIDAPI_KEY ? 'configured' : 'not configured'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server initialization complete');
  
  // Initialize daily content sync
  scheduleDailySync();
}); 