const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const DATA_DIR = path.join(__dirname, '../../data/hormozi/tiktok');
const TIKTOK_SEC_UID = 'MS4wLjABAAAAv7iSuuXDJGDvJkmH_vz1qkDZYo1apxgzaxdBSeIuPiM';
const TIKTOK_USER_ID = '107955';

// Fetch recent videos from TikTok user
async function fetchRecentVideos() {
  const options = {
    method: 'GET',
    url: 'https://tiktok-scraper2.p.rapidapi.com/user/videos',
    params: {
      sec_uid: TIKTOK_SEC_UID,
      user_id: TIKTOK_USER_ID
    },
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'tiktok-scraper2.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching TikTok videos:', error);
    throw error;
  }
}

// Fetch transcript for a TikTok video
async function fetchVideoTranscript(videoUrl) {
  const options = {
    method: 'POST',
    url: 'https://tiktok-transcript-ai.p.rapidapi.com/tiktok/index.php',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'tiktok-transcript-ai.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      url: videoUrl
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching video transcript:', error);
    return null; // Return null if transcript fails
  }
}

// Save structured data as JSON
function saveVideoData(videoData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, `${videoData.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
}

// Main function to pull and process TikTok content
async function pullTikTokContent() {
  const videosData = await fetchRecentVideos();
  let processedCount = 0;

  // Adjust this block based on the actual response structure
  if (videosData && Array.isArray(videosData)) {
    for (const video of videosData) {
      const videoUrl = `https://www.tiktok.com/@alexhormozi/video/${video.id}`;
      
      // Fetch transcript for this video
      const transcriptData = await fetchVideoTranscript(videoUrl);
      const transcript = transcriptData?.transcript || transcriptData?.text || '';
      
      const summary = video.desc ? video.desc.slice(0, 200) + '...' : '';
      const videoData = {
        mentor_name: 'Alex Hormozi',
        platform: 'TikTok',
        date: video.create_time || video.timestamp,
        id: video.id,
        desc: video.desc || '',
        summary,
        transcript,
        video_url: video.video?.play_addr?.url_list?.[0] || '',
        cover_url: video.video?.cover?.url_list?.[0] || '',
        duration: video.video?.duration || 0,
        likes: video.stats?.digg_count || 0,
        comments: video.stats?.comment_count || 0,
        shares: video.stats?.share_count || 0,
        views: video.stats?.play_count || 0,
        url: videoUrl,
        music: video.music?.title || '',
        hashtags: video.challenges || [],
      };
      saveVideoData(videoData);
      processedCount++;
    }
  } else if (videosData && videosData.data && Array.isArray(videosData.data)) {
    // Some APIs return { data: [ ... ] }
    for (const video of videosData.data) {
      const videoUrl = `https://www.tiktok.com/@alexhormozi/video/${video.id}`;
      
      // Fetch transcript for this video
      const transcriptData = await fetchVideoTranscript(videoUrl);
      const transcript = transcriptData?.transcript || transcriptData?.text || '';
      
      const summary = video.desc ? video.desc.slice(0, 200) + '...' : '';
      const videoData = {
        mentor_name: 'Alex Hormozi',
        platform: 'TikTok',
        date: video.create_time || video.timestamp,
        id: video.id,
        desc: video.desc || '',
        summary,
        transcript,
        video_url: video.video?.play_addr?.url_list?.[0] || '',
        cover_url: video.video?.cover?.url_list?.[0] || '',
        duration: video.video?.duration || 0,
        likes: video.stats?.digg_count || 0,
        comments: video.stats?.comment_count || 0,
        shares: video.stats?.share_count || 0,
        views: video.stats?.play_count || 0,
        url: videoUrl,
        music: video.music?.title || '',
        hashtags: video.challenges || [],
      };
      saveVideoData(videoData);
      processedCount++;
    }
  }

  return { count: processedCount };
}

module.exports = {
  pullTikTokContent,
}; 