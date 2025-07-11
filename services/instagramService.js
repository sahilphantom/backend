const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const DATA_DIR = path.join(__dirname, '../../data/hormozi/instagram');
const INSTAGRAM_USERNAME = 'alexhormozi';

// Fetch Instagram profile
async function fetchProfile() {
  const options = {
    method: 'POST',
    url: 'https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_v3.php',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY
    },
    data: new URLSearchParams({ user: INSTAGRAM_USERNAME }).toString()
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    throw error;
  }
}

// Fetch recent posts from Instagram user
async function fetchRecentPosts() {
  const options = {
    method: 'POST',
    url: 'https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_posts.php',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY
    },
    data: new URLSearchParams({ username: INSTAGRAM_USERNAME }).toString()
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
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

// Main function to pull and process Instagram content
async function pullInstagramContent() {
  const postsData = await fetchRecentPosts();
  let processedCount = 0;

  // Adjust this block based on the actual response structure
  if (postsData && Array.isArray(postsData)) {
    for (const post of postsData) {
      const summary = post.caption ? post.caption.slice(0, 200) + '...' : '';
      const postData = {
        mentor_name: 'Alex Hormozi',
        platform: 'Instagram',
        date: post.timestamp || post.taken_at_timestamp,
        id: post.id,
        caption: post.caption || '',
        summary,
        media_url: post.media_url || post.display_url || '',
        permalink: post.permalink || '',
        is_video: post.is_video || false,
        tags: post.tags || [],
        type: post.type || '',
      };
      savePostData(postData);
      processedCount++;
    }
  } else if (postsData && postsData.data && Array.isArray(postsData.data)) {
    // Some APIs return { data: [ ... ] }
    for (const post of postsData.data) {
      const summary = post.caption ? post.caption.slice(0, 200) + '...' : '';
      const postData = {
        mentor_name: 'Alex Hormozi',
        platform: 'Instagram',
        date: post.timestamp || post.taken_at_timestamp,
        id: post.id,
        caption: post.caption || '',
        summary,
        media_url: post.media_url || post.display_url || '',
        permalink: post.permalink || '',
        is_video: post.is_video || false,
        tags: post.tags || [],
        type: post.type || '',
      };
      savePostData(postData);
      processedCount++;
    }
  }

  return { count: processedCount };
}

module.exports = {
  pullInstagramContent,
  fetchProfile,
}; 