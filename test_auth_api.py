#!/usr/bin/env python3
"""
VideoPlanet 인증 API 테스트
회원가입, 로그인, 이메일 인증 등 주요 인증 기능 테스트
"""
import requests
import json
import time

# 테스트 설정
BASE_URL = "https://videoplanet.up.railway.app"
FRONTEND_ORIGIN = "https://vlanet.net"

# 테스트용 사용자 정보
test_user = {
    "email": f"test_{int(time.time())}@example.com",
    "password": "TestPassword123!",
    "nickname": f"testuser_{int(time.time())}"
}

def print_response(response, title):
    """응답 출력 헬퍼"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response Text: {response.text[:500]}")

def test_health_check():
    """헬스체크 엔드포인트 테스트"""
    headers = {"Origin": FRONTEND_ORIGIN}
    response = requests.get(f"{BASE_URL}/health/", headers=headers)
    print_response(response, "1. Health Check Test")
    return response.status_code == 200

def test_check_email():
    """이메일 중복 확인 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    data = {"email": test_user["email"]}
    response = requests.post(f"{BASE_URL}/users/check_email", headers=headers, json=data)
    print_response(response, "2. Email Check Test")
    return response.status_code == 200

def test_check_nickname():
    """닉네임 중복 확인 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    data = {"nickname": test_user["nickname"]}
    response = requests.post(f"{BASE_URL}/users/check_nickname", headers=headers, json=data)
    print_response(response, "3. Nickname Check Test")
    return response.status_code == 200

def test_signup():
    """회원가입 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    response = requests.post(f"{BASE_URL}/users/signup", headers=headers, json=test_user)
    print_response(response, "4. Signup Test")
    
    if response.status_code == 201:
        try:
            data = response.json()
            return data.get("vridge_session") or data.get("access_token") or data.get("token")
        except:
            pass
    return None

def test_login(email=None, password=None):
    """로그인 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    login_data = {
        "email": email or test_user["email"],
        "password": password or test_user["password"]
    }
    response = requests.post(f"{BASE_URL}/users/login", headers=headers, json=login_data)
    print_response(response, "5. Login Test")
    
    if response.status_code in [200, 201]:
        try:
            data = response.json()
            return data.get("vridge_session") or data.get("access_token") or data.get("token")
        except:
            pass
    return None

def test_send_auth_number():
    """인증번호 발송 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    data = {"email": test_user["email"]}
    response = requests.post(f"{BASE_URL}/users/send_authnumber/signup", headers=headers, json=data)
    print_response(response, "6. Send Auth Number Test")
    return response.status_code == 200

def test_authenticated_endpoint(token):
    """인증이 필요한 엔드포인트 테스트"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": FRONTEND_ORIGIN
    }
    response = requests.get(f"{BASE_URL}/projects/project_list", headers=headers)
    print_response(response, "7. Authenticated Endpoint Test")
    return response.status_code == 200

def main():
    print("VideoPlanet Authentication API Test")
    print("===================================")
    print(f"Backend URL: {BASE_URL}")
    print(f"Frontend Origin: {FRONTEND_ORIGIN}")
    print(f"Test User: {test_user['email']}")
    
    results = {}
    
    # 1. 헬스체크
    results['health_check'] = test_health_check()
    
    # 2. 이메일 중복 확인
    results['email_check'] = test_check_email()
    
    # 3. 닉네임 중복 확인
    results['nickname_check'] = test_check_nickname()
    
    # 4. 회원가입
    token = test_signup()
    results['signup'] = token is not None
    
    # 5. 로그인 (회원가입 실패 시)
    if not token:
        token = test_login()
        results['login'] = token is not None
    else:
        results['login'] = True
    
    # 6. 인증번호 발송 (이메일 시스템 테스트)
    results['send_auth'] = test_send_auth_number()
    
    # 7. 인증된 API 호출
    if token:
        results['authenticated_api'] = test_authenticated_endpoint(token)
    else:
        results['authenticated_api'] = False
    
    # 결과 요약
    print("\n" + "="*60)
    print("TEST RESULTS SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:20} : {status}")
    
    # 이메일 시스템 상태
    print("\n" + "="*60)
    print("EMAIL SYSTEM STATUS")
    print("="*60)
    if results['send_auth']:
        print("✅ 이메일 API는 응답하지만, 실제 발송은 환경변수 설정 필요")
    else:
        print("❌ 이메일 발송 API 자체가 실패")
    
    print("\n주요 문제:")
    print("- Railway에 EMAIL_HOST_USER와 EMAIL_HOST_PASSWORD 환경변수 미설정")
    print("- Gmail 앱 비밀번호 필요 (2단계 인증 활성화 후 생성)")

if __name__ == "__main__":
    main()