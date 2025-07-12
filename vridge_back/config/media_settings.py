"""
미디어 파일 서빙 설정
Railway와 로컬 환경 모두 지원
"""
import os
from django.conf import settings
from django.http import FileResponse, Http404
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_http_methods
import mimetypes

@require_http_methods(["GET", "HEAD"])
@cache_control(max_age=86400)  # 24시간 캐시
def serve_media(request, path):
    """
    미디어 파일을 안전하게 서빙하는 뷰
    WhiteNoise가 처리하지 못하는 미디어 파일을 직접 서빙
    """
    # 보안: path traversal 방지
    if '..' in path or path.startswith('/'):
        raise Http404("Invalid path")
    
    # 실제 파일 경로
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # 파일 존재 확인
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise Http404("File not found")
    
    # MIME 타입 추측
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # 파일 응답
    response = FileResponse(
        open(file_path, 'rb'),
        content_type=content_type
    )
    
    # 파일명 설정
    filename = os.path.basename(file_path)
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    
    # 비디오 파일인 경우 Range 헤더 지원
    if content_type.startswith('video/'):
        response['Accept-Ranges'] = 'bytes'
    
    return response