# Railway 디버깅을 위한 임시 설정
from .railway_email_fix import *
import os

# 환경변수 디버깅
print("\n" + "="*60)
print("Railway Environment Variables Debug")
print("="*60)

env_vars = [
    'EMAIL_HOST_USER',
    'EMAIL_HOST_PASSWORD',
    'GOOGLE_ID',
    'GOOGLE_APP_PASSWORD',
    'RAILWAY_ENVIRONMENT',
    'RAILWAY_PROJECT_ID',
    'RAILWAY_SERVICE_ID',
]

for var in env_vars:
    value = os.environ.get(var)
    if value:
        if 'PASSWORD' in var:
            print(f"{var}: {'*' * 8} (length: {len(value)})")
        else:
            print(f"{var}: {value[:20]}..." if len(value) > 20 else f"{var}: {value}")
    else:
        print(f"{var}: Not set")

print("\n" + "="*60)
print("Email Settings in Django")
print("="*60)
print(f"EMAIL_BACKEND: {EMAIL_BACKEND}")
print(f"EMAIL_HOST: {EMAIL_HOST}")
print(f"EMAIL_PORT: {EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {EMAIL_HOST_USER}")
print(f"EMAIL_HOST_PASSWORD: {'Set' if EMAIL_HOST_PASSWORD else 'Not set'}")
print(f"DEFAULT_FROM_EMAIL: {DEFAULT_FROM_EMAIL}")
print("="*60 + "\n")

# 이메일 발송 시 더 자세한 로깅
LOGGING['loggers']['django.core.mail'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': True,
}

LOGGING['loggers']['smtplib'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': True,
}