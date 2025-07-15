from django.utils.deprecation import MiddlewareMixin
import mimetypes
from urllib.parse import unquote
from django.http import HttpResponseNotFound
import os
from django.conf import settings

class MediaHeadersMiddleware(MiddlewareMixin):
    """미디어 파일에 대한 적절한 헤더 설정"""
    
    def process_request(self, request):
        """미디어 파일 요청 처리"""
        if request.path.startswith('/media/'):
            import logging
            logger = logging.getLogger(__name__)
            
            # URL 디코딩
            decoded_path = unquote(request.path)
            logger.info(f"Media request - Original path: {request.path}")
            logger.info(f"Media request - Decoded path: {decoded_path}")
            
            # 실제 파일 경로 생성
            relative_path = decoded_path.replace('/media/', '')
            file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            
            # 파일 존재 여부 확인
            if not os.path.exists(file_path):
                logger.warning(f"File not found at: {file_path}")
                
                # 인코딩된 버전도 확인
                encoded_path = request.path.replace('/media/', '')
                encoded_file_path = os.path.join(settings.MEDIA_ROOT, encoded_path)
                
                if os.path.exists(encoded_file_path):
                    logger.info(f"Found file at encoded path: {encoded_file_path}")
                    # 파일이 인코딩된 경로에 있으면 그대로 진행
                else:
                    # 한글 파일명 디버깅을 위한 디렉토리 리스팅
                    try:
                        dir_path = os.path.dirname(file_path)
                        if os.path.exists(dir_path):
                            files_in_dir = os.listdir(dir_path)
                            logger.info(f"Files in directory {dir_path}: {files_in_dir[:5]}")  # 처음 5개만
                    except Exception as e:
                        logger.error(f"Error listing directory: {e}")
                    
                    return HttpResponseNotFound('File not found')
    
    def process_response(self, request, response):
        if request.path.startswith('/media/'):
            # Content-Type 설정
            content_type, _ = mimetypes.guess_type(request.path)
            if content_type:
                response['Content-Type'] = content_type
            
            # CORS 헤더 추가 - settings.py의 CORS_ALLOWED_ORIGINS 기반
            origin = request.headers.get('Origin', '')
            allowed_origins = [
                'https://vlanet.net',
                'https://www.vlanet.net',
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'https://vlanet-v1-0.vercel.app',
                'https://videoplanet.up.railway.app',
                'https://api.vlanet.net',
            ]
            
            # Origin이 허용된 목록에 있으면 해당 Origin 사용, 아니면 vlanet.net 사용
            if origin in allowed_origins:
                response['Access-Control-Allow-Origin'] = origin
            else:
                response['Access-Control-Allow-Origin'] = 'https://vlanet.net'
            
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
            response['Access-Control-Allow-Headers'] = 'Range, Content-Type, Accept, Origin'
            response['Access-Control-Allow-Credentials'] = 'true'
            
            # 비디오 파일인 경우 추가 헤더
            if any(request.path.endswith(ext) for ext in ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']):
                response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
                response['Accept-Ranges'] = 'bytes'
                response['Cache-Control'] = 'public, max-age=3600'
            else:
                # 이미지 및 기타 미디어 파일
                response['Cache-Control'] = 'public, max-age=86400'  # 24시간
                
        return response