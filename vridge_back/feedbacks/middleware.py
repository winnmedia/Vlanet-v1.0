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
            # URL 디코딩
            decoded_path = unquote(request.path)
            
            # 실제 파일 경로 생성
            file_path = os.path.join(settings.MEDIA_ROOT, decoded_path.replace('/media/', ''))
            
            # 파일 존재 여부 확인
            if not os.path.exists(file_path):
                # 인코딩된 버전도 확인
                encoded_path = request.path.replace('/media/', '')
                encoded_file_path = os.path.join(settings.MEDIA_ROOT, encoded_path)
                
                if not os.path.exists(encoded_file_path):
                    return HttpResponseNotFound('File not found')
    
    def process_response(self, request, response):
        if request.path.startswith('/media/'):
            # 비디오 파일인 경우
            if any(request.path.endswith(ext) for ext in ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']):
                # Content-Type 설정
                content_type, _ = mimetypes.guess_type(request.path)
                if content_type:
                    response['Content-Type'] = content_type
                
                # CORS 헤더 추가
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
                response['Access-Control-Allow-Headers'] = 'Range, Content-Type'
                response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
                
                # 비디오 스트리밍을 위한 헤더
                response['Accept-Ranges'] = 'bytes'
                
                # 캐시 설정
                response['Cache-Control'] = 'public, max-age=3600'
                
        return response