# Railway 최소 설정 - 문제 해결용
import os
import dj_database_url

# 기본 Django 설정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 보안 설정
DEBUG = True  # 문제 해결을 위해 임시로 True
SECRET_KEY = os.environ.get('SECRET_KEY', 'emergency-secret-key-for-debugging')

# 허용된 호스트
ALLOWED_HOSTS = ['*']  # 임시로 모든 호스트 허용

# 애플리케이션 정의 (최소한만)
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
]

PROJECT_APPS = [
    'users',
    'projects',
    'feedbacks', 
    'video_planning',
    'video_analysis',
    'admin_dashboard',
    'onlines',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + PROJECT_APPS

# 미들웨어 (최소한만)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

# URL 설정
ROOT_URLCONF = 'config.urls'

# 템플릿 설정 (최소한)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

# WSGI
WSGI_APPLICATION = 'config.wsgi.application'

# 데이터베이스 (PostgreSQL)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db_minimal.sqlite3'),
        }
    }

# 정적 파일
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 미디어 파일
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media' if os.environ.get('RAILWAY_ENVIRONMENT') else os.path.join(BASE_DIR, 'media')

# CORS 설정 (모든 origin 허용 - 임시)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework 설정 (최소한)
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# 언어 및 시간대
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

# 사용자 모델
AUTH_USER_MODEL = 'users.User'

# 기본 자동 필드
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 로깅 (최소한)
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

print(f"🔧 Railway Minimal Settings Loaded")
print(f"DEBUG: {DEBUG}")
print(f"DATABASE_URL: {'Present' if DATABASE_URL else 'Not set'}")
print(f"SECRET_KEY: {'Present' if SECRET_KEY else 'Not set'}")