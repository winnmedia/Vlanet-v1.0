"""
Rate Limiting 미들웨어
인증 관련 엔드포인트에 대한 요청 제한
"""
import time
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings
import ipaddress
import json


class RateLimitMiddleware:
    """
    IP 기반 Rate Limiting 미들웨어
    - 로그인/회원가입 엔드포인트 보호
    - 브루트포스 공격 방지
    - 개발 환경에서 완화된 설정 지원
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Rate Limiting 활성화 설정
        self.enabled = getattr(settings, 'RATE_LIMITING_ENABLED', not settings.DEBUG)
        
        # IP 화이트리스트 설정
        self.whitelist_ips = set(getattr(settings, 'RATE_LIMIT_WHITELIST_IPS', ['127.0.0.1', '::1']))
        
        # 테스트 계정 화이트리스트
        self.test_accounts = set(getattr(settings, 'RATE_LIMIT_TEST_ACCOUNTS', []))
        
        # Rate limit 설정 (환경별 다른 값)
        if settings.DEBUG:
            # 개발 환경: 매우 관대한 설정
            self.endpoints = {
                '/api/users/login/': {'limit': 100, 'window': 60},  # 1분당 100회
                '/api/users/register/': {'limit': 50, 'window': 60},  # 1분당 50회
                '/api/users/password-reset/': {'limit': 20, 'window': 300},  # 5분당 20회
                '/api/users/social-login/': {'limit': 100, 'window': 60},  # 1분당 100회
            }
        else:
            # 운영 환경: 엄격한 설정
            self.endpoints = {
                '/api/users/login/': {'limit': 5, 'window': 300},  # 5분당 5회
                '/api/users/register/': {'limit': 3, 'window': 600},  # 10분당 3회
                '/api/users/password-reset/': {'limit': 3, 'window': 3600},  # 1시간당 3회
                '/api/users/social-login/': {'limit': 10, 'window': 300},  # 5분당 10회
            }
    
    def __call__(self, request):
        # Rate Limiting이 비활성화된 경우 바로 통과
        if not self.enabled:
            return self.get_response(request)
            
        # 화이트리스트 IP 체크
        client_ip = self.get_client_ip(request)
        if self.is_whitelisted_ip(client_ip):
            return self.get_response(request)
            
        # 테스트 계정 체크 (로그인 요청인 경우)
        if self.is_test_account_request(request):
            return self.get_response(request)
        
        # Rate limiting 체크
        for endpoint, config in self.endpoints.items():
            if request.path.startswith(endpoint):
                if not self.check_rate_limit(request, endpoint, config):
                    return JsonResponse({
                        'error': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
                        'retry_after': config['window'],
                        'debug_info': {
                            'ip': client_ip,
                            'endpoint': endpoint,
                            'limit': config['limit'],
                            'window': config['window']
                        } if settings.DEBUG else None
                    }, status=429)
        
        response = self.get_response(request)
        return response
    
    def is_whitelisted_ip(self, ip):
        """IP가 화이트리스트에 있는지 확인"""
        if not ip:
            return False
            
        # 직접 매칭
        if ip in self.whitelist_ips:
            return True
            
        # CIDR 블록 매칭 (예: 192.168.0.0/24)
        try:
            ip_obj = ipaddress.ip_address(ip)
            for whitelist_entry in self.whitelist_ips:
                try:
                    if '/' in whitelist_entry:
                        network = ipaddress.ip_network(whitelist_entry, strict=False)
                        if ip_obj in network:
                            return True
                except (ValueError, ipaddress.AddressValueError):
                    continue
        except (ValueError, ipaddress.AddressValueError):
            pass
            
        return False
        
    def is_test_account_request(self, request):
        """테스트 계정 요청인지 확인"""
        if not self.test_accounts or request.path != '/api/users/login/':
            return False
            
        try:
            if request.body:
                data = json.loads(request.body)
                email = data.get('email', '')
                return email in self.test_accounts
        except (json.JSONDecodeError, AttributeError):
            pass
            
        return False
    
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
        # Railway, Vercel 등의 프록시 환경을 고려한 IP 추출
        forwarded_ips = [
            request.META.get('HTTP_X_FORWARDED_FOR'),
            request.META.get('HTTP_X_REAL_IP'),
            request.META.get('HTTP_CF_CONNECTING_IP'),  # Cloudflare
            request.META.get('HTTP_X_FORWARDED'),
            request.META.get('HTTP_FORWARDED_FOR'),
            request.META.get('HTTP_FORWARDED')
        ]
        
        for forwarded in forwarded_ips:
            if forwarded:
                # 첫 번째 IP가 실제 클라이언트 IP
                ip = forwarded.split(',')[0].strip()
                if ip and ip != 'unknown':
                    return ip
                    
        return request.META.get('REMOTE_ADDR', 'unknown')


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