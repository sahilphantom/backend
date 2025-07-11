const chromaService = require('../services/chromaService');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Sample data structure for each platform
const sampleContent = {
  youtube: [
    {
      id: 'video1',
      title: 'How to Scale Your Business',
      content: 'Transcript of the video about scaling business...',
      url: 'https://youtube.com/watch?v=xxx',
      date: '2023-01-01',
      metadata: {
        views: 100000,
        likes: 5000,
        type: 'video'
      }
    }
  ],
  twitter: [
    {
      id: 'tweet1',
      content: "Here's the truth about business success...",
      url: 'https://twitter.com/AlexHormozi/status/xxx',
      date: '2023-01-02',
      metadata: {
        likes: 1000,
        retweets: 500,
        type: 'tweet'
      }
    }
  ]
};

async function loadContentFromFile(platform) {
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', `${platform}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${platform} content:`, error);
    return [];
  }
}

async function ingestContent() {
  try {
    // Initialize ChromaDB
    await chromaService.initializeChromaDB();

    // Process each platform
    for (const platform of Object.keys(chromaService.COLLECTIONS)) {
      console.log(`Processing ${platform} content...`);
      
      // Load content from file
      const content = await loadContentFromFile(platform.toLowerCase());
      
      if (content && content.length > 0) {
        // Ingest content into ChromaDB
        await chromaService.addDocuments(platform.toLowerCase(), content);
        console.log(`Successfully ingested ${content.length} ${platform} documents`);
      } else {
        console.log(`No content found for ${platform}`);
      }
    }

    console.log('Content ingestion complete!');
  } catch (error) {
    console.error('Error during content ingestion:', error);
  }
}

// Run the ingestion
if (require.main === module) {
  ingestContent()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error during ingestion:', error);
      process.exit(1);
    });
}

module.exports = { ingestContent }; 