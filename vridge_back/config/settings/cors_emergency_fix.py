# 긴급 CORS 수정 - 최소 설정
from .railway import *

# Railway 설정에서 캐시 설정이 상속되는지 확인
if 'CACHES' in locals():
    print(f"[CORS Emergency Fix] Cache backend: {CACHES.get('default', {}).get('BACKEND', 'Not configured')}")
else:
    print("[CORS Emergency Fix] WARNING: No cache configuration found!")

# CORS 앱이 설치되어 있는지 확인
if 'corsheaders' not in INSTALLED_APPS:
    INSTALLED_APPS.insert(0, 'corsheaders')

# 미들웨어 강제 재설정
MIDDLEWARE = [
    'middleware.force_cors.ForceCorsMiddleware',  # 강제 CORS 헤더
    'corsheaders.middleware.CorsMiddleware',      # django-cors-headers
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS 설정 - 최대한 관대하게
CORS_ALLOW_ALL_ORIGINS = True  # 일단 모든 origin 허용
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['*']  # 모든 메서드 허용
CORS_ALLOW_HEADERS = ['*']  # 모든 헤더 허용

# CSRF 설정도 완화
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
    'https://*.vercel.app',
]

# 보안 헤더 비활성화 (CORS 충돌 방지)
SECURE_CROSS_ORIGIN_OPENER_POLICY = None

# 이메일 설정 유지
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY', '')
DEFAULT_FROM_EMAIL = 'VideoPlanet <vridgeofficial@gmail.com>'

import logging
logger = logging.getLogger(__name__)

logger.info("=" * 80)
logger.info("[CORS Emergency Fix] Settings loaded")
logger.info(f"CORS_ALLOW_ALL_ORIGINS: {CORS_ALLOW_ALL_ORIGINS}")
logger.info(f"Middleware count: {len(MIDDLEWARE)}")
logger.info(f"First middleware: {MIDDLEWARE[0]}")
logger.info("=" * 80)