"""
프로덕션 환경 보안 설정
"""

import os
from django.conf import settings


def configure_security(app_settings):
    """
    보안 관련 설정을 한 곳에서 관리
    settings 파일에서 이 함수를 호출하여 사용
    """
    
    # 기본 보안 설정
    is_production = not app_settings.DEBUG
    
    if is_production:
        # HTTPS 강제
        app_settings.SECURE_SSL_REDIRECT = True
        app_settings.SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
        
        # 쿠키 보안
        app_settings.SESSION_COOKIE_SECURE = True
        app_settings.CSRF_COOKIE_SECURE = True
        app_settings.SESSION_COOKIE_HTTPONLY = True
        app_settings.CSRF_COOKIE_HTTPONLY = True
        app_settings.SESSION_COOKIE_SAMESITE = 'Lax'
        app_settings.CSRF_COOKIE_SAMESITE = 'Lax'
        
        # HSTS (HTTP Strict Transport Security)
        app_settings.SECURE_HSTS_SECONDS = 31536000  # 1년
        app_settings.SECURE_HSTS_INCLUDE_SUBDOMAINS = True
        app_settings.SECURE_HSTS_PRELOAD = True
        
        # 컨텐츠 보안
        app_settings.SECURE_CONTENT_TYPE_NOSNIFF = True
        app_settings.SECURE_BROWSER_XSS_FILTER = True
        app_settings.X_FRAME_OPTIONS = 'DENY'
        
        # Referrer Policy
        app_settings.SECURE_REFERRER_POLICY = 'same-origin'
        
        # CSP (Content Security Policy) 헤더
        app_settings.CSP_DEFAULT_SRC = ("'self'",)
        app_settings.CSP_SCRIPT_SRC = (
            "'self'",
            "'unsafe-inline'",  # React 개발을 위해 필요 (프로덕션에서는 제거 권장)
            "https://www.google-analytics.com",
            "https://www.googletagmanager.com",
        )
        app_settings.CSP_STYLE_SRC = (
            "'self'",
            "'unsafe-inline'",  # 인라인 스타일 허용
            "https://fonts.googleapis.com",
        )
        app_settings.CSP_FONT_SRC = (
            "'self'",
            "https://fonts.gstatic.com",
        )
        app_settings.CSP_IMG_SRC = (
            "'self'",
            "data:",
            "https:",
            "blob:",
        )
        app_settings.CSP_MEDIA_SRC = (
            "'self'",
            "blob:",
            "https:",
        )
        app_settings.CSP_CONNECT_SRC = (
            "'self'",
            "https://videoplanet.up.railway.app",
            "wss://videoplanet.up.railway.app",
            "https://www.google-analytics.com",
        )
    
    # 비밀번호 검증 강화
    app_settings.AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
            'OPTIONS': {
                'min_length': 8,
            }
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
        {
            'NAME': 'users.validators.CustomPasswordValidator',
        },
    ]
    
    # 세션 보안
    app_settings.SESSION_EXPIRE_AT_BROWSER_CLOSE = False
    app_settings.SESSION_COOKIE_AGE = 60 * 60 * 24 * 7  # 7일
    
    # 파일 업로드 보안
    app_settings.FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
    app_settings.DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
    app_settings.DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000
    
    # 허용된 파일 확장자
    app_settings.ALLOWED_UPLOAD_EXTENSIONS = {
        'video': ['.mp4', '.mov', '.avi', '.wmv', '.mkv', '.webm'],
        'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
        'document': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    }
    
    # Rate Limiting 설정 (django-ratelimit 사용 시)
    app_settings.RATELIMIT_ENABLE = is_production
    app_settings.RATELIMIT_VIEW = '100/h'  # 시간당 100회
    
    return app_settings


