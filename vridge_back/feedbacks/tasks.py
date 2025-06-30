"""
Celery tasks for asynchronous video processing
"""
from celery import shared_task
from django.core.files.base import ContentFile
from .models import FeedBack
from .video_utils import VideoProcessor
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_video_upload(self, feedback_id):
    """
    Process uploaded video file:
    1. Create optimized web version
    2. Generate thumbnail
    3. Create multiple quality versions
    4. Update feedback model with processed files
    """
    try:
        feedback = FeedBack.objects.get(id=feedback_id)
        if not feedback.video_file:
            logger.warning(f"No video file for feedback {feedback_id}")
            return
        
        # Get file paths
        original_path = feedback.video_file.path
        file_name = Path(original_path).stem
        file_dir = Path(original_path).parent
        
        # Update status
        feedback.encoding_status = 'processing'
        feedback.save()
        
        # 1. Generate thumbnail
        thumbnail_path = file_dir / f"{file_name}_thumb.jpg"
        if VideoProcessor.generate_thumbnail(original_path, str(thumbnail_path)):
            with open(thumbnail_path, 'rb') as f:
                feedback.thumbnail.save(f"{file_name}_thumb.jpg", ContentFile(f.read()))
        
        # 2. Create optimized web version
        web_path = file_dir / f"{file_name}_web.mp4"
        if VideoProcessor.optimize_for_web(original_path, str(web_path)):
            with open(web_path, 'rb') as f:
                feedback.video_file_web.save(f"{file_name}_web.mp4", ContentFile(f.read()))
        
        # 3. Create quality versions
        quality_levels = ['high', 'medium', 'low']
        for quality in quality_levels:
            output_path = file_dir / f"{file_name}_{quality}.mp4"
            if VideoProcessor.encode_video(original_path, str(output_path), quality):
                # Save path to model (you'll need to add these fields)
                setattr(feedback, f'video_file_{quality}', str(output_path))
        
        # Update status
        feedback.encoding_status = 'completed'
        feedback.save()
        
        # Clean up temporary files
        for temp_file in [thumbnail_path, web_path]:
            if temp_file.exists():
                temp_file.unlink()
        
        logger.info(f"Successfully processed video for feedback {feedback_id}")
        
    except FeedBack.DoesNotExist:
        logger.error(f"Feedback {feedback_id} not found")
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        # Update status to failed
        try:
            feedback = FeedBack.objects.get(id=feedback_id)
            feedback.encoding_status = 'failed'
            feedback.save()
        except:
            pass
        # Retry the task
        raise self.retry(exc=e, countdown=60)

@shared_task
def create_hls_stream(feedback_id):
    """
    Create HLS stream for video
    """
    try:
        feedback = FeedBack.objects.get(id=feedback_id)
        if not feedback.video_file:
            return
        
        original_path = feedback.video_file.path
        file_name = Path(original_path).stem
        hls_dir = Path(original_path).parent / f"{file_name}_hls"
        
        if VideoProcessor.create_hls_stream(original_path, str(hls_dir)):
            feedback.hls_playlist_url = f"/media/feedback_file/{file_name}_hls/playlist.m3u8"
            feedback.save()
            logger.info(f"Created HLS stream for feedback {feedback_id}")
        
    except Exception as e:
        logger.error(f"Error creating HLS stream: {str(e)}")

@shared_task
def check_video_processing_status(feedback_id):
    """
    Check and update video processing status
    """
    try:
        feedback = FeedBack.objects.get(id=feedback_id)
        
        # Check if all expected files exist
        has_web = bool(feedback.video_file_web)
        has_thumbnail = bool(feedback.thumbnail)
        
        if has_web and has_thumbnail:
            feedback.encoding_status = 'completed'
        else:
            feedback.encoding_status = 'partial'
        
        feedback.save()
        
    except Exception as e:
        logger.error(f"Error checking video status: {str(e)}")