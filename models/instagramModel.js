// Simple schema for Instagram post data (for validation/future DB use)

const instagramPostSchema = {
  mentor_name: 'string',
  platform: 'string',
  date: 'string', // ISO date
  id: 'string',
  caption: 'string',
  summary: 'string',
  media_url: 'string',
  permalink: 'string',
  is_video: 'boolean',
  tags: 'object', // array of strings
  type: 'string',
};

module.exports = instagramPostSchema; 