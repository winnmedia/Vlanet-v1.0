# 최종 CORS 수정 설정
from .sendgrid_config import *

# CORS 설정 완전 재정의
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# 모든 가능한 프론트엔드 도메인 포함
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

# 환경변수에서 추가 origin 가져오기
import os
additional_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if additional_origins:
    for origin in additional_origins.split(','):
        origin = origin.strip()
        if origin and origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)

# CORS 정규식 패턴
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://vlanet.*\.vercel\.app$",
    r"^https://.*-winnmedia\.vercel\.app$",
]

# 모든 HTTP 메서드 허용
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# 모든 필요한 헤더 허용
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
    'cache-control',
]

# 노출할 헤더
CORS_EXPOSE_HEADERS = [
    'Content-Type',
    'X-CSRFToken',
]

# Preflight 캐시
CORS_PREFLIGHT_MAX_AGE = 86400

# CSRF 신뢰할 수 있는 도메인
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
    'https://videoplanet.up.railway.app',
    'https://videoplanetready.vercel.app',
    'https://vlanet-v1-0.vercel.app',
    'https://*.vercel.app',
]

# 미들웨어 순서 재확인 (CORS가 최상단에)
MIDDLEWARE = [
    'middleware.force_cors.ForceCorsMiddleware',  # 강제 CORS 헤더 추가
    'corsheaders.middleware.CorsMiddleware',  # django-cors-headers
    'django.middleware.security.SecurityMiddleware',
    'middleware.cors_debug.CorsDebugMiddleware',  # CORS 디버깅
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 디버깅 출력
print("=" * 80)
print("[CORS Final Fix] Settings loaded")
print(f"CORS_ALLOWED_ORIGINS ({len(CORS_ALLOWED_ORIGINS)} origins):")
for origin in CORS_ALLOWED_ORIGINS:
    print(f"  - {origin}")
print(f"CORS_ALLOW_CREDENTIALS: {CORS_ALLOW_CREDENTIALS}")
print(f"CORS_ALLOW_ALL_ORIGINS: {CORS_ALLOW_ALL_ORIGINS}")
print("=" * 80)