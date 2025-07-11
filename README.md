# Mozi AI Backend

This is the backend service for Mozi AI, handling content ingestion from various platforms and AI processing.

## System Requirements

- Node.js 16+
- FFmpeg (required for audio processing)
- Python 3.8+ (for ChromaDB)

## Installation

### 1. Install System Dependencies

#### Windows
```powershell
# Install FFmpeg using Chocolatey
choco install ffmpeg

# Install Python
choco install python
```

#### macOS
```bash
# Install FFmpeg using Homebrew
brew install ffmpeg

# Install Python
brew install python
```

#### Linux (Ubuntu/Debian)
```bash
# Install FFmpeg
sudo apt-get update
sudo apt-get install ffmpeg

# Install Python
sudo apt-get install python3 python3-pip
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the backend directory with the following variables:
```
PORT=5001
RAPIDAPI_KEY=your_rapidapi_key
OPENAI_API_KEY=your_openai_key
```

## Running the Service

1. Start the service:
```bash
npm start
```

2. The service will be available at `http://localhost:5001`

## API Endpoints

- `/api/health` - Health check endpoint
- `/api/youtube` - YouTube content endpoints
- `/api/twitter` - Twitter content endpoints
- `/api/instagram` - Instagram content endpoints
- `/api/threads` - Threads content endpoints
- `/api/tiktok` - TikTok content endpoints
- `/api/podcasts` - Podcast content endpoints
- `/api/chroma` - Vector database endpoints

## Data Storage

Content is stored in the following structure:
```
data/
  hormozi/
    youtube/
    twitter/
    instagram/
    threads/
    tiktok/
    podcasts/
      audio/  # Temporary storage for audio processing
```

## Development

- The service uses ChromaDB for vector storage
- Audio processing uses FFmpeg and OpenAI's Whisper
- Content is pulled from various platforms using their respective APIs
- Daily sync is handled via CRON jobs 