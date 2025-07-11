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

// Calculate relevance score based on various factors
function calculateRelevance(content, searchTerms) {
  let score = 0;
  const text = {
    title: (content.title || '').toLowerCase(),
    description: (content.description || '').toLowerCase(),
    transcript: (content.transcript || '').toLowerCase(),
    summary: (content.summary || '').toLowerCase(),
    tags: (content.tags || []).join(' ').toLowerCase()
  };

  for (const term of searchTerms) {
    // Title matches are most important
    if (text.title.includes(term)) {
      score += 10;
    }
    // Tag matches are second most important
    if (text.tags.includes(term)) {
      score += 5;
    }
    // Description matches
    if (text.description.includes(term)) {
      score += 3;
    }
    // Transcript and summary matches
    if (text.transcript !== 'transcript unavailable' && text.transcript.includes(term)) {
      score += 2;
    }
    if (text.summary !== 'summary unavailable - no transcript' && text.summary.includes(term)) {
      score += 2;
    }
  }

  // Bonus for matching all terms in any field
  if (searchTerms.every(term => 
    text.title.includes(term) || 
    text.description.includes(term) || 
    text.tags.includes(term) ||
    (text.transcript !== 'transcript unavailable' && text.transcript.includes(term)) ||
    (text.summary !== 'summary unavailable - no transcript' && text.summary.includes(term))
  )) {
    score += 15;
  }

  return score;
}

// Enhanced search function with better matching and scoring
async function searchContent(query) {
  try {
    const youtubeContent = await loadYouTubeContent();
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    const results = [];

    for (const content of youtubeContent) {
      const relevanceScore = calculateRelevance(content, searchTerms);
      
      // Only include results with some relevance
      if (relevanceScore > 0) {
        results.push({
          ...content,
          relevanceScore
        });
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top 5 most relevant results
    return results.slice(0, 5).map(result => {
      let formattedResult = `[${result.source}] Title: ${result.title}\n`;
      
      // Add description if it contains any search terms
      if (searchTerms.some(term => result.description.toLowerCase().includes(term))) {
        formattedResult += `Description: ${result.description}\n`;
      }

      // Add URL
      formattedResult += `URL: ${result.url}\n`;

      // Add relevant tag matches
      const matchingTags = result.tags.filter(tag => 
        searchTerms.some(term => tag.toLowerCase().includes(term))
      );
      if (matchingTags.length > 0) {
        formattedResult += `Relevant Tags: ${matchingTags.join(', ')}\n`;
      }

      // Add summary if available and relevant
      if (result.summary && result.summary !== 'Summary unavailable - no transcript' &&
          searchTerms.some(term => result.summary.toLowerCase().includes(term))) {
        formattedResult += `Summary: ${result.summary}\n`;
      }

      // Add transcript excerpt if available and relevant
      if (result.transcript && result.transcript !== 'Transcript unavailable' &&
          searchTerms.some(term => result.transcript.toLowerCase().includes(term))) {
        const excerpt = result.transcript.substring(0, 300);
        formattedResult += `Relevant transcript excerpt: ${excerpt}...\n`;
      }

      return formattedResult;
    });
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}

module.exports = {
  searchContent,
  loadYouTubeContent
}; 