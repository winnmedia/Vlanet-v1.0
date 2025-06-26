"""
VideoPlanet Railway/Production 배포용 통합 설정
"""
import os
import dj_database_url
from pathlib import Path
from datetime import timedelta

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent  # VideoPlanet 루트

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-production-key')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'videoplanet.up.railway.app', 'vlanet.net', '.railway.app']

# Application definition
INSTALLED_APPS = [
    # Project apps first (Custom User Model)
    'users',
    'core',
    'projects',
    'feedbacks',
    'onlines',
    'video_analysis',
    
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
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    # 'daphne',  # Railway에서 WebSocket 지원 안함
    # 'channels',  # Railway에서 WebSocket 지원 안함
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls_production'  # 프론트엔드 + 백엔드 통합

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
            ROOT_DIR / 'vridge_front' / 'build',  # React 빌드 파일
        ],
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

# Database
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('RAILWAY_DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    # 개발/테스트용 SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    ROOT_DIR / 'vridge_front' / 'build' / 'static',  # 프론트엔드 정적 파일
]

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# User model
AUTH_USER_MODEL = 'users.User'

# CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://videoplanetready.vercel.app",
    "https://videoplanet.up.railway.app",
    "https://vlanet.net",
    "https://www.vlanet.net",
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
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=28),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': os.environ.get('ALGORITHM', 'HS256'),
    'SIGNING_KEY': SECRET_KEY,
}

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

# AWS S3 settings
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'vridge-front')
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'ap-northeast-2')

# Social login settings
NAVER_CLIENT_ID = os.environ.get('NAVER_CLIENT_ID')
NAVER_SECRET_KEY = os.environ.get('NAVER_SECRET_KEY')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
KAKAO_API_KEY = os.environ.get('KAKAO_API_KEY')

# Twelve Labs API
TWELVE_LABS_API_KEY = os.environ.get('TWELVE_LABS_API_KEY')
TWELVE_LABS_INDEX_ID = os.environ.get('TWELVE_LABS_INDEX_ID')

# Channels (WebSocket) - Railway에서 지원 안함
# ASGI_APPLICATION = 'config.asgi.application'
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels.layers.InMemoryChannelLayer'
#     }
# }

# Security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Default field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 629145600  # 600MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 629145600  # 600MB
FILE_UPLOAD_PERMISSIONS = 0o644

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media'  # Railway volume mount point

# JWT Settings
ALGORITHM = "HS256"

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

print(f"Production settings loaded. Database: {'PostgreSQL' if DATABASE_URL else 'SQLite'}")