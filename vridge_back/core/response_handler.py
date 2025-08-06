"""
VideoPlanet 표준 응답 핸들러
모든 API 응답을 일관된 형식으로 반환
"""

from django.http import JsonResponse
from rest_framework.response import Response
from .error_messages import ErrorMessages
import logging

logger = logging.getLogger(__name__)


class StandardResponse:
    """표준화된 API 응답"""
    
    @staticmethod
    def success(data=None, message="성공", status_code=200):
        """성공 응답"""
        response = {
            "success": True,
            "message": message
        }
        
        if data is not None:
            response["data"] = data
        
        # 항상 JsonResponse 사용 (Django View와 호환성)
        return JsonResponse(response, status=status_code)
    
    @staticmethod
    def error(error_key="SERVER_ERROR", message=None, status_code=400, details=None):
        """에러 응답"""
        if message is None:
            message = getattr(ErrorMessages, error_key, ErrorMessages.SERVER_ERROR)
        
        response = {
            "success": False,
            "error": {
                "code": error_key,
                "message": message
            }
        }
        
        if details:
            response["error"]["details"] = details
        
        # 에러 로깅
        logger.error(f"API Error: {error_key} - {message}", extra={
            "error_code": error_key,
            "details": details,
            "status_code": status_code
        })
        
        # 항상 JsonResponse 사용 (Django View와 호환성)
        return JsonResponse(response, status=status_code)
    
    @staticmethod
    def paginated(data, page=1, total_pages=1, total_count=0, message="조회 성공"):
        """페이지네이션 응답"""
        response = {
            "success": True,
            "message": message,
            "data": data,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }
        
        if hasattr(Response, '__call__'):
            return Response(response, status=200)
        else:
            return JsonResponse(response, status=200)
    
    @staticmethod
    def created(data=None, message="생성 성공", status_code=201):
        """생성 성공 응답"""
        return StandardResponse.success(data, message, status_code)
    
    @staticmethod
    def updated(data=None, message="수정 성공", status_code=200):
        """수정 성공 응답"""
        return StandardResponse.success(data, message, status_code)
    
    @staticmethod
    def deleted(message="삭제 성공", status_code=200):
        """삭제 성공 응답"""
        return StandardResponse.success(None, message, status_code)
    
    @staticmethod
    def not_found(resource="리소스", message=None):
        """404 Not Found 응답"""
        if message is None:
            message = f"{resource}를 찾을 수 없습니다."
        return StandardResponse.error("NOT_FOUND", message, 404)
    
    @staticmethod
    def unauthorized(message="로그인이 필요합니다."):
        """401 Unauthorized 응답"""
        return StandardResponse.error("AUTH_REQUIRED", message, 401)
    
    @staticmethod
    def forbidden(message="이 작업을 수행할 권한이 없습니다."):
        """403 Forbidden 응답"""
        return StandardResponse.error("AUTH_PERMISSION_DENIED", message, 403)
    
    @staticmethod
    def validation_error(errors, message="입력값 검증에 실패했습니다."):
        """400 Validation Error 응답"""
        return StandardResponse.error("VALIDATION_FAILED", message, 400, errors)
    
    @staticmethod
    def server_error(message="서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."):
        """500 Internal Server Error 응답"""
        return StandardResponse.error("SERVER_ERROR", message, 500)