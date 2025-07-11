// Simple schema for Threads post data (for validation/future DB use)

const threadsPostSchema = {
  mentor_name: 'string',
  platform: 'string',
  date: 'string', // ISO date
  id: 'string',
  text: 'string',
  summary: 'string',
  likes: 'number',
  replies: 'number',
  reposts: 'number',
  url: 'string',
  is_reply: 'boolean',
  parent_id: 'string', // or null
};

module.exports = threadsPostSchema; 