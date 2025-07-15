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
    Range 요청을 지원하여 비디오 스트리밍 가능
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
    
    # 파일 크기
    file_size = os.path.getsize(file_path)
    
    # Range 헤더 처리
    range_header = request.META.get('HTTP_RANGE', None)
    if range_header:
        import re
        from django.http import HttpResponse
        
        # Range 헤더 파싱 (예: "bytes=1048576-")
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            # 범위 유효성 검사
            if start >= file_size:
                return HttpResponse(status=416)  # Range Not Satisfiable
            
            end = min(end, file_size - 1)
            length = end - start + 1
            
            # 파일 열기 및 위치 이동
            file_handle = open(file_path, 'rb')
            file_handle.seek(start)
            
            # 부분 응답 생성
            response = HttpResponse(
                file_handle.read(length),
                status=206,  # Partial Content
                content_type=content_type
            )
            
            # Range 응답 헤더 설정
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(length)
            response['Accept-Ranges'] = 'bytes'
            
            # CORS 헤더 추가
            # Origin 확인 및 허용된 도메인에 대해서만 CORS 허용
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
            
            if origin in allowed_origins:
                response['Access-Control-Allow-Origin'] = origin
            else:
                response['Access-Control-Allow-Origin'] = 'https://vlanet.net'
            
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Range, Content-Type, Accept, Origin'
            response['Access-Control-Expose-Headers'] = 'Content-Range, Accept-Ranges, Content-Length'
            response['Access-Control-Allow-Credentials'] = 'true'
            
            return response
    
    # Range 요청이 아닌 경우 전체 파일 응답
    response = FileResponse(
        open(file_path, 'rb'),
        content_type=content_type
    )
    
    # 파일명 설정
    filename = os.path.basename(file_path)
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    response['Content-Length'] = str(file_size)
    
    # 비디오 파일인 경우 Range 헤더 지원 명시
    if content_type.startswith('video/'):
        response['Accept-Ranges'] = 'bytes'
    
    # CORS 헤더 추가
    # Origin 확인 및 허용된 도메인에 대해서만 CORS 허용
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
    
    if origin in allowed_origins:
        response['Access-Control-Allow-Origin'] = origin
    else:
        # 특정 도메인으로 기본값 설정
        response['Access-Control-Allow-Origin'] = 'https://vlanet.net'
    
    response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Range, Content-Type, Accept, Origin'
    response['Access-Control-Allow-Credentials'] = 'true'
    
    return response