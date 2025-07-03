from rest_framework.permissions import BasePermission
import logging

logger = logging.getLogger(__name__)

class DebugAllowAny(BasePermission):
    """디버깅용 권한 클래스 - 모든 요청 허용하면서 로깅"""
    
    def has_permission(self, request, view):
        logger.info(f"[Permission Debug] View: {view.__class__.__name__}")
        logger.info(f"[Permission Debug] User: {request.user}")
        logger.info(f"[Permission Debug] Is authenticated: {request.user.is_authenticated}")
        logger.info(f"[Permission Debug] Method: {request.method}")
        logger.info(f"[Permission Debug] Path: {request.path}")
        
        # 항상 True 반환
        return True
    
    def has_object_permission(self, request, view, obj):
        logger.info(f"[Object Permission Debug] Object: {obj}")
        return True