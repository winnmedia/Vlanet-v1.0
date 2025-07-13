# Railway 안전 설정 - 최소한의 설정으로 확실한 작동 보장
import os
import dj_database_url

# 기본 디렉토리 설정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 보안 설정
DEBUG = True  # 디버깅을 위해 임시 활성화
SECRET_KEY = os.environ.get('SECRET_KEY', 'temp-secret-key-for-railway-debugging')

# 허용된 호스트 (모든 호스트 허용으로 간단히)
ALLOWED_HOSTS = ['*']

# 애플리케이션 정의 (필수만)
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth', 
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
    'projects', 
    'feedbacks',
    'video_planning',
    'video_analysis',
    'admin_dashboard',
    'onlines',
]

# 미들웨어 (최소한)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# URL 설정
ROOT_URLCONF = 'config.urls'

# 템플릿 설정
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

# 데이터베이스 설정
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
    print(f"✅ PostgreSQL 연결: {DATABASE_URL[:30]}...")
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db_safe.sqlite3'),
        }
    }
    print("⚠️ SQLite 사용 (DATABASE_URL 없음)")

# 정적 파일
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 미디어 파일
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media' if os.environ.get('RAILWAY_ENVIRONMENT') else os.path.join(BASE_DIR, 'media')

# CORS 설정 (모든 origin 허용으로 간단히)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework
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

# 로깅 (간단히)
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
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# 상태 출력
print("🔧 Railway Safe Settings 로드됨")
print(f"DEBUG: {DEBUG}")
print(f"SECRET_KEY: {'설정됨' if SECRET_KEY else '없음'}")
print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS}")