"""
보안 설정 강화를 위한 헬퍼 함수들
"""
import os


def get_secure_settings(debug=False):
    """환경에 따른 보안 설정 반환"""
    if debug:
        # 개발 환경 설정
        return {
            'CSRF_COOKIE_SECURE': False,
            'SESSION_COOKIE_SECURE': False,
            'SECURE_SSL_REDIRECT': False,
            'SECURE_HSTS_SECONDS': 0,
            'SECURE_HSTS_INCLUDE_SUBDOMAINS': False,
            'SECURE_HSTS_PRELOAD': False,
        }
    else:
        # 프로덕션 환경 설정
        return {
            'CSRF_COOKIE_SECURE': True,
            'SESSION_COOKIE_SECURE': True,
            'SECURE_SSL_REDIRECT': True,
            'SECURE_HSTS_SECONDS': 31536000,  # 1년
            'SECURE_HSTS_INCLUDE_SUBDOMAINS': True,
            'SECURE_HSTS_PRELOAD': True,
            'SECURE_PROXY_SSL_HEADER': ('HTTP_X_FORWARDED_PROTO', 'https'),
        }


def validate_secret_key(secret_key):
    """SECRET_KEY 유효성 검증"""
    if not secret_key:
        raise ValueError("SECRET_KEY must be set in production")
    
    if len(secret_key) < 50:
        raise ValueError("SECRET_KEY must be at least 50 characters long")
    
    if secret_key.startswith('django-insecure'):
        raise ValueError("Production SECRET_KEY cannot start with 'django-insecure'")
    
    return True


def get_allowed_hosts():
    """환경변수에서 ALLOWED_HOSTS 가져오기"""
    allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', '')
    if allowed_hosts_env:
        return [host.strip() for host in allowed_hosts_env.split(',')]
    
    # 기본값 (프로덕션에서는 환경변수 필수)
    return [
        'localhost',
        '127.0.0.1',
        'videoplanet.up.railway.app',
        'api.vlanet.net',
        'vlanet.net',
        'www.vlanet.net',
    ]