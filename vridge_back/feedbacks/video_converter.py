"""
비디오 형식 변환 유틸리티
AVI, MKV 등의 형식을 웹 호환 MP4로 변환
"""

import os
import subprocess
import logging
from pathlib import Path
from django.conf import settings
from celery import shared_task

logger = logging.getLogger(__name__)

class VideoConverter:
    """비디오 변환 클래스"""
    
    SUPPORTED_INPUT_FORMATS = ['.avi', '.mkv', '.wmv', '.flv', '.mov', '.m4v']
    WEB_COMPATIBLE_FORMATS = ['.mp4', '.webm']
    
    @staticmethod
    def is_web_compatible(file_path):
        """웹 브라우저에서 재생 가능한 형식인지 확인"""
        extension = Path(file_path).suffix.lower()
        return extension in VideoConverter.WEB_COMPATIBLE_FORMATS
    
    @staticmethod
    def needs_conversion(file_path):
        """변환이 필요한 형식인지 확인"""
        extension = Path(file_path).suffix.lower()
        return extension in VideoConverter.SUPPORTED_INPUT_FORMATS
    
    @staticmethod
    def convert_to_mp4(input_path, output_path=None):
        """비디오를 MP4 형식으로 변환"""
        if not output_path:
            input_file = Path(input_path)
            output_path = input_file.with_suffix('.mp4')
        
        try:
            # FFmpeg 명령어 구성
            command = [
                'ffmpeg',
                '-i', str(input_path),          # 입력 파일
                '-c:v', 'libx264',              # H.264 비디오 코덱
                '-preset', 'medium',            # 인코딩 속도/품질 균형
                '-crf', '23',                   # 품질 설정 (0-51, 낮을수록 고품질)
                '-c:a', 'aac',                  # AAC 오디오 코덱
                '-b:a', '128k',                 # 오디오 비트레이트
                '-movflags', '+faststart',      # 웹 스트리밍 최적화
                '-max_muxing_queue_size', '1024',  # 큐 사이즈 증가
                '-y',                           # 기존 파일 덮어쓰기
                str(output_path)
            ]
            
            logger.info(f"Converting video: {input_path} -> {output_path}")
            
            # FFmpeg 실행
            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            
            logger.info(f"Video conversion completed: {output_path}")
            return str(output_path)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed: {e.stderr}")
            raise Exception(f"Video conversion failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Unexpected error during conversion: {str(e)}")
            raise

    @staticmethod
    def convert_to_hls(input_path, output_dir):
        """비디오를 HLS 스트리밍 형식으로 변환"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        playlist_path = output_dir / 'playlist.m3u8'
        
        try:
            command = [
                'ffmpeg',
                '-i', str(input_path),
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-hls_time', '10',              # 각 세그먼트 길이 (초)
                '-hls_list_size', '0',          # 모든 세그먼트 유지
                '-hls_segment_filename', str(output_dir / 'segment_%03d.ts'),
                '-f', 'hls',
                str(playlist_path)
            ]
            
            logger.info(f"Converting to HLS: {input_path} -> {playlist_path}")
            
            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            
            logger.info(f"HLS conversion completed: {playlist_path}")
            return str(playlist_path)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"HLS conversion failed: {e.stderr}")
            raise Exception(f"HLS conversion failed: {e.stderr}")

    @staticmethod
    def get_video_info(file_path):
        """비디오 파일 정보 추출"""
        try:
            command = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                str(file_path)
            ]
            
            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            
            import json
            info = json.loads(result.stdout)
            
            video_stream = next(
                (s for s in info.get('streams', []) if s['codec_type'] == 'video'),
                None
            )
            
            if video_stream:
                return {
                    'width': video_stream.get('width'),
                    'height': video_stream.get('height'),
                    'duration': float(info['format'].get('duration', 0)),
                    'codec': video_stream.get('codec_name'),
                    'bitrate': int(info['format'].get('bit_rate', 0)),
                    'size': int(info['format'].get('size', 0))
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get video info: {str(e)}")
            return None


# Celery 태스크
@shared_task
def convert_video_async(input_path, output_format='mp4'):
    """비동기 비디오 변환 태스크"""
    converter = VideoConverter()
    
    if output_format == 'mp4':
        return converter.convert_to_mp4(input_path)
    elif output_format == 'hls':
        output_dir = Path(input_path).parent / 'hls'
        return converter.convert_to_hls(input_path, output_dir)
    else:
        raise ValueError(f"Unsupported output format: {output_format}")


@shared_task
def auto_convert_on_upload(file_path):
    """업로드 시 자동 변환"""
    converter = VideoConverter()
    
    # 변환이 필요한지 확인
    if not converter.needs_conversion(file_path):
        logger.info(f"No conversion needed for: {file_path}")
        return file_path
    
    # MP4로 변환
    try:
        mp4_path = converter.convert_to_mp4(file_path)
        
        # 원본 파일 삭제 (선택사항)
        # os.remove(file_path)
        
        return mp4_path
    except Exception as e:
        logger.error(f"Auto conversion failed: {str(e)}")
        return file_path  # 실패 시 원본 반환