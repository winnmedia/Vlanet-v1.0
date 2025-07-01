# Railway 이메일 설정 수정
from .railway_cors_fix import *

# 이메일 설정 수정
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

# Railway 환경변수와 일치하도록 수정
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', os.environ.get('GOOGLE_ID'))
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', os.environ.get('GOOGLE_APP_PASSWORD'))

# 기본 발신자 이메일
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'VideoPlanet <vridgeofficial@gmail.com>')
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# 이메일 디버깅을 위한 로깅
import logging
logger = logging.getLogger(__name__)

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    logger.info(f"Email configured with user: {EMAIL_HOST_USER}")
else:
    logger.error("Email configuration missing: Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD")

# 이메일 발송 타임아웃 설정
EMAIL_TIMEOUT = 10

# Gmail 보안 설정을 위한 추가 설정
EMAIL_USE_SSL = False  # TLS 사용 시 False
EMAIL_SSL_KEYFILE = None
EMAIL_SSL_CERTFILE = None