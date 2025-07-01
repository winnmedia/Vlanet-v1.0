# 개선된 CORS 설정
from .railway_email_fix import *
import os

# 환경변수에서 CORS 설정 읽기
CORS_ALLOWED_ORIGINS_ENV = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOWED_ORIGINS_ENV = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_ENV if origin.strip()]

# 기본 허용 origin
DEFAULT_ALLOWED_ORIGINS = [
    "https://vlanet.net",
    "https://www.vlanet.net",
]

# 개발 환경에서 추가 origin
if DEBUG:
    DEFAULT_ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

# 환경변수와 기본값 병합
CORS_ALLOWED_ORIGINS = list(set(DEFAULT_ALLOWED_ORIGINS + CORS_ALLOWED_ORIGINS_ENV))

# CORS 설정
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# Preflight 요청 설정
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET', 
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CORS preflight 캐시 시간 (24시간)
CORS_PREFLIGHT_MAX_AGE = 86400

# CSRF 설정
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

# 쿠키 설정 (CORS 환경용)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # JavaScript에서 CSRF 토큰 접근 필요

# 보안 헤더
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# 로깅
print(f"CORS_ALLOWED_ORIGINS: {CORS_ALLOWED_ORIGINS}")
print(f"CSRF_TRUSTED_ORIGINS: {CSRF_TRUSTED_ORIGINS}")