require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scheduleDailySync } = require('./jobs/contentSync');

const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS with all necessary options
const corsOptions = {
  origin: ['https://mozi-ai.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Enable CORS preflight request caching for 24 hours
};

// Apply CORS middleware before any routes
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Log environment variables (safely)
console.log('Environment Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Has RAPIDAPI_KEY:', !!process.env.RAPIDAPI_KEY);

// Global middleware to ensure CORS headers are always set
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://mozi-ai.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Route imports
const youtubeRoutes = require('./routes/youtubeRoutes');
const twitterRoutes = require('./routes/twitterRoutes');
const instagramRoutes = require('./routes/instagramRoutes');
const threadsRoutes = require('./routes/threadsRoutes');
const tiktokRoutes = require('./routes/tiktokRoutes');
const podcastsRoutes = require('./routes/podcastsRoutes');
const aiAgentRoutes = require('./routes/aiAgentRoutes');

// Apply routes
app.use('/api/youtube', youtubeRoutes);
app.use('/api/twitter', twitterRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/podcasts', podcastsRoutes);
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server initialization complete');
  
  // Initialize daily content sync
  scheduleDailySync();
}); 