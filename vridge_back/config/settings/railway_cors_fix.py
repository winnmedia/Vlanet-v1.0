# Railway CORS 문제 해결을 위한 임시 설정
from .railway import *
import os

# 임시로 DEBUG 활성화하여 에러 확인
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() == 'true'

# CORS 설정
CORS_ALLOW_ALL_ORIGINS = False  # 특정 origin만 허용
CORS_ALLOW_CREDENTIALS = True

# 허용할 origin 목록
CORS_ALLOWED_ORIGINS = [
    "https://vlanet.net",
    "https://www.vlanet.net", 
    "http://vlanet.net",
    "http://www.vlanet.net",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://videoplanetready.vercel.app",
    "https://vridge-front-production.up.railway.app",
    "https://vlanet-v1-0.vercel.app",
]

# CORS 허용할 정규식 패턴 (Vercel preview URLs 포함)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://vlanet.*\.vercel\.app$",
]

# Preflight 요청을 위한 설정
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
    'x-idempotency-key',  # 멱등성 키 헤더 추가
]

# CORS preflight 캐시 시간 (초)
CORS_PREFLIGHT_MAX_AGE = 86400

print("CORS Fix settings loaded")
print(f"CORS_ALLOW_ALL_ORIGINS: {CORS_ALLOW_ALL_ORIGINS}")
print(f"CORS_ALLOWED_ORIGINS: {CORS_ALLOWED_ORIGINS}")

# CSRF 설정도 업데이트
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
    'https://videoplanetready.vercel.app',
    'https://vlanet-v1-0.vercel.app',
]

# 추가 보안 설정
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True