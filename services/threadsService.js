const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const DATA_DIR = path.join(__dirname, '../../data/hormozi/threads');
const THREADS_USER_ID = '63625256886'; // Alex Hormozi's Threads user ID

// Fetch recent posts from Threads user
async function fetchRecentPosts() {
  const options = {
    method: 'GET',
    url: 'https://threads-api4.p.rapidapi.com/api/user/posts',
    params: {
      user_id: THREADS_USER_ID
    },
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'threads-api4.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching Threads posts:', error);
    throw error;
  }
}

// Save structured data as JSON
function savePostData(postData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, `${postData.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(postData, null, 2));
}

// Main function to pull and process Threads content
async function pullThreadsContent() {
  const postsData = await fetchRecentPosts();
  let processedCount = 0;

  // Adjust this block based on the actual response structure
  if (postsData && Array.isArray(postsData)) {
    for (const post of postsData) {
      const summary = post.text ? post.text.slice(0, 200) + '...' : '';
      const postData = {
        mentor_name: 'Alex Hormozi',
        platform: 'Threads',
        date: post.timestamp || post.created_at,
        id: post.id,
        text: post.text || '',
        summary,
        likes: post.likes || 0,
        replies: post.replies || 0,
        reposts: post.reposts || 0,
        url: post.url || `https://threads.net/@alexhormozi/status/${post.id}`,
        is_reply: post.is_reply || false,
        parent_id: post.parent_id || null,
      };
      savePostData(postData);
      processedCount++;
    }
  } else if (postsData && postsData.data && Array.isArray(postsData.data)) {
    // Some APIs return { data: [ ... ] }
    for (const post of postsData.data) {
      const summary = post.text ? post.text.slice(0, 200) + '...' : '';
      const postData = {
        mentor_name: 'Alex Hormozi',
        platform: 'Threads',
        date: post.timestamp || post.created_at,
        id: post.id,
        text: post.text || '',
        summary,
        likes: post.likes || 0,
        replies: post.replies || 0,
        reposts: post.reposts || 0,
        url: post.url || `https://threads.net/@alexhormozi/status/${post.id}`,
        is_reply: post.is_reply || false,
        parent_id: post.parent_id || null,
      };
      savePostData(postData);
      processedCount++;
    }
  }

  return { count: processedCount };
}

module.exports = {
  pullThreadsContent,
}; 