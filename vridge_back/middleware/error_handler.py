# -*- coding: utf-8 -*-
import json
import logging
import traceback
from django.http import JsonResponse
from django.core.exceptions import ValidationError, PermissionDenied, ObjectDoesNotExist
from django.db import IntegrityError
from rest_framework.exceptions import AuthenticationFailed
from django.views.defaults import server_error
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware:
    """
    전역 에러 처리 미들웨어
    모든 예외를 포착하여 일관된 JSON 형식으로 응답
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            return self.handle_exception(request, e)
    
    def handle_exception(self, request, exception):
        """예외를 처리하고 표준화된 에러 응답 반환"""
        
        # 고유한 에러 ID 생성
        error_id = str(uuid.uuid4())
        
        # 에러 정보 로깅
        logger.error(
            f"Error ID: {error_id} | "
            f"Path: {request.path} | "
            f"Method: {request.method} | "
            f"User: {getattr(request, 'user', 'Anonymous')} | "
            f"Exception: {type(exception).__name__} | "
            f"Message: {str(exception)}",
            exc_info=True
        )
        
        # 예외 타입별 응답 생성
        if isinstance(exception, ValidationError):
            return self._validation_error_response(exception, error_id)
        
        elif isinstance(exception, PermissionDenied):
            return self._permission_denied_response(exception, error_id)
        
        elif isinstance(exception, ObjectDoesNotExist):
            return self._not_found_response(exception, error_id)
        
        elif isinstance(exception, AuthenticationFailed):
            return self._authentication_failed_response(exception, error_id)
        
        elif isinstance(exception, IntegrityError):
            return self._integrity_error_response(exception, error_id)
        
        elif isinstance(exception, json.JSONDecodeError):
            return self._json_decode_error_response(exception, error_id)
        
        elif hasattr(exception, 'status_code') and hasattr(exception, 'default_detail'):
            # DRF 예외 처리
            return self._drf_exception_response(exception, error_id)
        
        else:
            # 기타 모든 예외
            return self._internal_server_error_response(exception, error_id)
    
    def _create_error_response(self, status_code, error_type, message, details=None, error_id=None):
        """표준 에러 응답 생성"""
        response_data = {
            "error": {
                "type": error_type,
                "message": message,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error_id": error_id
            }
        }
        
        if details:
            response_data["error"]["details"] = details
            
        # 개발 환경에서만 스택 트레이스 포함
        if hasattr(settings, 'DEBUG') and settings.DEBUG:
            response_data["error"]["debug_info"] = {
                "traceback": traceback.format_exc()
            }
            
        return JsonResponse(response_data, status=status_code)
    
    def _validation_error_response(self, exception, error_id):
        """유효성 검증 에러 응답 (400)"""
        if hasattr(exception, 'message_dict'):
            details = exception.message_dict
        elif hasattr(exception, 'messages'):
            details = {"errors": exception.messages}
        else:
            details = {"errors": [str(exception)]}
            
        return self._create_error_response(
            status_code=400,
            error_type="VALIDATION_ERROR",
            message="입력값이 올바르지 않습니다.",
            details=details,
            error_id=error_id
        )
    
    def _permission_denied_response(self, exception, error_id):
        """권한 거부 응답 (403)"""
        return self._create_error_response(
            status_code=403,
            error_type="PERMISSION_DENIED",
            message="이 작업을 수행할 권한이 없습니다.",
            error_id=error_id
        )
    
    def _not_found_response(self, exception, error_id):
        """리소스 없음 응답 (404)"""
        model_name = exception.args[0].split()[0] if exception.args else "리소스"
        return self._create_error_response(
            status_code=404,
            error_type="NOT_FOUND",
            message=f"{model_name}를 찾을 수 없습니다.",
            error_id=error_id
        )
    
    def _authentication_failed_response(self, exception, error_id):
        """인증 실패 응답 (401)"""
        return self._create_error_response(
            status_code=401,
            error_type="AUTHENTICATION_FAILED",
            message="인증에 실패했습니다. 다시 로그인해주세요.",
            error_id=error_id
        )
    
    def _integrity_error_response(self, exception, error_id):
        """데이터베이스 무결성 에러 응답 (409)"""
        message = "데이터 충돌이 발생했습니다."
        
        # 중복 키 에러 감지
        if 'UNIQUE constraint failed' in str(exception) or 'duplicate key value' in str(exception):
            message = "이미 존재하는 데이터입니다."
        elif 'FOREIGN KEY constraint failed' in str(exception):
            message = "참조하는 데이터가 존재하지 않습니다."
            
        return self._create_error_response(
            status_code=409,
            error_type="INTEGRITY_ERROR",
            message=message,
            error_id=error_id
        )
    
    def _json_decode_error_response(self, exception, error_id):
        """JSON 파싱 에러 응답 (400)"""
        return self._create_error_response(
            status_code=400,
            error_type="JSON_PARSE_ERROR",
            message="올바른 JSON 형식이 아닙니다.",
            details={"position": exception.pos, "line": exception.lineno, "column": exception.colno},
            error_id=error_id
        )
    
    def _drf_exception_response(self, exception, error_id):
        """Django REST Framework 예외 응답"""
        details = None
        if hasattr(exception, 'detail'):
            if hasattr(exception.detail, 'items'):
                details = dict(exception.detail)
            else:
                details = {"errors": [str(exception.detail)]}
                
        return self._create_error_response(
            status_code=exception.status_code,
            error_type=exception.__class__.__name__.upper(),
            message=str(exception.default_detail),
            details=details,
            error_id=error_id
        )
    
    def _internal_server_error_response(self, exception, error_id):
        """내부 서버 에러 응답 (500)"""
        return self._create_error_response(
            status_code=500,
            error_type="INTERNAL_SERVER_ERROR",
            message="서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            error_id=error_id
        )


from django.conf import settings

class StandardizedResponseMiddleware:
    """
    성공 응답도 표준화하는 미들웨어
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # API 엔드포인트만 처리 (admin, static 제외)
        if (request.path.startswith('/api/') and 
            response.get('Content-Type', '').startswith('application/json')):
            
            # 이미 표준화된 응답이면 건너뛰기
            try:
                content = json.loads(response.content)
                if 'error' in content or 'data' in content:
                    return response
            except:
                return response
            
            # 성공 응답 표준화
            if 200 <= response.status_code < 300:
                try:
                    original_content = json.loads(response.content)
                    standardized_content = {
                        "success": True,
                        "data": original_content,
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
                    
                    # 페이지네이션 정보가 있으면 최상위로 이동
                    if 'count' in original_content and 'results' in original_content:
                        standardized_content['data'] = original_content['results']
                        standardized_content['pagination'] = {
                            'count': original_content['count'],
                            'next': original_content.get('next'),
                            'previous': original_content.get('previous')
                        }
                    
                    response.content = json.dumps(standardized_content, ensure_ascii=False)
                    response['Content-Length'] = len(response.content)
                except:
                    # JSON 파싱 실패시 원본 응답 반환
                    pass
                    
        return response