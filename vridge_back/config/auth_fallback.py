"""
인증 뷰 Fallback 처리
Railway 환경에서 안정적으로 인증 뷰를 제공
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def get_auth_views():
    """
    환경에 따라 적절한 인증 뷰를 반환
    Railway 환경에서는 안정적인 SafeSignIn/SafeSignUp 사용
    """
    
    # 기본 뷰 (항상 사용 가능)
    from users.views_signup_safe import SafeSignUp, SafeSignIn
    from rest_framework_simplejwt.views import TokenRefreshView
    
    auth_views = {
        'login': SafeSignIn,
        'signup': SafeSignUp,
        'refresh': TokenRefreshView,
        'verify': None
    }
    
    # Railway 환경이 아닌 경우에만 개선된 뷰 시도
    if settings.DEBUG or not _is_railway_env():
        try:
            from users.views_auth_fixed import ImprovedSignIn, TokenVerifyView
            auth_views['login'] = ImprovedSignIn
            auth_views['verify'] = TokenVerifyView
            logger.info("Using improved authentication views")
        except ImportError as e:
            logger.info(f"Using safe authentication views (improved not available: {e})")
    else:
        logger.info("Using safe authentication views for Railway environment")
    
    return auth_views

def _is_railway_env():
    """Railway 환경인지 확인"""
    import os
    return any([
        os.environ.get('RAILWAY_ENVIRONMENT'),
        os.environ.get('RAILWAY_PUBLIC_DOMAIN'),
        'railway' in os.environ.get('DJANGO_SETTINGS_MODULE', '').lower()
    ])