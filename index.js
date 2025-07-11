require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scheduleDailySync } = require('./jobs/contentSync');

const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS with all necessary options
const corsOptions = {
  origin: [
    'https://mozi-ai.netlify.app',
    'http://localhost:3000',
    // Add any other frontend domains here
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Log environment variables (safely)
console.log('Environment Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Has RAPIDAPI_KEY:', !!process.env.RAPIDAPI_KEY);

// Add security headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://mozi-ai.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

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