const express = require('express');
const router = express.Router();
const { 
  initializeDatabase, 
  addDocumentsToCollection, 
  searchPlatform, 
  searchAll 
} = require('../controllers/chromaController');

// POST /api/chroma/init - Initialize ChromaDB
router.post('/init', initializeDatabase);

// POST /api/chroma/add - Add documents to a collection
router.post('/add', addDocumentsToCollection);

// POST /api/chroma/search - Search a specific platform
router.post('/search', searchPlatform);

// POST /api/chroma/search-all - Search across all platforms
router.post('/search-all', searchAll);

module.exports = router; 