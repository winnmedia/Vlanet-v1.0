from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

class APIException:
    """표준화된 API 에러 응답 클래스"""
    
    @staticmethod
    def bad_request(message="잘못된 요청입니다.", details=None):
        """400 Bad Request - 클라이언트 요청 오류"""
        response_data = {"error": message}
        if details:
            response_data["details"] = details
        return JsonResponse(response_data, status=400)
    
    @staticmethod
    def unauthorized(message="인증이 필요합니다.", details=None):
        """401 Unauthorized - 인증 필요"""
        response_data = {"error": message}
        if details:
            response_data["details"] = details
        return JsonResponse(response_data, status=401)
    
    @staticmethod
    def forbidden(message="권한이 없습니다.", details=None):
        """403 Forbidden - 권한 없음"""
        response_data = {"error": message}
        if details:
            response_data["details"] = details
        return JsonResponse(response_data, status=403)
    
    @staticmethod
    def not_found(message="리소스를 찾을 수 없습니다.", details=None):
        """404 Not Found - 리소스 없음"""
        response_data = {"error": message}
        if details:
            response_data["details"] = details
        return JsonResponse(response_data, status=404)
    
    @staticmethod
    def conflict(message="리소스 충돌이 발생했습니다.", details=None):
        """409 Conflict - 리소스 충돌"""
        response_data = {"error": message}
        if details:
            response_data["details"] = details
        return JsonResponse(response_data, status=409)
    
    @staticmethod
    def too_many_requests(message="너무 많은 요청입니다. 잠시 후 다시 시도해주세요.", details=None):
        """429 Too Many Requests - Rate Limit 초과"""
        response_data = {"error": message}
        if details:
            response_data["details"] = details
        return JsonResponse(response_data, status=429)
    
    @staticmethod
    def internal_server_error(message="서버 오류가 발생했습니다.", details=None):
        """500 Internal Server Error - 서버 오류"""
        response_data = {"error": message}
        if details:
            response_data["details"] = details
        logger.error(f"Internal Server Error: {message} - {details}")
        return JsonResponse(response_data, status=500)
    
    @staticmethod
    def success(message="success", data=None):
        """200 OK - 성공 응답"""
        response_data = {"message": message}
        if data:
            response_data.update(data)
        return JsonResponse(response_data, status=200)
    
    @staticmethod
    def created(message="생성되었습니다.", data=None):
        """201 Created - 리소스 생성 성공"""
        response_data = {"message": message}
        if data:
            response_data.update(data)
        return JsonResponse(response_data, status=201)