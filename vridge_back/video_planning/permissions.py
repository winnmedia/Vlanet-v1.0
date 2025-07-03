from rest_framework.permissions import BasePermission

class AllowAnyTemporary(BasePermission):
    """임시 권한 클래스 - 모든 요청 허용"""
    def has_permission(self, request, view):
        return True