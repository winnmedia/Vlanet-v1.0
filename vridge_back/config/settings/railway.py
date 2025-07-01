# Railway 배포용 Django 설정
import os
import dj_database_url
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Railway 환경 확인
IS_RAILWAY = os.environ.get('RAILWAY_ENVIRONMENT') is not None
if IS_RAILWAY:
    print("Running on Railway environment")
    print(f"Railway environment: {os.environ.get('RAILWAY_ENVIRONMENT')}")
    # 모든 Railway 환경변수 출력
    railway_vars = {k: v for k, v in os.environ.items() if k.startswith('RAILWAY_')}
    print(f"Railway variables found: {list(railway_vars.keys())}")

# 보안 설정
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-DcuaI3zQmYubdwPqXgkCQgJkfZJCeiJ5NM7-HqsgEQRUADnZeb')
ALGORITHM = os.environ.get('ALGORITHM', 'HS256')

# 허용된 호스트
ALLOWED_HOSTS = [
    '.railway.app',
    'vlanet.net', 
    'www.vlanet.net',
    'localhost',
    '127.0.0.1',
    '*'  # 임시로 모든 호스트 허용 (테스트용)
]

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

PROJECT_APPS = [
    "core",
    "users", 
    "projects",
    "feedbacks",
    "onlines",
    "video_analysis",
]

THIRD_PARTY_APPS = [
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
]

# users 앱이 auth보다 먼저 로드되어야 함
INSTALLED_APPS = [
    # Project apps 먼저 (특히 users)
    "core",
    "users",
    "projects",
    "feedbacks",
    "onlines",
    "video_analysis",
    
    # Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Third party apps
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# 데이터베이스 (PostgreSQL)
# Railway는 RAILWAY_DATABASE_URL 또는 DATABASE_URL 환경변수를 제공합니다
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('RAILWAY_DATABASE_URL')

# 환경변수 확인을 위한 디버그 출력
print("Checking database environment variables...")
print(f"DATABASE_URL exists: {'DATABASE_URL' in os.environ}")
print(f"RAILWAY_DATABASE_URL exists: {'RAILWAY_DATABASE_URL' in os.environ}")

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    # 개발 환경을 위한 기본 설정
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "ko-kr"
TIME_ZONE = "Asia/Seoul"
USE_I18N = True
USE_TZ = True

# 정적 파일 설정
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []

# WhiteNoise 설정 (collectstatic 없이도 작동)
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

# 미디어 파일 설정  
MEDIA_URL = '/media/'
# Railway 볼륨이 마운트된 경우 사용, 아니면 로컬 디렉토리
MEDIA_ROOT = os.environ.get('RAILWAY_VOLUME_MOUNT_PATH', BASE_DIR / 'media')

# 미디어 디렉토리 확인 및 생성
import os as os_module
if not os_module.path.exists(MEDIA_ROOT):
    os_module.makedirs(MEDIA_ROOT, exist_ok=True)
    print(f"Created media directory at: {MEDIA_ROOT}")
else:
    print(f"Media directory exists at: {MEDIA_ROOT}")

# CORS 설정
CORS_ALLOWED_ORIGINS = [
    "https://vlanet.net",
    "https://www.vlanet.net",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://vridge-front-production.up.railway.app",
]

# CORS_ALLOW_ALL_ORIGINS를 False로 설정하여 CORS_ALLOWED_ORIGINS만 허용
CORS_ALLOW_ALL_ORIGINS = False

# CORS 추가 설정
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOWED_HEADERS = [
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

# CSRF 신뢰할 수 있는 도메인
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
]

# REST Framework 설정
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    )
}

# JWT 설정
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=7),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=28),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# Twelve Labs API 설정
TWELVE_LABS_API_KEY = os.environ.get('TWELVE_LABS_API_KEY')
TWELVE_LABS_INDEX_ID = os.environ.get('TWELVE_LABS_INDEX_ID')

# 소셜 로그인 설정
NAVER_CLIENT_ID = os.environ.get('NAVER_CLIENT_ID')
NAVER_SECRET_KEY = os.environ.get('NAVER_SECRET_KEY')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
KAKAO_API_KEY = os.environ.get('KAKAO_API_KEY')

# Railway 볼륨 스토리지 설정
# Railway는 영구 볼륨을 제공하며, RAILWAY_VOLUME_MOUNT_PATH에 마운트됨
print("Using Railway volume storage for media files")

# 이메일 설정
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('GOOGLE_ID')
EMAIL_HOST_PASSWORD = os.environ.get('GOOGLE_APP_PASSWORD')

# Sentry 설정
SENTRY_DSN = os.environ.get('SENTRY_DSN')

# 사용자 모델
AUTH_USER_MODEL = "users.User"

# WSGI 설정 확인
print(f"\nDJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
print(f"Current settings file: {__file__}")

# 보안 헤더
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# 기본 필드
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# 로깅
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

# 데이터베이스 연결 확인을 위한 로그
print(f"DATABASE_URL: {DATABASE_URL[:20]}..." if DATABASE_URL else "DATABASE_URL not found")
if DATABASE_URL:
    print("Database configured with PostgreSQL")
else:
    print("WARNING: No database URL found, using SQLite")