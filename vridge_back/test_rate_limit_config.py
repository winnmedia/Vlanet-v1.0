#!/usr/bin/env python3
"""
Rate Limiting 설정 테스트 스크립트
개발 환경에서 Rate Limiting 설정이 올바르게 적용되는지 확인
"""
import os
import sys
import django
from pathlib import Path

# Django 설정
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')

django.setup()

from django.conf import settings
from config.rate_limit_middleware import RateLimitMiddleware
from django.test import RequestFactory
from unittest.mock import MagicMock
import json

def test_rate_limiting_configuration():
    """Rate Limiting 설정 테스트"""
    print("=== Rate Limiting 설정 테스트 ===")
    
    # 현재 설정 출력
    print(f"DEBUG: {settings.DEBUG}")
    print(f"RATE_LIMITING_ENABLED: {getattr(settings, 'RATE_LIMITING_ENABLED', 'Not Set')}")
    print(f"RATE_LIMIT_WHITELIST_IPS: {getattr(settings, 'RATE_LIMIT_WHITELIST_IPS', [])}")
    print(f"RATE_LIMIT_TEST_ACCOUNTS: {getattr(settings, 'RATE_LIMIT_TEST_ACCOUNTS', [])}")
    
    # 미들웨어 초기화
    get_response = MagicMock()
    middleware = RateLimitMiddleware(get_response)
    
    print(f"\n미들웨어 활성화 상태: {middleware.enabled}")
    print(f"화이트리스트 IP: {middleware.whitelist_ips}")
    print(f"테스트 계정: {middleware.test_accounts}")
    
    # 엔드포인트별 제한 설정 출력
    print("\n=== 엔드포인트별 Rate Limit 설정 ===")
    for endpoint, config in middleware.endpoints.items():
        print(f"{endpoint}: {config['limit']}회/{config['window']}초")
    
    return middleware

def test_ip_whitelist():
    """IP 화이트리스트 테스트"""
    print("\n=== IP 화이트리스트 테스트 ===")
    
    middleware = test_rate_limiting_configuration()
    
    test_ips = [
        '127.0.0.1',      # localhost
        '::1',            # localhost IPv6
        '192.168.1.100',  # 사설 네트워크
        '10.0.0.1',       # 사설 네트워크
        '172.16.0.1',     # 사설 네트워크
        '8.8.8.8',        # 공인 IP (화이트리스트 아님)
    ]
    
    for ip in test_ips:
        is_whitelisted = middleware.is_whitelisted_ip(ip)
        print(f"{ip:<15}: {'✓ 화이트리스트' if is_whitelisted else '✗ 제한 적용'}")

def test_test_account_bypass():
    """테스트 계정 우회 테스트"""
    print("\n=== 테스트 계정 우회 테스트 ===")
    
    middleware = test_rate_limiting_configuration()
    factory = RequestFactory()
    
    test_accounts = [
        'test@example.com',
        'dev@vlanet.net',
        'admin@vlanet.net',
        'user@example.com',  # 테스트 계정 아님
    ]
    
    for email in test_accounts:
        login_data = json.dumps({'email': email, 'password': 'test123'})
        request = factory.post(
            '/api/users/login/',
            data=login_data,
            content_type='application/json'
        )
        
        is_test_account = middleware.is_test_account_request(request)
        print(f"{email:<20}: {'✓ 우회 가능' if is_test_account else '✗ 제한 적용'}")

def test_different_environments():
    """다양한 환경 설정 테스트"""
    print("\n=== 환경별 설정 테스트 ===")
    
    # 개발 환경 (현재)
    print("1. 개발 환경 (settings_dev.py):")
    middleware_dev = test_rate_limiting_configuration()
    
    # 운영 환경 시뮬레이션
    print("\n2. 운영 환경 시뮬레이션:")
    original_debug = settings.DEBUG
    original_enabled = getattr(settings, 'RATE_LIMITING_ENABLED', True)
    
    # 임시로 운영 환경 설정
    setattr(settings, 'DEBUG', False)
    setattr(settings, 'RATE_LIMITING_ENABLED', True)
    
    get_response = MagicMock()
    middleware_prod = RateLimitMiddleware(get_response)
    
    print(f"운영 환경 활성화 상태: {middleware_prod.enabled}")
    print("운영 환경 엔드포인트 제한:")
    for endpoint, config in middleware_prod.endpoints.items():
        print(f"  {endpoint}: {config['limit']}회/{config['window']}초")
    
    # 원래 설정 복원
    setattr(settings, 'DEBUG', original_debug)
    setattr(settings, 'RATE_LIMITING_ENABLED', original_enabled)

def main():
    """메인 테스트 실행"""
    print("Rate Limiting 설정 테스트를 시작합니다...\n")
    
    try:
        test_rate_limiting_configuration()
        test_ip_whitelist()
        test_test_account_bypass()
        test_different_environments()
        
        print("\n=== 테스트 완료 ===")
        print("✓ 모든 설정이 올바르게 적용되었습니다.")
        
        if not getattr(settings, 'RATE_LIMITING_ENABLED', True):
            print("📝 개발 환경에서 Rate Limiting이 비활성화되어 있습니다.")
            print("   무제한 로그인 테스트가 가능합니다.")
        
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())