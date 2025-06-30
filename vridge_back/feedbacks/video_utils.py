"""
Video processing utilities for encoding and optimization
"""
import os
import ffmpeg
import logging
from django.conf import settings
from pathlib import Path
import tempfile

logger = logging.getLogger(__name__)

class VideoProcessor:
    """Handle video encoding and optimization"""
    
    # Encoding presets for different quality levels
    ENCODING_PRESETS = {
        'high': {
            'video_bitrate': '5000k',
            'audio_bitrate': '192k',
            'crf': 18,  # Lower CRF = Higher quality
            'preset': 'slow',
            'width': 1920,
            'height': 1080
        },
        'medium': {
            'video_bitrate': '2500k',
            'audio_bitrate': '128k',
            'crf': 23,
            'preset': 'medium',
            'width': 1280,
            'height': 720
        },
        'low': {
            'video_bitrate': '1000k',
            'audio_bitrate': '96k',
            'crf': 28,
            'preset': 'fast',
            'width': 854,
            'height': 480
        }
    }
    
    @staticmethod
    def get_video_info(input_path):
        """Get video metadata"""
        try:
            probe = ffmpeg.probe(input_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            audio_info = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)
            
            return {
                'duration': float(probe['format']['duration']),
                'width': int(video_info['width']),
                'height': int(video_info['height']),
                'fps': eval(video_info['r_frame_rate']),
                'video_codec': video_info['codec_name'],
                'audio_codec': audio_info['codec_name'] if audio_info else None,
                'size': int(probe['format']['size']),
                'bitrate': int(probe['format']['bit_rate'])
            }
        except Exception as e:
            logger.error(f"Error getting video info: {str(e)}")
            return None
    
    @staticmethod
    def encode_video(input_path, output_path, quality='medium'):
        """
        Encode video with specified quality preset
        
        Args:
            input_path: Path to input video
            output_path: Path for output video
            quality: 'high', 'medium', or 'low'
        
        Returns:
            bool: Success status
        """
        try:
            preset = VideoProcessor.ENCODING_PRESETS.get(quality, VideoProcessor.ENCODING_PRESETS['medium'])
            
            # Input stream
            stream = ffmpeg.input(input_path)
            
            # Video encoding settings
            video = stream.video.filter('scale', preset['width'], preset['height'])
            
            # Audio settings
            audio = stream.audio
            
            # Output with encoding parameters
            output = ffmpeg.output(
                video, audio, output_path,
                vcodec='libx264',  # H.264 codec for compatibility
                acodec='aac',      # AAC audio codec
                video_bitrate=preset['video_bitrate'],
                audio_bitrate=preset['audio_bitrate'],
                crf=preset['crf'],
                preset=preset['preset'],
                movflags='faststart',  # Optimize for web streaming
                pix_fmt='yuv420p'  # Ensure compatibility
            )
            
            # Run encoding
            ffmpeg.run(output, overwrite_output=True, capture_stdout=True, capture_stderr=True)
            
            logger.info(f"Successfully encoded video: {output_path}")
            return True
            
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            return False
        except Exception as e:
            logger.error(f"Encoding error: {str(e)}")
            return False
    
    @staticmethod
    def generate_thumbnail(input_path, output_path, time_offset=2.0):
        """
        Generate thumbnail from video
        
        Args:
            input_path: Path to video file
            output_path: Path for thumbnail image
            time_offset: Time in seconds to capture frame
        
        Returns:
            bool: Success status
        """
        try:
            stream = ffmpeg.input(input_path, ss=time_offset)
            stream = ffmpeg.output(stream, output_path, vframes=1)
            ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
            
            logger.info(f"Generated thumbnail: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Thumbnail generation error: {str(e)}")
            return False
    
    @staticmethod
    def create_hls_stream(input_path, output_dir):
        """
        Create HLS (HTTP Live Streaming) segments for adaptive streaming
        
        Args:
            input_path: Path to input video
            output_dir: Directory for HLS segments
        
        Returns:
            bool: Success status
        """
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            # HLS playlist path
            playlist_path = os.path.join(output_dir, 'playlist.m3u8')
            segment_pattern = os.path.join(output_dir, 'segment_%03d.ts')
            
            # Create HLS stream
            stream = ffmpeg.input(input_path)
            stream = ffmpeg.output(
                stream,
                playlist_path,
                format='hls',
                hls_time=10,  # 10 second segments
                hls_list_size=0,  # Keep all segments in playlist
                hls_segment_filename=segment_pattern,
                vcodec='libx264',
                acodec='aac',
                preset='fast',
                crf=23
            )
            
            ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
            
            logger.info(f"Created HLS stream: {playlist_path}")
            return True
            
        except Exception as e:
            logger.error(f"HLS creation error: {str(e)}")
            return False
    
    @staticmethod
    def optimize_for_web(input_path, output_path):
        """
        Optimize video for web streaming (fast start, compatible format)
        
        Args:
            input_path: Path to input video
            output_path: Path for optimized video
        
        Returns:
            bool: Success status
        """
        try:
            # Get original video info
            info = VideoProcessor.get_video_info(input_path)
            if not info:
                return False
            
            # Determine optimal encoding settings based on original
            if info['width'] > 1920 or info['height'] > 1080:
                quality = 'high'
            elif info['width'] > 1280 or info['height'] > 720:
                quality = 'medium'
            else:
                quality = 'low'
            
            # Encode with web optimization
            return VideoProcessor.encode_video(input_path, output_path, quality)
            
        except Exception as e:
            logger.error(f"Web optimization error: {str(e)}")
            return False