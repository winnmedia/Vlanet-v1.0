#!/usr/bin/env python3
"""
백엔드 API 완전 테스트 및 디버깅 스크립트
"""
import requests
import json
import sys
from datetime import datetime

# 테스트 설정
BASE_URL = "http://localhost:8000"
RAILWAY_URL = "https://videoplanet.up.railway.app"

# 색상 코드
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def test_endpoint(name, url, method='GET', data=None, headers=None):
    """엔드포인트 테스트"""
    print(f"\n{BLUE}테스트: {name}{RESET}")
    print(f"URL: {url}")
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=5)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=5)
        else:
            response = requests.request(method, url, json=data, headers=headers, timeout=5)
        
        print(f"상태 코드: {response.status_code}")
        
        if response.status_code < 400:
            print(f"{GREEN}✅ 성공{RESET}")
            if response.headers.get('content-type', '').startswith('application/json'):
                print("응답:", json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        else:
            print(f"{RED}❌ 실패{RESET}")
            print("응답:", response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"{RED}❌ 연결 실패 - 서버가 실행 중이 아닙니다{RESET}")
        return False
    except Exception as e:
        print(f"{RED}❌ 오류: {type(e).__name__}: {e}{RESET}")
        return False

def test_local_backend():
    """로컬 백엔드 테스트"""
    print(f"\n{YELLOW}=== 로컬 백엔드 테스트 ==={RESET}")
    
    results = {
        'total': 0,
        'passed': 0,
        'failed': 0
    }
    
    # 1. 헬스체크
    if test_endpoint("헬스체크", f"{BASE_URL}/api/health/"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1
    
    # 2. 회원가입 테스트
    test_user = {
        "email": f"test_{datetime.now().timestamp()}@example.com",
        "password": "Test123!",
        "name": "테스트 사용자"
    }
    
    if test_endpoint("회원가입", f"{BASE_URL}/api/auth/signup/", "POST", test_user):
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1
    
    # 3. 로그인 테스트
    login_data = {
        "email": "test@example.com",
        "password": "Test123!"
    }
    
    token = None
    if test_endpoint("로그인", f"{BASE_URL}/api/auth/login/", "POST", login_data):
        # 토큰 추출 시도
        try:
            response = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
            if response.status_code == 200:
                token = response.json().get('access')
                print(f"토큰 획득: {token[:20]}...")
        except:
            pass
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1
    
    # 4. 인증 필요 API 테스트 (토큰이 있는 경우)
    if token:
        auth_headers = {"Authorization": f"Bearer {token}"}
        
        # 프로젝트 목록
        if test_endpoint("프로젝트 목록", f"{BASE_URL}/api/projects/", headers=auth_headers):
            results['passed'] += 1
        else:
            results['failed'] += 1
        results['total'] += 1
        
        # 사용자 정보
        if test_endpoint("사용자 정보", f"{BASE_URL}/api/users/me/", headers=auth_headers):
            results['passed'] += 1
        else:
            results['failed'] += 1
        results['total'] += 1
    
    return results

def test_railway_backend():
    """Railway 백엔드 테스트"""
    print(f"\n{YELLOW}=== Railway 백엔드 테스트 ==={RESET}")
    
    results = {
        'total': 0,
        'passed': 0,
        'failed': 0
    }
    
    # 헬스체크만 테스트
    if test_endpoint("Railway 헬스체크", f"{RAILWAY_URL}/api/health/"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1
    
    return results

def main():
    """메인 실행"""
    print(f"{BLUE}🔍 VideoPlanet 백엔드 API 완전 디버깅{RESET}")
    print("=" * 50)
    
    # 로컬 테스트
    local_results = test_local_backend()
    
    # Railway 테스트
    railway_results = test_railway_backend()
    
    # 결과 요약
    print(f"\n{YELLOW}=== 테스트 결과 요약 ==={RESET}")
    print("\n로컬 백엔드:")
    print(f"  총 테스트: {local_results['total']}")
    print(f"  {GREEN}성공: {local_results['passed']}{RESET}")
    print(f"  {RED}실패: {local_results['failed']}{RESET}")
    print(f"  성공률: {local_results['passed']/local_results['total']*100:.1f}%")
    
    print("\nRailway 백엔드:")
    print(f"  총 테스트: {railway_results['total']}")
    print(f"  {GREEN}성공: {railway_results['passed']}{RESET}")
    print(f"  {RED}실패: {railway_results['failed']}{RESET}")
    
    # 진단 및 해결책
    print(f"\n{YELLOW}=== 진단 및 해결책 ==={RESET}")
    
    if local_results['failed'] > 0:
        print(f"\n{RED}로컬 백엔드 문제 발견:{RESET}")
        print("1. Django 서버가 실행 중인지 확인")
        print("2. 포트 8000이 사용 가능한지 확인")
        print("3. CORS 설정 확인")
    else:
        print(f"\n{GREEN}로컬 백엔드 정상 작동!{RESET}")
    
    if railway_results['failed'] > 0:
        print(f"\n{RED}Railway 백엔드 문제 발견:{RESET}")
        print("1. Railway 환경변수 설정 필요:")
        print("   - SECRET_KEY")
        print("   - DATABASE_URL") 
        print("   - DJANGO_SETTINGS_MODULE=config.settings_railway")
        print("2. PostgreSQL 서비스 연결 확인")
        print("3. 빌드 로그 확인")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    main()