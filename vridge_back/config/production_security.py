"""
프로덕션 환경 보안 설정
Railway 배포 시 자동 적용
"""
import os


def apply_production_security(settings_dict):
    """
    프로덕션 환경에서 보안 설정 적용
    settings.py에서 호출
    """
    # HTTPS 강제
    settings_dict['SECURE_SSL_REDIRECT'] = True
    settings_dict['SECURE_PROXY_SSL_HEADER'] = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # 쿠키 보안
    settings_dict['SESSION_COOKIE_SECURE'] = True
    settings_dict['SESSION_COOKIE_HTTPONLY'] = True
    settings_dict['SESSION_COOKIE_SAMESITE'] = 'Lax'
    settings_dict['SESSION_COOKIE_AGE'] = 60 * 60 * 24 * 7  # 7일
    
    settings_dict['CSRF_COOKIE_SECURE'] = True
    settings_dict['CSRF_COOKIE_HTTPONLY'] = True
    settings_dict['CSRF_COOKIE_SAMESITE'] = 'Lax'
    
    # HSTS (HTTP Strict Transport Security)
    settings_dict['SECURE_HSTS_SECONDS'] = 31536000  # 1년
    settings_dict['SECURE_HSTS_INCLUDE_SUBDOMAINS'] = True
    settings_dict['SECURE_HSTS_PRELOAD'] = True
    
    # 보안 헤더
    settings_dict['SECURE_CONTENT_TYPE_NOSNIFF'] = True
    settings_dict['SECURE_BROWSER_XSS_FILTER'] = True
    settings_dict['X_FRAME_OPTIONS'] = 'DENY'
    
    # 세션 보안
    settings_dict['SESSION_EXPIRE_AT_BROWSER_CLOSE'] = False
    settings_dict['SESSION_SAVE_EVERY_REQUEST'] = True
    
    # 파일 업로드 제한
    settings_dict['FILE_UPLOAD_MAX_MEMORY_SIZE'] = 50 * 1024 * 1024  # 50MB
    settings_dict['DATA_UPLOAD_MAX_MEMORY_SIZE'] = 50 * 1024 * 1024  # 50MB
    settings_dict['DATA_UPLOAD_MAX_NUMBER_FIELDS'] = 1000
    
    # 호스트 헤더 검증
    allowed_hosts = os.environ.get('ALLOWED_HOSTS', 'videoplanet.up.railway.app').split(',')
    settings_dict['ALLOWED_HOSTS'] = [host.strip() for host in allowed_hosts]
    
    # CORS 보안
    cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', 'https://vlanet.net,https://www.vlanet.net').split(',')
    settings_dict['CORS_ALLOWED_ORIGINS'] = [origin.strip() for origin in cors_origins]
    settings_dict['CORS_ALLOW_CREDENTIALS'] = True
    settings_dict['CORS_EXPOSE_HEADERS'] = ['Content-Type', 'X-CSRFToken']
    
    # 로깅 설정 (민감한 정보 제외)
    settings_dict['LOGGING'] = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {message}',
                'style': '{',
            },
        },
        'filters': {
            'require_debug_false': {
                '()': 'django.utils.log.RequireDebugFalse',
            },
        },
        'handlers': {
            'console': {
                'level': 'INFO',
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
            'security': {
                'level': 'WARNING',
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
            'security': {
                'handlers': ['security'],
                'level': 'WARNING',
                'propagate': False,
            },
        },
    }
    
    return settings_dict


# SQL 인젝션 방지를 위한 추가 설정
SECURE_DB_SETTINGS = {
    'OPTIONS': {
        'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        'charset': 'utf8mb4',
        'connect_timeout': 10,
    }
}


# 민감한 정보 마스킹 함수
def mask_sensitive_data(data):
    """
    로그나 에러 메시지에서 민감한 정보 마스킹
    """
    import re
    
    # 이메일 마스킹
    data = re.sub(
        r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
        lambda m: f"{m.group(1)[:3]}***@{m.group(2)}",
        str(data)
    )
    
    # 전화번호 마스킹
    data = re.sub(
        r'(\d{3})[-.]?(\d{4})[-.]?(\d{4})',
        r'\1-****-\3',
        data
    )
    
    # 토큰 마스킹
    data = re.sub(
        r'(token|key|password|secret)[\"\']?\s*[:=]\s*[\"\']?([^\s\"\']+)',
        r'\1=***MASKED***',
        data,
        flags=re.IGNORECASE
    )
    
    return data