const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Get channel ID from environment variable
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const OUTPUT_DIR = path.join(__dirname, '../data/hormozi/youtube');

// Get date 3 months ago
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

async function fetchVideoList(pageToken = '') {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is not set in .env file');
    }

    if (!YOUTUBE_CHANNEL_ID) {
      throw new Error('YOUTUBE_CHANNEL_ID is not set in .env file');
    }

    console.log(`Fetching video list${pageToken ? ' (next page)' : ''}...`);
    console.log(`Channel ID: ${YOUTUBE_CHANNEL_ID}`);
    console.log(`Getting videos published after: ${threeMonthsAgo.toISOString()}`);
    
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        channelId: YOUTUBE_CHANNEL_ID,
        part: 'snippet',
        order: 'date',
        maxResults: 50,
        type: 'video',
        pageToken,
        publishedAfter: threeMonthsAgo.toISOString()
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log('No videos found in the last 3 months.');
      return response.data;
    }

    console.log(`Found ${response.data.items.length} videos in this batch`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error?.message) {
      console.error('YouTube API Error:', error.response.data.error.message);
    } else {
      console.error('Error fetching video list:', error.message);
    }
    throw error;
  }
}

async function fetchVideoDetails(videoId) {
  try {
    console.log(`Fetching details for video ${videoId}...`);
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        id: videoId,
        part: 'snippet,contentDetails,statistics'
      }
    });

    return response.data.items[0];
  } catch (error) {
    console.error(`Error fetching video details for ${videoId}:`, error.message);
    throw error;
  }
}

async function fetchTranscript(videoId, title) {
  try {
    console.log(`Fetching transcript for "${title}" (${videoId})...`);
    
    // First try to get video captions using YouTube API
    try {
      const captionsResponse = await axios.get(`https://www.googleapis.com/youtube/v3/captions`, {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          videoId: videoId,
          part: 'snippet'
        }
      });

      if (captionsResponse.data.items && captionsResponse.data.items.length > 0) {
        const captionId = captionsResponse.data.items[0].id;
        const transcriptResponse = await axios.get(`https://www.googleapis.com/youtube/v3/captions/${captionId}`, {
          params: {
            key: process.env.YOUTUBE_API_KEY,
            tfmt: 'srt'
          }
        });
        return transcriptResponse.data;
      }
    } catch (error) {
      console.log('Could not fetch captions from YouTube API, using RapidAPI fallback...');
    }

    // Fallback to RapidAPI
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
            content: 'You are a transcript generator. Watch the video and provide a detailed transcript of what is being said.'
          },
          {
            role: 'user',
            content: `Please provide a detailed transcript of this YouTube video: https://www.youtube.com/watch?v=${videoId}`
          }
        ],
        web_access: true
      }
    };

    const response = await axios.request(options);
    console.log(`Successfully got transcript for "${title}"`);
    return response.data.answer;
  } catch (error) {
    console.error(`Error fetching transcript for ${videoId}:`, error.message);
    return 'Transcript unavailable';
  }
}

async function generateSummary(transcript, title) {
  try {
    console.log(`Generating summary for "${title}"...`);
    if (!transcript || typeof transcript !== 'string' || transcript === 'Transcript unavailable') {
      console.log('No transcript available for summary generation');
      return 'Summary unavailable - no transcript';
    }

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
            content: 'You are a content summarizer. Provide concise, informative summaries that capture the main points and key takeaways.'
          },
          {
            role: 'user',
            content: `Please provide a concise summary of this transcript, focusing on the main points and key takeaways: ${transcript.slice(0, 3000)}...`
          }
        ],
        web_access: false
      }
    };

    const response = await axios.request(options);
    console.log(`Successfully generated summary for "${title}"`);
    return response.data.answer;
  } catch (error) {
    console.error('Error generating summary:', error.message);
    return 'Summary unavailable - error during generation';
  }
}

async function saveVideo(videoData) {
  try {
    const filePath = path.join(OUTPUT_DIR, `${videoData.videoId}.json`);
    await fs.writeFile(filePath, JSON.stringify(videoData, null, 2));
    console.log(`✓ Saved video data: "${videoData.title}"`);
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error(`Error saving video ${videoData.videoId}:`, error.message);
    throw error;
  }
}

async function syncYouTubeChannel() {
  try {
    console.log('Starting YouTube channel sync...');
    console.log('Creating output directory if needed...');
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    let pageToken = '';
    let totalVideos = 0;
    let pageCount = 1;

    do {
      console.log(`\nProcessing page ${pageCount}...`);
      // Fetch list of videos
      const response = await fetchVideoList(pageToken);
      pageToken = response.nextPageToken;

      // Process each video
      for (const item of response.items) {
        const videoId = item.id.videoId;
        
        // Check if we already have this video
        try {
          await fs.access(path.join(OUTPUT_DIR, `${videoId}.json`));
          console.log(`Video ${videoId} already exists, skipping...`);
          continue;
        } catch {
          // File doesn't exist, proceed with fetching
        }

        // Fetch detailed video information
        const videoDetails = await fetchVideoDetails(videoId);
        const title = videoDetails.snippet.title;
        
        console.log(`\nProcessing video ${totalVideos + 1}: "${title}"`);
        
        // Fetch transcript and generate summary
        const transcript = await fetchTranscript(videoId, title);
        const summary = await generateSummary(transcript, title);

        // Prepare video data
        const videoData = {
          mentor_name: "Alex Hormozi",
          platform: "YouTube",
          date: videoDetails.snippet.publishedAt,
          videoId: videoId,
          title: title,
          description: videoDetails.snippet.description,
          transcript: transcript,
          summary: summary,
          tags: videoDetails.snippet.tags || [],
          url: `https://www.youtube.com/watch?v=${videoId}`,
          statistics: videoDetails.statistics || {}
        };

        // Save video data
        await saveVideo(videoData);
        totalVideos++;

        // Add a small delay to avoid rate limits
        console.log('Waiting 2 seconds before next video...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      pageCount++;
      if (pageToken) {
        console.log('\nWaiting 5 seconds before fetching next page...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } while (pageToken);

    console.log('\n=================================================');
    console.log(`YouTube sync completed! Processed ${totalVideos} new videos`);
    console.log('=================================================');
  } catch (error) {
    console.error('\nError syncing YouTube channel:', error.message);
    throw error;
  }
}

// Export for use in other files
module.exports = {
  syncYouTubeChannel
};

// Run directly if called from command line
if (require.main === module) {
  syncYouTubeChannel()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('YouTube sync failed:', error);
      process.exit(1);
    });
} 