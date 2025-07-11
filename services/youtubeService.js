const axios = require('axios');
const fs = require('fs');
const path = require('path');

// TODO: Replace with your actual YouTube API key and channel ID
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'YOUR_CHANNEL_ID';
const DATA_DIR = path.join(__dirname, '../../data/hormozi/youtube');

// Helper to get date string for 3 months ago
function getThreeMonthsAgoISO() {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  return date.toISOString();
}

// Fetch videos from YouTube channel (last 3 months)
async function fetchRecentVideos() {
  const publishedAfter = getThreeMonthsAgoISO();
  let videos = [];
  let nextPageToken = '';

  do {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const res = await axios.get(url);
    videos = videos.concat(res.data.items);
    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return videos;
}

// Fetch transcript for a video (using YouTube's built-in transcript API or a third-party service)
async function fetchTranscript(videoId) {
  // Placeholder: Implement actual transcript fetching logic or use a third-party API
  // For MVP, return dummy transcript
  return `Transcript for video ${videoId}`;
}

// Save structured data as JSON
function saveVideoData(videoData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, `${videoData.videoId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
}

// Main function to pull and process YouTube content
async function pullYouTubeContent() {
  const videos = await fetchRecentVideos();
  for (const video of videos) {
    const videoId = video.id.videoId;
    const transcript = await fetchTranscript(videoId);
    // TODO: Add summarization logic here
    const summary = transcript.slice(0, 200) + '...'; // Placeholder summary
    const videoData = {
      mentor_name: 'Alex Hormozi',
      platform: 'YouTube',
      date: video.snippet.publishedAt,
      videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      transcript,
      summary,
      tags: video.snippet.tags || [],
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
    saveVideoData(videoData);
  }
  return { count: videos.length };
}

module.exports = {
  pullYouTubeContent,
}; 