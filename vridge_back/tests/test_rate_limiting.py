"""
Rate Limiting 미들웨어 테스트
"""
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, RequestFactory, override_settings
from django.http import JsonResponse
from django.conf import settings
from config.rate_limit_middleware import RateLimitMiddleware


class RateLimitMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.get_response = MagicMock(return_value=MagicMock(status_code=200))
        
    def test_disabled_in_debug_mode(self):
        """DEBUG=True일 때 Rate Limiting이 비활성화되는지 테스트"""
        with override_settings(DEBUG=True, RATE_LIMITING_ENABLED=False):
            middleware = RateLimitMiddleware(self.get_response)
            self.assertFalse(middleware.enabled)
            
    def test_enabled_in_production_mode(self):
        """DEBUG=False일 때 Rate Limiting이 활성화되는지 테스트"""
        with override_settings(DEBUG=False, RATE_LIMITING_ENABLED=True):
            middleware = RateLimitMiddleware(self.get_response)
            self.assertTrue(middleware.enabled)
            
    def test_whitelist_ip_bypass(self):
        """화이트리스트 IP가 Rate Limiting을 우회하는지 테스트"""
        with override_settings(
            DEBUG=False, 
            RATE_LIMITING_ENABLED=True,
            RATE_LIMIT_WHITELIST_IPS=['127.0.0.1']
        ):
            middleware = RateLimitMiddleware(self.get_response)
            
            # 화이트리스트 IP에서 요청
            request = self.factory.post('/api/users/login/', REMOTE_ADDR='127.0.0.1')
            response = middleware(request)
            
            # get_response가 호출되어야 함 (Rate Limiting 우회)
            self.get_response.assert_called_once_with(request)
            
    def test_test_account_bypass(self):
        """테스트 계정이 Rate Limiting을 우회하는지 테스트"""
        with override_settings(
            DEBUG=False,
            RATE_LIMITING_ENABLED=True,
            RATE_LIMIT_TEST_ACCOUNTS=['test@example.com']
        ):
            middleware = RateLimitMiddleware(self.get_response)
            
            # 테스트 계정으로 로그인 요청
            login_data = json.dumps({'email': 'test@example.com', 'password': 'test123'})
            request = self.factory.post(
                '/api/users/login/',
                data=login_data,
                content_type='application/json',
                REMOTE_ADDR='192.168.1.100'
            )
            
            response = middleware(request)
            
            # get_response가 호출되어야 함 (Rate Limiting 우회)
            self.get_response.assert_called_once_with(request)
            
    def test_cidr_whitelist(self):
        """CIDR 블록 화이트리스트가 작동하는지 테스트"""
        with override_settings(
            DEBUG=False,
            RATE_LIMITING_ENABLED=True,
            RATE_LIMIT_WHITELIST_IPS=['192.168.0.0/16']
        ):
            middleware = RateLimitMiddleware(self.get_response)
            
            # 192.168.x.x 네트워크에서 요청
            request = self.factory.post('/api/users/login/', REMOTE_ADDR='192.168.1.100')
            response = middleware(request)
            
            # get_response가 호출되어야 함 (CIDR 화이트리스트 적용)
            self.get_response.assert_called_once_with(request)
            
    @patch('config.rate_limit_middleware.cache')
    def test_rate_limit_exceeded(self, mock_cache):
        """Rate Limit 초과 시 429 에러 반환 테스트"""
        with override_settings(
            DEBUG=False,
            RATE_LIMITING_ENABLED=True,
            RATE_LIMIT_WHITELIST_IPS=[],
            RATE_LIMIT_TEST_ACCOUNTS=[]
        ):
            # get_response 모킹을 실제 응답으로 교체
            def mock_get_response(request):
                return MagicMock(status_code=200)
            
            middleware = RateLimitMiddleware(mock_get_response)
            
            # 이미 제한에 도달한 상태로 모킹
            mock_cache.get.return_value = [1, 2, 3, 4, 5]  # 5개 요청 이미 존재
            
            request = self.factory.post('/api/users/login/', REMOTE_ADDR='10.0.0.1')
            response = middleware(request)
            
            # 429 상태 코드 반환
            self.assertIsInstance(response, JsonResponse)
            self.assertEqual(response.status_code, 429)
            
    def test_development_lenient_limits(self):
        """개발 환경에서 관대한 제한 설정 테스트"""
        with override_settings(DEBUG=True):
            middleware = RateLimitMiddleware(self.get_response)
            
            # 개발 환경에서는 높은 제한값 설정
            login_endpoint = middleware.endpoints.get('/api/users/login/')
            self.assertEqual(login_endpoint['limit'], 100)
            self.assertEqual(login_endpoint['window'], 60)
            
    def test_production_strict_limits(self):
        """운영 환경에서 엄격한 제한 설정 테스트"""
        with override_settings(DEBUG=False):
            middleware = RateLimitMiddleware(self.get_response)
            
            # 운영 환경에서는 낮은 제한값 설정
            login_endpoint = middleware.endpoints.get('/api/users/login/')
            self.assertEqual(login_endpoint['limit'], 5)
            self.assertEqual(login_endpoint['window'], 300)
            
    def test_x_forwarded_for_ip_extraction(self):
        """X-Forwarded-For 헤더에서 IP 추출 테스트"""
        middleware = RateLimitMiddleware(self.get_response)
        
        request = self.factory.post(
            '/api/users/login/',
            HTTP_X_FORWARDED_FOR='203.0.113.1, 70.41.3.18, 150.172.238.178'
        )
        
        ip = middleware.get_client_ip(request)
        self.assertEqual(ip, '203.0.113.1')  # 첫 번째 IP가 실제 클라이언트 IP
        
    def test_debug_info_in_development(self):
        """개발 환경에서 디버그 정보 포함 테스트"""
        with override_settings(
            DEBUG=True,
            RATE_LIMITING_ENABLED=True,
            RATE_LIMIT_WHITELIST_IPS=[],
            RATE_LIMIT_TEST_ACCOUNTS=[]
        ), patch('config.rate_limit_middleware.cache') as mock_cache:
            def mock_get_response(request):
                return MagicMock(status_code=200)
            
            middleware = RateLimitMiddleware(mock_get_response)
            
            # Rate limit 초과 상황 모킹
            mock_cache.get.return_value = [1] * 100  # 제한 초과
            
            request = self.factory.post('/api/users/login/', REMOTE_ADDR='10.0.0.1')
            response = middleware(request)
            
            # JsonResponse인지 확인
            self.assertIsInstance(response, JsonResponse)
            
            # 응답에 디버그 정보 포함 확인
            response_data = json.loads(response.content.decode('utf-8'))
            self.assertIn('debug_info', response_data)
            self.assertIn('ip', response_data['debug_info'])
            self.assertIn('endpoint', response_data['debug_info'])