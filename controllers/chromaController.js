const { 
  initializeChromaDB, 
  addDocuments, 
  searchSimilar, 
  searchAllPlatforms 
} = require('../services/chromaService');

// Initialize ChromaDB
async function initializeDatabase(req, res) {
  try {
    await initializeChromaDB();
    res.json({ success: true, message: 'ChromaDB initialized successfully!' });
  } catch (error) {
    console.error('Error initializing ChromaDB:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Add documents to a specific platform collection
async function addDocumentsToCollection(req, res) {
  try {
    const { platform, documents } = req.body;
    
    if (!platform || !documents) {
      return res.status(400).json({ 
        success: false, 
        error: 'Platform and documents are required' 
      });
    }
    
    await addDocuments(platform, documents);
    res.json({ 
      success: true, 
      message: `Added ${documents.length} documents to ${platform} collection` 
    });
  } catch (error) {
    console.error('Error adding documents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Search for similar content in a specific platform
async function searchPlatform(req, res) {
  try {
    const { platform, query, n_results = 5 } = req.body;
    
    if (!platform || !query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Platform and query are required' 
      });
    }
    
    const results = await searchSimilar(platform, query, n_results);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching platform:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Search across all platforms
async function searchAll(req, res) {
  try {
    const { query, n_results = 3 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query is required' 
      });
    }
    
    const results = await searchAllPlatforms(query, n_results);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching all platforms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  initializeDatabase,
  addDocumentsToCollection,
  searchPlatform,
  searchAll
}; 