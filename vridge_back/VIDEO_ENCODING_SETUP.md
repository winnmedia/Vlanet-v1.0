# Video Encoding Setup Guide

This guide explains how to set up video encoding functionality for the VideoPlanet platform.

## Prerequisites

1. **FFmpeg**: Install FFmpeg on your server
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install ffmpeg

   # MacOS
   brew install ffmpeg

   # Check installation
   ffmpeg -version
   ```

2. **Redis**: Install Redis for Celery task queue
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server

   # MacOS
   brew install redis

   # Start Redis
   redis-server
   ```

## Installation

1. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run database migrations**
   ```bash
   python manage.py migrate feedbacks
   ```

## Configuration

1. **Environment Variables**: Add to your `.env` file:
   ```
   # Redis configuration for Celery
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

2. **Celery Worker**: Start Celery worker for video processing
   ```bash
   # In development
   celery -A config worker -l info -Q video_processing

   # In production (with supervisor)
   [program:vridge-celery]
   command=/path/to/venv/bin/celery -A config worker -l info -Q video_processing
   directory=/path/to/vridge_back
   user=www-data
   autostart=true
   autorestart=true
   ```

## How It Works

1. **Upload Process**:
   - User uploads video file through frontend
   - Backend saves original file and extracts metadata
   - Celery task is queued for async processing

2. **Encoding Process**:
   - FFmpeg creates optimized web version
   - Multiple quality versions generated (high/medium/low)
   - Thumbnail extracted from video
   - Optional: HLS streaming segments created

3. **Status Tracking**:
   - Frontend polls `/feedbacks/encoding-status/{id}` endpoint
   - Status updates: pending → processing → completed/failed
   - User notified when encoding completes

## Video Processing Features

- **Web Optimization**: Videos optimized for streaming with faststart flag
- **Multiple Qualities**: High (1080p), Medium (720p), Low (480p)
- **Thumbnail Generation**: Automatic thumbnail at 2-second mark
- **Format Conversion**: All videos converted to H.264/AAC for compatibility
- **HLS Streaming**: Optional adaptive bitrate streaming

## API Endpoints

1. **Upload Video** (existing endpoint enhanced):
   ```
   POST /feedbacks/{project_id}
   Response includes: encoding_status, video_metadata
   ```

2. **Check Encoding Status**:
   ```
   GET /feedbacks/encoding-status/{project_id}
   Response: {
     encoding_status: "pending|processing|completed|failed|partial",
     has_web_version: bool,
     has_thumbnail: bool,
     web_video_url: string (if available),
     thumbnail_url: string (if available)
   }
   ```

## Troubleshooting

1. **FFmpeg not found**: Ensure FFmpeg is in system PATH
2. **Celery tasks not running**: Check Redis connection and Celery worker logs
3. **Encoding fails**: Check available disk space and FFmpeg logs
4. **Memory issues**: Adjust Celery worker concurrency for large videos

## Performance Tips

1. Use separate server/container for video processing
2. Configure Celery with appropriate concurrency based on CPU cores
3. Set up S3/CDN for serving encoded videos
4. Monitor disk space for temporary encoding files