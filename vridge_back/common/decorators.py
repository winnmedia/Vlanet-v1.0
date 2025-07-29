# -*- coding: utf-8 -*-
import json
import logging
from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from datetime import datetime

logger = logging.getLogger(__name__)


def handle_errors(func):
    """
    View 함수/메서드의 에러를 처리하는 데코레이터
    
    사용 예:
    @handle_errors
    def my_view(request):
        # 코드 작성
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except json.JSONDecodeError as e:
            return JsonResponse({
                "error": {
                    "type": "JSON_PARSE_ERROR",
                    "message": "올바른 JSON 형식이 아닙니다.",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }, status=400)
        except ValidationError as e:
            details = {}
            if hasattr(e, 'message_dict'):
                details = e.message_dict
            elif hasattr(e, 'messages'):
                details = {"errors": e.messages}
            else:
                details = {"errors": [str(e)]}
                
            return JsonResponse({
                "error": {
                    "type": "VALIDATION_ERROR",
                    "message": "입력값이 올바르지 않습니다.",
                    "details": details,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }, status=400)
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            return JsonResponse({
                "error": {
                    "type": "INTERNAL_SERVER_ERROR",
                    "message": "서버 오류가 발생했습니다.",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }, status=500)
    
    return wrapper


def validate_json_request(required_fields=None):
    """
    JSON 요청을 검증하는 데코레이터
    
    사용 예:
    @validate_json_request(required_fields=['email', 'password'])
    def my_view(request):
        data = json.loads(request.body)  # 이미 검증됨
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Content-Type 검증
            if request.content_type != 'application/json':
                return JsonResponse({
                    "error": {
                        "type": "INVALID_CONTENT_TYPE",
                        "message": "Content-Type must be application/json",
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
                }, status=400)
            
            # JSON 파싱
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    "error": {
                        "type": "JSON_PARSE_ERROR",
                        "message": "올바른 JSON 형식이 아닙니다.",
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
                }, status=400)
            
            # 필수 필드 검증
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return JsonResponse({
                        "error": {
                            "type": "MISSING_REQUIRED_FIELDS",
                            "message": "필수 필드가 누락되었습니다.",
                            "details": {"missing_fields": missing_fields},
                            "timestamp": datetime.utcnow().isoformat() + "Z"
                        }
                    }, status=400)
            
            # 검증된 데이터를 request에 추가
            request.json_data = data
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def standardize_response(func):
    """
    성공 응답을 표준화하는 데코레이터
    
    사용 예:
    @standardize_response
    def my_view(request):
        return {"user": {"id": 1, "name": "John"}}
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        
        # 이미 JsonResponse인 경우 그대로 반환
        if isinstance(result, JsonResponse):
            return result
        
        # dict인 경우 표준화된 응답으로 변환
        if isinstance(result, dict):
            return JsonResponse({
                "success": True,
                "data": result,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })
        
        # tuple인 경우 (data, status_code)
        if isinstance(result, tuple) and len(result) == 2:
            data, status_code = result
            return JsonResponse({
                "success": True,
                "data": data,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }, status=status_code)
        
        # 기타 경우 그대로 반환
        return result
    
    return wrapper


class APIResponse:
    """
    표준화된 API 응답 헬퍼 클래스
    
    사용 예:
    return APIResponse.success(data={"user": user_data})
    return APIResponse.error("Invalid email", status=400)
    """
    
    @staticmethod
    def success(data=None, message="Success", status=200):
        response_data = {
            "success": True,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        if data is not None:
            response_data["data"] = data
            
        return JsonResponse(response_data, status=status)
    
    @staticmethod
    def error(message, error_type=None, details=None, status=400):
        response_data = {
            "error": {
                "message": message,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
        
        if error_type:
            response_data["error"]["type"] = error_type
        if details:
            response_data["error"]["details"] = details
            
        return JsonResponse(response_data, status=status)
    
    @staticmethod
    def created(data=None, message="Created successfully"):
        return APIResponse.success(data=data, message=message, status=201)
    
    @staticmethod
    def no_content():
        return JsonResponse({}, status=204)
    
    @staticmethod
    def bad_request(message="Bad request", details=None):
        return APIResponse.error(
            message=message,
            error_type="BAD_REQUEST",
            details=details,
            status=400
        )
    
    @staticmethod
    def unauthorized(message="Unauthorized"):
        return APIResponse.error(
            message=message,
            error_type="UNAUTHORIZED",
            status=401
        )
    
    @staticmethod
    def forbidden(message="Forbidden"):
        return APIResponse.error(
            message=message,
            error_type="FORBIDDEN",
            status=403
        )
    
    @staticmethod
    def not_found(message="Not found"):
        return APIResponse.error(
            message=message,
            error_type="NOT_FOUND",
            status=404
        )
    
    @staticmethod
    def conflict(message="Conflict", details=None):
        return APIResponse.error(
            message=message,
            error_type="CONFLICT",
            details=details,
            status=409
        )
    
    @staticmethod
    def internal_error(message="Internal server error"):
        return APIResponse.error(
            message=message,
            error_type="INTERNAL_ERROR",
            status=500
        )