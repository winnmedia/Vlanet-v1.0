#!/usr/bin/env python3
"""
상세 이메일 테스트 및 진단
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "https://videoplanet.up.railway.app"
FRONTEND_ORIGIN = "https://vlanet.net"

def test_server_status():
    """서버 상태 확인"""
    print("\n1. 서버 상태 확인")
    print("-" * 50)
    
    response = requests.get(f"{BASE_URL}/health/", headers={"Origin": FRONTEND_ORIGIN})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print(f"Server Time: {response.headers.get('Date', 'Unknown')}")
    
    return response.status_code == 200

def test_email_endpoints():
    """이메일 관련 엔드포인트 테스트"""
    print("\n2. 이메일 엔드포인트 테스트")
    print("-" * 50)
    
    test_cases = [
        {
            "name": "회원가입 이메일 인증",
            "url": f"{BASE_URL}/users/send_authnumber/signup",
            "data": {"email": f"signup_test_{int(time.time())}@example.com"}
        },
        {
            "name": "비밀번호 재설정 이메일",
            "url": f"{BASE_URL}/users/send_authnumber/reset",
            "data": {"email": f"reset_test_{int(time.time())}@example.com"}
        }
    ]
    
    results = []
    for test in test_cases:
        print(f"\n테스트: {test['name']}")
        print(f"URL: {test['url']}")
        print(f"Data: {test['data']}")
        
        headers = {
            "Content-Type": "application/json",
            "Origin": FRONTEND_ORIGIN
        }
        
        start_time = time.time()
        response = requests.post(test['url'], headers=headers, json=test['data'])
        elapsed = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print(f"Time: {elapsed:.2f}s")
        
        results.append({
            "test": test['name'],
            "status": response.status_code,
            "success": response.status_code == 200,
            "message": response.json().get('message', 'No message')
        })
    
    return results

def diagnose_issue():
    """문제 진단"""
    print("\n3. 문제 진단")
    print("-" * 50)
    
    # 가능한 원인들
    print("\n가능한 원인:")
    print("1. Railway 환경변수가 아직 적용되지 않음")
    print("   - Railway 대시보드에서 재배포 상태 확인 필요")
    print("   - 환경변수 변경 후 자동 재배포가 완료되었는지 확인")
    
    print("\n2. 환경변수 이름 불일치")
    print("   - 설정한 변수명: EMAIL_HOST_USER, EMAIL_HOST_PASSWORD")
    print("   - 코드에서 사용하는 변수명과 일치하는지 확인")
    
    print("\n3. Gmail 앱 비밀번호 문제")
    print("   - 16자리 비밀번호가 정확히 입력되었는지 확인")
    print("   - 공백이나 특수문자가 포함되지 않았는지 확인")

def check_alternative_endpoints():
    """대체 엔드포인트 확인"""
    print("\n4. 대체 엔드포인트 테스트")
    print("-" * 50)
    
    # 로그인 등 다른 기능은 정상인지 확인
    test_user = {
        "email": "test_1751372840@example.com",
        "password": "TestPassword123!"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    
    response = requests.post(f"{BASE_URL}/users/login", headers=headers, json=test_user)
    print(f"로그인 테스트 - Status: {response.status_code}")
    print(f"로그인 정상 작동: {'✅' if response.status_code in [200, 201] else '❌'}")

def main():
    print("="*60)
    print("VideoPlanet 이메일 시스템 상세 진단")
    print(f"테스트 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # 1. 서버 상태 확인
    server_ok = test_server_status()
    
    if not server_ok:
        print("\n❌ 서버가 응답하지 않습니다!")
        return
    
    # 2. 이메일 엔드포인트 테스트
    email_results = test_email_endpoints()
    
    # 3. 문제 진단
    diagnose_issue()
    
    # 4. 대체 엔드포인트 확인
    check_alternative_endpoints()
    
    # 5. 결과 요약
    print("\n" + "="*60)
    print("테스트 결과 요약")
    print("="*60)
    
    all_passed = all(r['success'] for r in email_results)
    
    if all_passed:
        print("✅ 모든 이메일 테스트 통과!")
        print("이메일 시스템이 정상적으로 작동합니다.")
    else:
        print("❌ 이메일 발송 실패")
        print("\n즉시 확인 필요:")
        print("1. Railway 대시보드 > Deployments 탭에서 최신 배포 확인")
        print("2. Variables 탭에서 EMAIL_HOST_USER와 EMAIL_HOST_PASSWORD 확인")
        print("3. 필요시 수동으로 'Redeploy' 버튼 클릭")
        print("\n환경변수 설정값:")
        print("EMAIL_HOST_USER=vridgeofficial@gmail.com")
        print("EMAIL_HOST_PASSWORD=itwrvymmmwaagouh")

if __name__ == "__main__":
    main()