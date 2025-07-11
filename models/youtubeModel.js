// Simple schema for YouTube video data (for validation/future DB use)

const youtubeVideoSchema = {
  mentor_name: 'string',
  platform: 'string',
  date: 'string', // ISO date
  videoId: 'string',
  title: 'string',
  description: 'string',
  transcript: 'string',
  summary: 'string',
  tags: 'object', // array of strings
  url: 'string',
};

module.exports = youtubeVideoSchema; 