// Simple schema for Podcast episode data (for validation/future DB use)

const podcastEpisodeSchema = {
  mentor_name: 'string',
  platform: 'string',
  date: 'string', // ISO date
  id: 'string',
  title: 'string',
  description: 'string',
  summary: 'string',
  duration: 'number', // in milliseconds
  audio_url: 'string',
  transcript: 'string',
  show_id: 'string',
  show_name: 'string',
  url: 'string',
  language: 'string',
  explicit: 'boolean',
};

module.exports = podcastEpisodeSchema; 