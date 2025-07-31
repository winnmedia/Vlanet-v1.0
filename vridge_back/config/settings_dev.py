"""
Development settings
"""
from .settings_base import *

# Development specific settings
DEBUG = True

# Use SQLite for development
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Use local file storage for development
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Development CORS settings
CORS_ALLOW_ALL_ORIGINS = True

# Development-specific email settings
# 개발 환경에서는 이메일을 콘솔에 출력
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'VideoPlanet <noreply@vlanet.net>'

# 실제 SMTP를 테스트하려면 아래 주석을 해제하고 환경 변수 설정
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST_USER = 'your-email@gmail.com'
# EMAIL_HOST_PASSWORD = 'your-app-password'

# Override cache settings for development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Override session engine for development
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# Rate Limiting 설정 (개발 환경)
RATE_LIMITING_ENABLED = False  # 개발 환경에서는 완전히 비활성화

# IP 화이트리스트 (개발 환경)
RATE_LIMIT_WHITELIST_IPS = [
    '127.0.0.1',      # localhost IPv4
    '::1',            # localhost IPv6
    '192.168.0.0/16', # 로컬 네트워크
    '10.0.0.0/8',     # 사설 네트워크
    '172.16.0.0/12',  # 사설 네트워크
]

# 테스트 계정 화이트리스트 (Rate Limiting 제외)
RATE_LIMIT_TEST_ACCOUNTS = [
    'test@example.com',
    'dev@vlanet.net',
    'admin@vlanet.net',
]

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}