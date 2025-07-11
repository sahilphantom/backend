const axios = require('axios');
const fs = require('fs');
const path = require('path');

// TODO: Replace with your actual RapidAPI key
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'c172139ddfmsh9c256ac7b70267fp1ea003jsn0554e559c5ee';
const TWITTER_USER_ID = '2455740283'; // Alex Hormozi's Twitter user ID
const DATA_DIR = path.join(__dirname, '../../data/hormozi/twitter');

// Fetch recent tweets from Twitter user
async function fetchRecentTweets() {
  const options = {
    method: 'GET',
    url: 'https://twitter241.p.rapidapi.com/user-tweets',
    params: {
      user: TWITTER_USER_ID,
      count: '20'
    },
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

// Save structured data as JSON
function saveTweetData(tweetData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, `${tweetData.tweetId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(tweetData, null, 2));
}

// Main function to pull and process Twitter content
async function pullTwitterContent() {
  const tweetsData = await fetchRecentTweets();
  let processedCount = 0;

  if (tweetsData && tweetsData.data) {
    for (const tweet of tweetsData.data) {
      // TODO: Add summarization logic here
      const summary = tweet.text.slice(0, 200) + '...'; // Placeholder summary
      
      const tweetData = {
        mentor_name: 'Alex Hormozi',
        platform: 'Twitter',
        date: tweet.created_at,
        tweetId: tweet.id,
        text: tweet.text,
        summary,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        url: `https://twitter.com/AlexHormozi/status/${tweet.id}`
      };
      
      saveTweetData(tweetData);
      processedCount++;
    }
  }

  return { count: processedCount };
}

module.exports = {
  pullTwitterContent,
}; 