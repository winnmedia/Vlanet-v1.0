import logging
import time
import json
from django.http import HttpResponse

logger = logging.getLogger(__name__)

class DetailedLoggingMiddleware:
    """
    모든 요청과 응답에 대한 자세한 로깅을 제공하는 미들웨어
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 요청 시작 시간 기록
        start_time = time.time()
        
        # 요청 정보 로깅
        self._log_request(request)
        
        # 다음 미들웨어 또는 뷰 실행
        response = self.get_response(request)
        
        # 응답 정보 로깅
        duration = time.time() - start_time
        self._log_response(request, response, duration)
        
        return response
    
    def _log_request(self, request):
        """요청 정보를 로깅"""
        log_data = {
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET),
            'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
            'ip': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
        
        # POST 데이터 로깅 (민감한 정보 제외)
        if request.method == 'POST':
            try:
                if request.content_type == 'application/json':
                    body = json.loads(request.body)
                    # 비밀번호 등 민감한 정보 마스킹
                    if isinstance(body, dict):
                        safe_body = {k: '***' if 'password' in k.lower() else v 
                                   for k, v in body.items()}
                        log_data['body'] = safe_body
                else:
                    log_data['body_keys'] = list(request.POST.keys())
            except:
                log_data['body'] = 'Could not parse body'
        
        logger.info(f"REQUEST: {json.dumps(log_data, indent=2)}")
    
    def _log_response(self, request, response, duration):
        """응답 정보를 로깅"""
        log_data = {
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
        }
        
        # 에러 응답인 경우 더 자세한 정보 로깅
        if response.status_code >= 400:
            if hasattr(response, 'content'):
                try:
                    content = response.content.decode('utf-8')
                    if len(content) < 1000:  # 너무 긴 내용은 제외
                        log_data['response_body'] = content
                except:
                    pass
        
        log_level = logging.ERROR if response.status_code >= 500 else \
                   logging.WARNING if response.status_code >= 400 else \
                   logging.INFO
        
        logger.log(log_level, f"RESPONSE: {json.dumps(log_data, indent=2)}")
    
    def _get_client_ip(self, request):
        """클라이언트 IP 주소 추출"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def process_exception(self, request, exception):
        """예외 발생 시 자세한 로깅"""
        logger.error(
            f"EXCEPTION in {request.method} {request.path}: "
            f"{type(exception).__name__}: {str(exception)}",
            exc_info=True,
            extra={
                'request_path': request.path,
                'request_method': request.method,
                'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
            }
        )
        return None