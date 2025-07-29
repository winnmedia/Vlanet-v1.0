#!/usr/bin/env python
"""
CSRF 보호 테스트 스크립트
"""
import os
import django
import requests
import json

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

# 테스트 설정
BASE_URL = "http://localhost:8000/api"
if not settings.DEBUG:
    BASE_URL = "https://videoplanet.up.railway.app/api"

print(f"테스트 대상 서버: {BASE_URL}")
print(f"CSRF 활성화된 Phase: {settings.CSRF_ACTIVE_PHASES}")
print("-" * 50)

# 세션 생성
session = requests.Session()

def test_endpoint(name, method, url, data=None):
    """개별 엔드포인트 테스트"""
    print(f"\n[{name}] 테스트")
    print(f"URL: {method} {url}")
    
    # 1. CSRF 토큰 없이 요청
    print("1) CSRF 토큰 없이 요청...")
    try:
        if method == "POST":
            response = session.post(url, json=data)
        elif method == "GET":
            response = session.get(url)
        
        print(f"   상태 코드: {response.status_code}")
        if response.status_code == 403:
            error_data = response.json()
            if "CSRF" in str(error_data):
                print("   ✓ CSRF 보호 활성화됨 (토큰 없어서 실패)")
            else:
                print("   ? 403 에러이지만 CSRF 관련이 아님")
        else:
            print("   ✗ CSRF 보호 비활성화됨 (요청 성공)")
    except Exception as e:
        print(f"   에러: {e}")
    
    # 2. CSRF 토큰 획득
    print("\n2) CSRF 토큰 획득...")
    try:
        csrf_response = session.get(f"{BASE_URL}/users/csrf-token/")
        if csrf_response.status_code == 200:
            csrf_token = csrf_response.json().get('csrfToken')
            print(f"   ✓ CSRF 토큰 획득 성공: {csrf_token[:20]}...")
            
            # 3. CSRF 토큰과 함께 요청
            print("\n3) CSRF 토큰과 함께 요청...")
            headers = {
                'X-CSRFToken': csrf_token,
                'Referer': BASE_URL  # CSRF 검증에 필요
            }
            
            if method == "POST":
                response = session.post(url, json=data, headers=headers)
            
            print(f"   상태 코드: {response.status_code}")
            if response.status_code != 403:
                print("   ✓ CSRF 토큰으로 요청 성공")
            else:
                print("   ✗ CSRF 토큰이 있어도 실패")
                print(f"   응답: {response.text[:200]}")
        else:
            print(f"   ✗ CSRF 토큰 획득 실패: {csrf_response.status_code}")
    except Exception as e:
        print(f"   에러: {e}")

# 테스트 실행
print("\n" + "=" * 50)
print("CSRF 보호 테스트 시작")
print("=" * 50)

# Phase 1 엔드포인트 테스트
test_data = {
    "email": "test@example.com",
    "password": "TestPassword123!"
}

test_endpoint("로그인 (SignIn)", "POST", f"{BASE_URL}/users/login/", test_data)

test_data_signup = {
    "email": "newuser@example.com",
    "nickname": "testuser",
    "password": "TestPassword123!"
}

test_endpoint("회원가입 (SignUp)", "POST", f"{BASE_URL}/users/signup/", test_data_signup)

# Phase 1에 없는 엔드포인트 (CSRF 보호 안됨)
test_endpoint("이메일 중복 확인", "POST", f"{BASE_URL}/users/check-email/", {"email": "test@example.com"})

print("\n" + "=" * 50)
print("테스트 완료")
print("=" * 50)

# 요약
print("\n[요약]")
print("- Phase 1 엔드포인트(SignIn, SignUp)는 CSRF 보호가 활성화되어야 함")
print("- 다른 엔드포인트는 아직 CSRF 보호가 비활성화되어 있어야 함")
print("- CSRF 토큰은 /api/users/csrf-token/ 에서 획득 가능")
print("\n단계적 마이그레이션 진행 중...")