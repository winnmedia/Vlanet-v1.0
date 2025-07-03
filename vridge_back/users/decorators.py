from functools import wraps
from django.http import JsonResponse
from .utils import user_validator
import logging

logger = logging.getLogger(__name__)

def admin_required(view_func):
    """관리자 권한이 필요한 뷰에 대한 데코레이터"""
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        # 먼저 user_validator로 인증 확인
        @user_validator
        def check_admin(request, *args, **kwargs):
            user = request.user
            
            # superuser 체크
            if not user.is_superuser:
                logger.warning(f"Non-admin user {user.username} attempted to access admin endpoint")
                return JsonResponse({
                    "error": "관리자 권한이 필요합니다.",
                    "code": "ADMIN_REQUIRED"
                }, status=403)
            
            # 원래 뷰 함수 실행
            return view_func(request, *args, **kwargs)
        
        return check_admin(request, *args, **kwargs)
    
    return wrapped_view