class SecurityMiddleware:
    """
    추가 보안 헤더를 설정하는 미들웨어
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # 추가 보안 헤더
        if not settings.DEBUG:
            # Permissions Policy (이전 Feature Policy)
            response['Permissions-Policy'] = (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "payment=(), "
                "usb=(), "
                "magnetometer=(), "
                "accelerometer=()"
            )
            
            # 캐시 제어 (민감한 페이지)
            if request.path.startswith('/api/') or request.path.startswith('/admin/'):
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
        
        return response


def check_security_headers(url):
    """
    보안 헤더 검사 유틸리티
    배포 후 실행하여 보안 설정 확인
    """
    import requests
    
    print(f"🔍 {url} 보안 헤더 검사 중...")
    
    try:
        response = requests.get(url, timeout=10)
        headers = response.headers
        
        security_headers = {
            'Strict-Transport-Security': 'HSTS',
            'X-Content-Type-Options': 'Content Type Options',
            'X-Frame-Options': 'Frame Options',
            'X-XSS-Protection': 'XSS Protection',
            'Content-Security-Policy': 'CSP',
            'Referrer-Policy': 'Referrer Policy',
            'Permissions-Policy': 'Permissions Policy',
        }
        
        print("\n✅ 발견된 보안 헤더:")
        found = []
        for header, name in security_headers.items():
            if header in headers:
                print(f"  - {name}: {headers[header][:50]}...")
                found.append(header)
        
        print("\n❌ 누락된 보안 헤더:")
        missing = []
        for header, name in security_headers.items():
            if header not in headers:
                print(f"  - {name}")
                missing.append(header)
        
        # 점수 계산
        score = len(found) / len(security_headers) * 100
        print(f"\n📊 보안 점수: {score:.1f}%")
        
        if score >= 80:
            print("✅ 보안 헤더가 잘 설정되어 있습니다!")
        elif score >= 60:
            print("⚠️  보안 헤더를 더 추가하는 것을 권장합니다.")
        else:
            print("❌ 보안 헤더 설정이 부족합니다. 즉시 개선이 필요합니다.")
        
        return score
        
    except Exception as e:
        print(f"❌ 검사 실패: {e}")
        return 0


# 보안 관련 유틸리티 함수들

def sanitize_user_input(text):
    """
    사용자 입력 살균
    """
    import html
    import re
    
    if not text:
        return text
    
    # HTML 엔티티 이스케이프
    text = html.escape(text)
    
    # 위험한 패턴 제거
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>.*?</iframe>',
    ]
    
    for pattern in dangerous_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text


def generate_secure_filename(filename):
    """
    보안이 강화된 파일명 생성
    """
    import re
    import secrets
    from pathlib import Path
    
    # 파일명과 확장자 분리
    path = Path(filename)
    name = path.stem
    ext = path.suffix.lower()
    
    # 허용된 확장자 확인
    allowed_extensions = []
    for exts in settings.ALLOWED_UPLOAD_EXTENSIONS.values():
        allowed_extensions.extend(exts)
    
    if ext not in allowed_extensions:
        raise ValueError(f"허용되지 않은 파일 확장자: {ext}")
    
    # 안전한 파일명 생성
    safe_name = re.sub(r'[^\w\s-]', '', name)
    safe_name = re.sub(r'[-\s]+', '-', safe_name)
    
    # 랜덤 문자열 추가
    random_str = secrets.token_hex(4)
    
    return f"{safe_name}_{random_str}{ext}"


def check_file_content(file_obj):
    """
    파일 내용 검증 (매직 넘버 확인)
    """
    import magic
    
    # 파일 시작 부분 읽기
    file_obj.seek(0)
    file_header = file_obj.read(1024)
    file_obj.seek(0)
    
    # MIME 타입 확인
    mime = magic.from_buffer(file_header, mime=True)
    
    # 확장자와 MIME 타입 매칭 확인
    ext_mime_map = {
        '.jpg': ['image/jpeg'],
        '.jpeg': ['image/jpeg'],
        '.png': ['image/png'],
        '.gif': ['image/gif'],
        '.mp4': ['video/mp4'],
        '.pdf': ['application/pdf'],
        # 더 많은 매핑 추가...
    }
    
    file_ext = Path(file_obj.name).suffix.lower()
    allowed_mimes = ext_mime_map.get(file_ext, [])
    
    if mime not in allowed_mimes:
        raise ValueError(f"파일 내용이 확장자와 일치하지 않습니다: {mime}")
    
    return True