// Simple schema for TikTok video data (for validation/future DB use)

const tiktokVideoSchema = {
  mentor_name: 'string',
  platform: 'string',
  date: 'string', // ISO date
  id: 'string',
  desc: 'string',
  summary: 'string',
  video_url: 'string',
  cover_url: 'string',
  duration: 'number',
  likes: 'number',
  comments: 'number',
  shares: 'number',
  views: 'number',
  url: 'string',
  music: 'string',
  hashtags: 'object', // array of strings
};

module.exports = tiktokVideoSchema; 