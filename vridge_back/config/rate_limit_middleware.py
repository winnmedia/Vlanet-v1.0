"""
Rate Limiting 미들웨어
인증 관련 엔드포인트에 대한 요청 제한
"""
import time
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings


class RateLimitMiddleware:
    """
    IP 기반 Rate Limiting 미들웨어
    - 로그인/회원가입 엔드포인트 보호
    - 브루트포스 공격 방지
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Rate limit 설정
        self.endpoints = {
            '/api/users/login/': {'limit': 5, 'window': 300},  # 5분당 5회
            '/api/users/register/': {'limit': 3, 'window': 600},  # 10분당 3회
            '/api/users/password-reset/': {'limit': 3, 'window': 3600},  # 1시간당 3회
            '/api/users/social-login/': {'limit': 10, 'window': 300},  # 5분당 10회
        }
    
    def __call__(self, request):
        # Rate limiting 체크
        for endpoint, config in self.endpoints.items():
            if request.path.startswith(endpoint):
                if not self.check_rate_limit(request, endpoint, config):
                    return JsonResponse({
                        'error': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
                        'retry_after': config['window']
                    }, status=429)
        
        response = self.get_response(request)
        return response
    
    def check_rate_limit(self, request, endpoint, config):
        """Rate limit 체크"""
        ip = self.get_client_ip(request)
        cache_key = f'rate_limit:{endpoint}:{ip}'
        
        # 현재 시간 창에서의 요청 기록 가져오기
        requests = cache.get(cache_key, [])
        now = time.time()
        
        # 만료된 요청 제거
        requests = [req_time for req_time in requests if now - req_time < config['window']]
        
        # 제한 초과 체크
        if len(requests) >= config['limit']:
            return False
        
        # 새 요청 추가
        requests.append(now)
        cache.set(cache_key, requests, config['window'])
        
        return True
    
    def get_client_ip(self, request):
        """클라이언트 IP 주소 가져오기"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityAuditMiddleware:
    """
    보안 이벤트 로깅 미들웨어
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.suspicious_patterns = [
            'script>',
            'javascript:',
            'onerror=',
            'onload=',
            'SELECT * FROM',
            'DROP TABLE',
            'UNION SELECT',
            '../../',
            '%00',
            '\x00',
        ]
    
    def __call__(self, request):
        # 의심스러운 요청 감지
        self.check_suspicious_activity(request)
        
        response = self.get_response(request)
        
        # 실패한 인증 시도 로깅
        if request.path.startswith('/api/users/login/') and response.status_code == 401:
            self.log_failed_login(request)
        
        return response
    
    def check_suspicious_activity(self, request):
        """의심스러운 활동 체크"""
        # GET 파라미터 체크
        for param, value in request.GET.items():
            if isinstance(value, str):
                for pattern in self.suspicious_patterns:
                    if pattern.lower() in value.lower():
                        self.log_security_event('SUSPICIOUS_REQUEST', request, f'Pattern: {pattern}')
                        break
        
        # POST 데이터 체크 (JSON)
        if request.content_type == 'application/json' and request.body:
            try:
                import json
                data = json.loads(request.body)
                self.check_dict_for_patterns(data, request)
            except:
                pass
    
    def check_dict_for_patterns(self, data, request, path=''):
        """딕셔너리 재귀적으로 체크"""
        if isinstance(data, dict):
            for key, value in data.items():
                self.check_dict_for_patterns(value, request, f'{path}.{key}')
        elif isinstance(data, list):
            for i, item in enumerate(data):
                self.check_dict_for_patterns(item, request, f'{path}[{i}]')
        elif isinstance(data, str):
            for pattern in self.suspicious_patterns:
                if pattern.lower() in data.lower():
                    self.log_security_event('SUSPICIOUS_INPUT', request, f'Path: {path}, Pattern: {pattern}')
                    break
    
    def log_failed_login(self, request):
        """실패한 로그인 시도 로깅"""
        ip = self.get_client_ip(request)
        try:
            import json
            data = json.loads(request.body) if request.body else {}
            email = data.get('email', 'unknown')
        except:
            email = 'unknown'
        
        self.log_security_event('FAILED_LOGIN', request, f'Email: {email}, IP: {ip}')
    
    def log_security_event(self, event_type, request, details):
        """보안 이벤트 로깅"""
        import logging
        logger = logging.getLogger('security')
        
        ip = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'unknown')
        
        logger.warning(
            f"SECURITY_EVENT: {event_type} | "
            f"Path: {request.path} | "
            f"Method: {request.method} | "
            f"IP: {ip} | "
            f"User-Agent: {user_agent} | "
            f"Details: {details}"
        )
    
    def get_client_ip(self, request):
        """클라이언트 IP 주소 가져오기"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip