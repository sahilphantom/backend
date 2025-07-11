require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scheduleDailySync } = require('./jobs/contentSync');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

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

const chromaRoutes = require('./routes/chromaRoutes');
app.use('/api/chroma', chromaRoutes);

const aiAgentRoutes = require('./routes/aiAgentRoutes');
app.use('/api/agent', aiAgentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mozi AI backend is running.' });
});

// Initialize daily content sync
scheduleDailySync();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 