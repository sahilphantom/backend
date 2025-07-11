// Simple schema for Twitter tweet data (for validation/future DB use)

const twitterTweetSchema = {
  mentor_name: 'string',
  platform: 'string',
  date: 'string', // ISO date
  tweetId: 'string',
  text: 'string',
  summary: 'string',
  likes: 'number',
  retweets: 'number',
  replies: 'number',
  url: 'string',
};

module.exports = twitterTweetSchema; 