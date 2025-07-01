# SendGrid 이메일 설정
from .railway_cors_fix import *
import os

# SendGrid 설정
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'  # SendGrid는 항상 'apikey'를 사용
EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY', '')

# 기본 발신자 이메일
DEFAULT_FROM_EMAIL = 'VideoPlanet <vridgeofficial@gmail.com>'
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# 디버깅을 위한 로깅
import logging
logger = logging.getLogger(__name__)

if EMAIL_HOST_PASSWORD:
    logger.info(f"SendGrid configured with API key: {EMAIL_HOST_PASSWORD[:10]}...")
    print(f"SendGrid API Key configured: {EMAIL_HOST_PASSWORD[:10]}...")
else:
    logger.error("SendGrid API key not found in SENDGRID_API_KEY environment variable")
    print("ERROR: SendGrid API key not configured!")

# 이메일 발송 타임아웃 설정
EMAIL_TIMEOUT = 30