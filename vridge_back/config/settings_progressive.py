"""
Railway 점진적 배포 설정 - 최소 설정에서 시작해 단계적으로 기능 추가
"""
import os
import dj_database_url
from pathlib import Path
from datetime import timedelta

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ===== STEP 1: 기본 설정 (최소 설정과 동일) =====
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-progressive-key')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = ['*']

# ===== STEP 2: 앱 설정 (JWT 추가) =====
INSTALLED_APPS = [
    # Core apps first
    'core',
    'users',
    'projects', 
    'feedbacks',
    'onlines',
    'video_planning',
    
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',  # JWT 추가
    'rest_framework_simplejwt.token_blacklist',  # 토큰 블랙리스트 추가
]

# ===== STEP 3: 미들웨어 (성능 최적화 제외) =====
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 성능 및 미디어 미들웨어는 나중에 추가
]

ROOT_URLCONF = 'config.urls'

# 템플릿
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ===== STEP 4: 데이터베이스 (PostgreSQL 우선) =====
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('RAILWAY_DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
    print("✅ Using PostgreSQL database")
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    print("⚠️ Using SQLite database")

# ===== STEP 5: 캐시 (DB 캐시 사용) =====
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'django_cache_table',
    }
}

# ===== STEP 6: 정적/미디어 파일 =====
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.environ.get('RAILWAY_VOLUME_MOUNT_PATH', BASE_DIR / 'media')

# ===== STEP 7: CORS 설정 (필수 도메인만) =====
CORS_ALLOWED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
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

# CSRF 설정
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
]

# ===== STEP 8: 인증 설정 =====
AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ===== STEP 9: REST Framework & JWT =====
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=28),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# ===== STEP 10: 기본 설정 =====
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===== STEP 11: 이메일 설정 (선택적) =====
if os.environ.get('SENDGRID_API_KEY'):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.sendgrid.net'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = 'apikey'
    EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY')
    DEFAULT_FROM_EMAIL = 'VideoPlanet <noreply@vlanet.net>'
    print("✅ Email configured with SendGrid")
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    print("⚠️ Email will be printed to console")

# ===== STEP 12: 파일 업로드 설정 =====
FILE_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB

# ===== STEP 13: 보안 설정 (프로덕션만) =====
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# ===== STEP 14: API 키 설정 =====
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
HUGGINGFACE_API_KEY = os.environ.get('HUGGINGFACE_API_KEY', '')

# 환경 정보 출력
print(f"🚀 Progressive Railway settings loaded")
print(f"📍 Environment: {'Production' if not DEBUG else 'Development'}")
print(f"🔧 Settings level: PROGRESSIVE (Step 14/20)")
print(f"📊 Apps loaded: {len(INSTALLED_APPS)}")
print(f"🔌 Middleware count: {len(MIDDLEWARE)}")