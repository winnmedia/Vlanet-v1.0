import logging
import traceback
import os
from django.http import JsonResponse
from django.views.defaults import server_error
from django.conf import settings

logger = logging.getLogger(__name__)

def custom_500_handler(request, *args, **kwargs):
    """
    커스텀 500 에러 핸들러
    더 자세한 에러 정보를 로그에 남기고 개발 환경에서는 상세 정보 반환
    """
    # 현재 발생한 예외 정보 가져오기
    import sys
    exc_type, exc_value, exc_traceback = sys.exc_info()
    
    if exc_type:
        # 자세한 트레이스백 정보 로깅
        logger.error(
            f"500 Error occurred:\n"
            f"Request path: {request.path}\n"
            f"Request method: {request.method}\n"
            f"User: {request.user if hasattr(request, 'user') else 'Anonymous'}\n"
            f"Exception type: {exc_type.__name__}\n"
            f"Exception value: {exc_value}\n"
            f"Traceback:\n{''.join(traceback.format_tb(exc_traceback))}"
        )
        
        # 요청 데이터도 로깅 (민감한 정보는 제외)
        if request.method == 'POST':
            logger.error(f"POST data keys: {list(request.POST.keys())}")
        
        # 헤더 정보 로깅
        headers = {k: v for k, v in request.headers.items() 
                  if k.lower() not in ['authorization', 'cookie']}
        logger.error(f"Request headers: {headers}")
    
    # 개발 환경이거나 DEBUG가 True인 경우 상세 정보 반환
    if settings.DEBUG or (hasattr(settings, 'IS_RAILWAY') and settings.IS_RAILWAY and os.environ.get('ENABLE_DEBUG_TOOLBAR', 'False').lower() == 'true'):
        error_details = {
            'error': 'Internal Server Error',
            'status_code': 500,
            'path': request.path,
            'method': request.method,
        }
        
        if exc_type:
            error_details.update({
                'exception_type': exc_type.__name__,
                'exception_value': str(exc_value),
                'traceback': traceback.format_tb(exc_traceback)
            })
        
        return JsonResponse(error_details, status=500)
    
    # 프로덕션 환경에서는 일반적인 에러 메시지만 반환
    return JsonResponse({
        'error': 'Internal Server Error',
        'message': 'An error occurred while processing your request.',
        'status_code': 500
    }, status=500)

def custom_404_handler(request, exception):
    """
    커스텀 404 에러 핸들러
    """
    logger.warning(f"404 Error - Path not found: {request.path}")
    
    return JsonResponse({
        'error': 'Not Found',
        'message': f'The requested path {request.path} was not found.',
        'status_code': 404
    }, status=404)

def custom_403_handler(request, exception):
    """
    커스텀 403 에러 핸들러
    """
    logger.warning(
        f"403 Error - Permission denied: {request.path} "
        f"for user: {request.user if hasattr(request, 'user') else 'Anonymous'}"
    )
    
    return JsonResponse({
        'error': 'Forbidden',
        'message': 'You do not have permission to access this resource.',
        'status_code': 403
    }, status=403)

def custom_400_handler(request, exception):
    """
    커스텀 400 에러 핸들러
    """
    logger.warning(f"400 Error - Bad request: {request.path}")
    
    return JsonResponse({
        'error': 'Bad Request',
        'message': 'The request could not be understood or was missing required parameters.',
        'status_code': 400
    }, status=400)