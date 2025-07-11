const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');
const Parser = require('rss-parser');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const DATA_DIR = path.join(__dirname, '../../data/hormozi/podcasts');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const PODCAST_SHOW_ID = '0ofXAdFIQQRsCYj9754UFx'; // Alex Hormozi's podcast show ID
const RSS_FEED_URL = 'https://feeds.megaphone.fm/game-of-business'; // Alex Hormozi's podcast RSS feed

// RapidAPI configuration for Whisper
const RAPIDAPI_CONFIG = {
  baseURL: 'https://whisper-speech-to-text.p.rapidapi.com/speech-to-text',
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'whisper-speech-to-text.p.rapidapi.com'
  }
};

const parser = new Parser();

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Fetch recent episodes from RSS feed
async function fetchRecentEpisodesFromRSS() {
  try {
    const feed = await parser.parseURL(RSS_FEED_URL);
    return feed.items.map(item => ({
      id: item.guid,
      title: item.title,
      description: item.contentSnippet || item.content,
      published_at: item.pubDate,
      audio_url: item.enclosure?.url,
      duration_ms: parseInt(item.itunes?.duration || '0') * 1000, // Convert to ms
      show_name: feed.title,
      language: item.language || 'en',
      explicit: item.explicit === 'yes'
    }));
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return null;
  }
}

// Fetch recent episodes from Spotify as backup
async function fetchRecentEpisodesFromSpotify() {
  const options = {
    method: 'GET',
    url: 'https://spotify23.p.rapidapi.com/podcast_episodes/',
    params: {
      id: PODCAST_SHOW_ID,
      offset: '0',
      limit: '50'
    },
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'spotify23.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching podcast episodes from Spotify:', error);
    return null;
  }
}

// Download audio file
async function downloadAudioFile(audioUrl, episodeId) {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
    
    const audioPath = path.join(AUDIO_DIR, `${episodeId}.mp3`);
    const fileStream = fs.createWriteStream(audioPath);
    
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    return audioPath;
  } catch (error) {
    console.error(`Error downloading audio for episode ${episodeId}:`, error);
    return null;
  }
}

// Convert audio to format suitable for Whisper
async function convertAudioForWhisper(inputPath) {
  const outputPath = inputPath.replace('.mp3', '.m4a');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('ipod')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

// Transcribe audio using RapidAPI's Whisper endpoint
async function transcribeAudio(audioPath) {
  try {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioPath));

    const response = await axios.post(RAPIDAPI_CONFIG.baseURL, formData, {
      headers: {
        ...RAPIDAPI_CONFIG.headers,
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
}

// Save structured data as JSON
function saveEpisodeData(episodeData) {
  const filePath = path.join(DATA_DIR, `${episodeData.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(episodeData, null, 2));
}

// Clean up audio files
function cleanupAudioFiles(episodeId) {
  const mp3Path = path.join(AUDIO_DIR, `${episodeId}.mp3`);
  const m4aPath = path.join(AUDIO_DIR, `${episodeId}.m4a`);
  
  try {
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    if (fs.existsSync(m4aPath)) fs.unlinkSync(m4aPath);
  } catch (error) {
    console.error('Error cleaning up audio files:', error);
  }
}

// Main function to pull and process Podcast content
async function pullPodcastsContent() {
  let episodes = await fetchRecentEpisodesFromRSS();
  if (!episodes) {
    console.log('Falling back to Spotify API...');
    const spotifyData = await fetchRecentEpisodesFromSpotify();
    episodes = spotifyData?.data || [];
  }

  let processedCount = 0;

  for (const episode of episodes) {
    try {
      console.log(`Processing episode: ${episode.title}`);
      
      // Download and transcribe audio
      const audioPath = await downloadAudioFile(episode.audio_url, episode.id);
      if (!audioPath) {
        console.error(`Failed to download audio for episode ${episode.id}`);
        continue;
      }

      // Convert audio for Whisper
      const convertedPath = await convertAudioForWhisper(audioPath);
      
      // Get transcript
      const transcript = await transcribeAudio(convertedPath);
      
      // Clean up audio files after transcription
      cleanupAudioFiles(episode.id);
      
      if (!transcript) {
        console.error(`Failed to transcribe episode ${episode.id}`);
        continue;
      }

      const summary = episode.description ? episode.description.slice(0, 200) + '...' : '';
      
      const episodeData = {
        mentor_name: 'Alex Hormozi',
        platform: 'Podcasts',
        date: episode.published_at,
        id: episode.id,
        title: episode.title,
        description: episode.description,
        summary,
        duration: episode.duration_ms,
        audio_url: episode.audio_url,
        transcript,
        show_name: episode.show_name,
        url: episode.url || `https://open.spotify.com/episode/${episode.id}`,
        language: episode.language,
        explicit: episode.explicit
      };

      saveEpisodeData(episodeData);
      processedCount++;
      
      console.log(`Successfully processed episode: ${episode.title}`);
    } catch (error) {
      console.error(`Error processing episode ${episode.id}:`, error);
    }
  }

  return { count: processedCount };
}

module.exports = {
  pullPodcastsContent,
}; 