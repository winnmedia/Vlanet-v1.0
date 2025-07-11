"""
보안 관련 유틸리티 및 데코레이터
SQL 인젝션, XSS, CSRF 등 보안 취약점 방지
"""
import re
import logging
from functools import wraps
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import JsonResponse

logger = logging.getLogger('security')


class SecurityError(Exception):
    """보안 관련 에러"""
    pass


def sanitize_input(value, field_type='text'):
    """
    입력값 정제
    SQL 인젝션 및 XSS 공격 방지
    """
    if value is None:
        return None
    
    # 문자열로 변환
    value = str(value)
    
    # SQL 인젝션 패턴 검사
    sql_patterns = [
        r"(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\binsert\b.*\binto\b|\bupdate\b.*\bset\b|\bdelete\b.*\bfrom\b)",
        r"(;|\"|'|--|\/\*|\*\/|xp_|sp_|0x|\\x)",
        r"(\bdrop\b|\bcreate\b|\balter\b|\btruncate\b|\bexec\b|\bexecute\b)",
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            logger.warning(f"SQL injection attempt detected: {value[:50]}...")
            raise SecurityError("잘못된 입력값입니다.")
    
    # XSS 패턴 검사
    xss_patterns = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<object",
        r"<embed",
        r"<link",
        r"eval\(",
        r"alert\(",
        r"document\.cookie",
        r"window\.location",
    ]
    
    for pattern in xss_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            logger.warning(f"XSS attempt detected: {value[:50]}...")
            raise SecurityError("잘못된 입력값입니다.")
    
    # 필드 타입별 추가 검증
    if field_type == 'email':
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
            raise SecurityError("올바른 이메일 형식이 아닙니다.")
    
    elif field_type == 'number':
        try:
            int(value)
        except ValueError:
            raise SecurityError("숫자만 입력 가능합니다.")
    
    elif field_type == 'alphanumeric':
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise SecurityError("영문, 숫자, _, - 만 사용 가능합니다.")
    
    return value


def secure_query(model, **kwargs):
    """
    안전한 쿼리 생성
    Django ORM을 통해 SQL 인젝션 방지
    """
    # 위험한 lookup 타입 제한
    dangerous_lookups = ['regex', 'iregex']
    
    for key in kwargs.keys():
        lookup_parts = key.split('__')
        if len(lookup_parts) > 1 and lookup_parts[-1] in dangerous_lookups:
            raise SecurityError("해당 검색 조건은 사용할 수 없습니다.")
    
    # 안전한 쿼리 실행
    try:
        return model.objects.filter(**kwargs)
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise SecurityError("쿼리 실행 중 오류가 발생했습니다.")


def rate_limit(max_requests=10, window=60):
    """
    Rate limiting 데코레이터
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            from django.core.cache import cache
            
            # IP 주소 기반 rate limiting
            client_ip = request.META.get('REMOTE_ADDR', '')
            cache_key = f"rate_limit:{func.__name__}:{client_ip}"
            
            # 현재 요청 수 확인
            current_requests = cache.get(cache_key, 0)
            
            if current_requests >= max_requests:
                return JsonResponse({
                    "message": "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.",
                    "code": "RATE_LIMITED"
                }, status=429)
            
            # 요청 수 증가
            cache.set(cache_key, current_requests + 1, window)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def validate_file_upload(file):
    """
    파일 업로드 보안 검증
    """
    # 파일 크기 제한 (50MB)
    max_size = 50 * 1024 * 1024
    if file.size > max_size:
        raise SecurityError("파일 크기는 50MB를 초과할 수 없습니다.")
    
    # 허용된 확장자
    allowed_extensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp',  # 이미지
        'mp4', 'avi', 'mov', 'wmv', 'flv',    # 비디오
        'mp3', 'wav', 'ogg',                   # 오디오
        'pdf', 'doc', 'docx', 'xls', 'xlsx',   # 문서
        'zip', 'rar', '7z',                    # 압축파일
    ]
    
    # 확장자 검사
    file_ext = file.name.split('.')[-1].lower()
    if file_ext not in allowed_extensions:
        raise SecurityError(f"지원하지 않는 파일 형식입니다: .{file_ext}")
    
    # MIME 타입 검사
    import magic
    try:
        file_mime = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)  # 파일 포인터 리셋
        
        # MIME 타입과 확장자 일치 확인
        mime_extension_map = {
            'image/jpeg': ['jpg', 'jpeg'],
            'image/png': ['png'],
            'image/gif': ['gif'],
            'image/webp': ['webp'],
            'video/mp4': ['mp4'],
            'application/pdf': ['pdf'],
            # ... 더 많은 매핑 추가
        }
        
        if file_mime in mime_extension_map:
            if file_ext not in mime_extension_map[file_mime]:
                raise SecurityError("파일 내용과 확장자가 일치하지 않습니다.")
    except Exception:
        # python-magic이 없는 경우 건너뜀
        pass
    
    # 파일명 정제
    import os
    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', os.path.basename(file.name))
    
    return safe_filename


def secure_headers_middleware(get_response):
    """
    보안 헤더 추가 미들웨어
    """
    def middleware(request):
        response = get_response(request)
        
        # 보안 헤더 추가
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # CSP 헤더 (Content Security Policy)
        if not hasattr(response, 'has_csp'):
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://videoplanet.up.railway.app wss://videoplanet.up.railway.app; "
            )
        
        return response
    
    return middleware


# 안전한 쿠키 설정 함수
def set_secure_cookie(response, key, value, max_age=None):
    """
    보안이 강화된 쿠키 설정
    """
    from django.conf import settings
    
    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age or (30 * 24 * 60 * 60),  # 기본 30일
        httponly=True,  # JavaScript 접근 차단
        secure=not settings.DEBUG,  # HTTPS에서만 전송
        samesite='Lax',  # CSRF 공격 방지
        path='/',
    )
    
    return response