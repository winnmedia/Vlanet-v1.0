# 이메일 문제 디버깅을 위한 설정
from .railway_email_fix import *
import logging

# 이메일 디버깅 로깅 설정
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
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.core.mail': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'users.utils': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

# 이메일 테스트 모드 (실제 발송 전 확인)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # 테스트용

# 환경변수 디버깅
import os
print("\n=== Email Configuration Debug ===")
print(f"EMAIL_HOST: {EMAIL_HOST}")
print(f"EMAIL_PORT: {EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {EMAIL_HOST_USER[:3]}..." if EMAIL_HOST_USER else "Not set")
print(f"EMAIL_HOST_PASSWORD: {'Set' if EMAIL_HOST_PASSWORD else 'Not set'}")
print(f"DEFAULT_FROM_EMAIL: {DEFAULT_FROM_EMAIL}")
print("================================\n")