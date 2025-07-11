const { ChromaClient } = require('chromadb');
const axios = require('axios');
require('dotenv').config();

// Initialize ChromaDB client
const client = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});

// Custom embedding function using RapidAPI LLM
const embedder = {
  async generate(texts) {
    try {
      const options = {
        method: 'POST',
        url: 'https://chatgpt-42.p.rapidapi.com/conversationllama3',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        data: {
          messages: [
            {
              role: 'system',
              content: 'You are a semantic search assistant. For the given text, analyze its key concepts and meaning. Then generate a numerical embedding vector with 1536 dimensions that represents this semantic meaning. Return ONLY a JSON array of 1536 numbers between -1 and 1.'
            },
            {
              role: 'user',
              content: Array.isArray(texts) ? texts[0] : texts // Process one text at a time
            }
          ],
          web_access: false
        }
      };

      const response = await axios.request(options);
      let vector;
      try {
        // Extract the JSON array from the response
        const match = response.data.answer.match(/\[.*\]/);
        vector = match ? JSON.parse(match[0]) : new Array(1536).fill(0);
      } catch (error) {
        console.error('Error parsing vector:', error);
        vector = new Array(1536).fill(0);
      }

      // If multiple texts, process each one
      if (Array.isArray(texts)) {
        const results = [vector];
        for (let i = 1; i < texts.length; i++) {
          options.data.messages[1].content = texts[i];
          const resp = await axios.request(options);
          try {
            const match = resp.data.answer.match(/\[.*\]/);
            results.push(match ? JSON.parse(match[0]) : new Array(1536).fill(0));
          } catch (error) {
            results.push(new Array(1536).fill(0));
          }
        }
        return results;
      }

      return [vector];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      return Array.isArray(texts) ? texts.map(() => new Array(1536).fill(0)) : [new Array(1536).fill(0)];
    }
  }
};

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
    console.log('Initializing ChromaDB...');
    
    // Create collections if they don't exist
    for (const [platform, collectionName] of Object.entries(COLLECTIONS)) {
      try {
        await client.getCollection({
          name: collectionName,
          embeddingFunction: embedder
        });
        console.log(`Collection ${collectionName} exists`);
      } catch (error) {
        await client.createCollection({
          name: collectionName,
          embeddingFunction: embedder,
          metadata: { platform: platform.toLowerCase() }
        });
        console.log(`Created collection: ${collectionName}`);
      }
    }
    
    console.log('ChromaDB initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing ChromaDB:', error);
    throw error;
  }
}

// Add documents to a collection
async function addDocuments(platform, documents) {
  try {
    const collectionName = COLLECTIONS[platform.toUpperCase()];
    if (!collectionName) {
      throw new Error(`Unknown platform: ${platform}`);
    }
    
    const collection = await client.getCollection({
      name: collectionName,
      embeddingFunction: embedder
    });
    
    // Prepare documents for ChromaDB
    const ids = documents.map(doc => `${platform}_${doc.id || Date.now()}`);
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
    
    // Add documents in batches of 10 (since we're using API for embeddings)
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const batchTexts = texts.slice(i, i + batchSize);
      const batchMetadatas = metadatas.slice(i, i + batchSize);
      
      await collection.add({
        ids: batchIds,
        documents: batchTexts,
        metadatas: batchMetadatas
      });
      
      console.log(`Added batch ${i/batchSize + 1} to ${platform}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding documents to ${platform}:`, error);
    throw error;
  }
}

// Search content
async function searchContent(query) {
  try {
    const results = [];
    
    // Search each collection
    for (const platform of Object.keys(COLLECTIONS)) {
      try {
        const collection = await client.getCollection({
          name: COLLECTIONS[platform],
          embeddingFunction: embedder
        });
        
        const response = await collection.query({
          queryTexts: [query],
          nResults: 3,
          include: ["metadatas", "distances", "documents"]
        });
        
        if (response.documents[0]) {
          response.documents[0].forEach((doc, index) => {
            const metadata = response.metadatas[0][index];
            const distance = response.distances[0][index];
            
            // Only include results with good semantic similarity
            if (distance < 0.8) {
              results.push(
                `[${platform}] ${metadata.title ? `Title: ${metadata.title}\n` : ''}${doc.substring(0, 500)}...`
              );
            }
          });
        }
      } catch (error) {
        console.error(`Error searching ${platform}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}

module.exports = {
  initializeChromaDB,
  addDocuments,
  searchContent,
  COLLECTIONS
}; 