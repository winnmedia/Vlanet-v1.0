from django.utils.deprecation import MiddlewareMixin
import mimetypes

class MediaHeadersMiddleware(MiddlewareMixin):
    """미디어 파일에 대한 적절한 헤더 설정"""
    
    def process_response(self, request, response):
        if request.path.startswith('/media/'):
            # 비디오 파일인 경우
            if any(request.path.endswith(ext) for ext in ['.mp4', '.webm', '.ogg', '.mov', '.avi']):
                # Content-Type 설정
                content_type, _ = mimetypes.guess_type(request.path)
                if content_type:
                    response['Content-Type'] = content_type
                
                # CORS 헤더 추가
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Range'
                response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range'
                
                # 비디오 스트리밍을 위한 헤더
                response['Accept-Ranges'] = 'bytes'
                
        return response