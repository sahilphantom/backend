const fs = require('fs').promises;
const path = require('path');

// Function to load all YouTube content
async function loadYouTubeContent() {
  try {
    const youtubeDir = path.join(__dirname, '../data/hormozi/youtube');
    const files = await fs.readdir(youtubeDir);
    const contents = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = JSON.parse(
          await fs.readFile(path.join(youtubeDir, file), 'utf8')
        );
        contents.push({
          ...content,
          source: 'YOUTUBE',
          sourceFile: file
        });
      }
    }

    return contents;
  } catch (error) {
    console.error('Error loading YouTube content:', error);
    return [];
  }
}

// Simple search function that looks for keyword matches
async function searchContent(query) {
  try {
    const youtubeContent = await loadYouTubeContent();
    const results = [];
    const searchTerms = query.toLowerCase().split(' ');

    for (const content of youtubeContent) {
      // Combine all searchable content
      const searchableText = `
        ${content.title || ''}
        ${content.description || ''}
        ${content.transcript || ''}
        ${content.summary || ''}
      `.toLowerCase();

      // Check if all search terms are present
      const matches = searchTerms.every(term => searchableText.includes(term));

      if (matches) {
        results.push({
          source: content.source,
          title: content.title,
          description: content.description,
          url: content.url,
          transcript: content.transcript,
          summary: content.summary
        });
      }
    }

    // Sort results by relevance (currently just by title length as a simple metric)
    results.sort((a, b) => a.title.length - b.title.length);

    // Format results for display
    return results.map(result => 
      `[${result.source}] Title: ${result.title}\n` +
      `Description: ${result.description}\n` +
      `URL: ${result.url}\n` +
      `${result.summary ? `Summary: ${result.summary}\n` : ''}` +
      `${result.transcript ? `Relevant transcript excerpt: ${result.transcript.substring(0, 300)}...\n` : ''}`
    );
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}

module.exports = {
  searchContent,
  loadYouTubeContent
}; 