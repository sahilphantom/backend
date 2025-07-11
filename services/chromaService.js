const { ChromaClient, OpenAIEmbeddingFunction } = require('chromadb');
const path = require('path');
require('dotenv').config();

// Initialize ChromaDB client with persistent storage
const client = new ChromaClient({
  path: "http://localhost:8000",
  auth: {
    provider: "basic",
    credentials: process.env.CHROMA_TOKEN || ""
  }
});

// Use OpenAI embeddings for better semantic search
const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
  model_name: "text-embedding-ada-002"
});

// Collection names for each platform
const COLLECTIONS = {
  YOUTUBE: 'youtube_content',
  TWITTER: 'twitter_content',
  INSTAGRAM: 'instagram_content',
  THREADS: 'threads_content',
  TIKTOK: 'tiktok_content',
  PODCASTS: 'podcasts_content'
};

// Initialize ChromaDB and create collections
async function initializeChromaDB() {
  try {
    console.log('Initializing ChromaDB with persistent storage...');
    
    // Create collections if they don't exist
    for (const [platform, collectionName] of Object.entries(COLLECTIONS)) {
      try {
        // Try to get existing collection
        await client.getCollection({
          name: collectionName,
          embeddingFunction: embedder
        });
        console.log(`Collection ${collectionName} already exists`);
      } catch (error) {
        // Create new collection if it doesn't exist
        await client.createCollection({
          name: collectionName,
          embeddingFunction: embedder,
          metadata: { platform: platform.toLowerCase() }
        });
        console.log(`Created new collection: ${collectionName}`);
      }
    }
    
    console.log('ChromaDB initialization complete!');
    return true;
  } catch (error) {
    console.error('Error initializing ChromaDB:', error);
    throw error;
  }
}

// Get collection by platform
async function getCollection(platform) {
  const collectionName = COLLECTIONS[platform.toUpperCase()];
  if (!collectionName) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  
  return await client.getCollection({
    name: collectionName,
    embeddingFunction: embedder
  });
}

// Add documents to a collection
async function addDocuments(platform, documents) {
  try {
    const collection = await getCollection(platform);
    
    // Prepare documents for ChromaDB
    const ids = documents.map((doc, index) => `${platform}_${doc.id || Date.now()}_${index}`);
    const texts = documents.map(doc => doc.text || doc.content || '');
    const metadatas = documents.map(doc => ({
      mentor_name: 'Alex Hormozi',
      platform: platform.toLowerCase(),
      date: doc.date || new Date().toISOString(),
      url: doc.url || '',
      title: doc.title || '',
      type: doc.type || 'content',
      ...doc.metadata
    }));
    
    // Add documents in batches of 100
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const batchTexts = texts.slice(i, i + batchSize);
      const batchMetadatas = metadatas.slice(i, i + batchSize);
      
      await collection.add({
        ids: batchIds,
        documents: batchTexts,
        metadatas: batchMetadatas
      });
      
      console.log(`Added batch ${i/batchSize + 1} to ${platform} collection`);
    }
    
    console.log(`Successfully added ${documents.length} documents to ${platform} collection`);
    return true;
  } catch (error) {
    console.error(`Error adding documents to ${platform}:`, error);
    throw error;
  }
}

// Search for similar content
async function searchSimilar(platform, query, n_results = 5) {
  try {
    const collection = await getCollection(platform);
    
    const results = await collection.query({
      queryTexts: [query],
      nResults: n_results,
      include: ["metadatas", "distances", "documents"]
    });
    
    return results;
  } catch (error) {
    console.error(`Error searching ${platform}:`, error);
    throw error;
  }
}

// Search across all platforms
async function searchAllPlatforms(query, n_results = 3) {
  const allResults = {};
  
  for (const platform of Object.keys(COLLECTIONS)) {
    try {
      const results = await searchSimilar(platform.toLowerCase(), query, n_results);
      allResults[platform.toLowerCase()] = results;
    } catch (error) {
      console.error(`Error searching ${platform}:`, error);
      allResults[platform.toLowerCase()] = null;
    }
  }
  
  return allResults;
}

// Search content specifically for the AI agent
async function searchContent(query) {
  try {
    const results = await searchAllPlatforms(query, 5);
    
    // Flatten and format results from all platforms
    const formattedResults = [];
    
    for (const [platform, platformResults] of Object.entries(results)) {
      if (platformResults && platformResults.documents && platformResults.documents[0]) {
        platformResults.documents[0].forEach((doc, index) => {
          const metadata = platformResults.metadatas[0][index];
          const distance = platformResults.distances[0][index];
          
          // Only include results with good semantic similarity
          if (distance < 0.8) {
            formattedResults.push(
              `[${platform.toUpperCase()}] ${metadata.title ? `Title: ${metadata.title}\n` : ''}${doc.substring(0, 500)}...`
            );
          }
        });
      }
    }
    
    return formattedResults;
  } catch (error) {
    console.error('Error searching content:', error);
    return []; // Return empty array if search fails
  }
}

module.exports = {
  initializeChromaDB,
  getCollection,
  addDocuments,
  searchSimilar,
  searchAllPlatforms,
  searchContent,
  COLLECTIONS
}; 