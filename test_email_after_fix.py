#!/usr/bin/env python3
"""
Railway 환경변수 설정 후 이메일 발송 테스트
"""
import requests
import json
import time

BASE_URL = "https://videoplanet.up.railway.app"
FRONTEND_ORIGIN = "https://vlanet.net"

def test_email_send(email):
    """이메일 발송 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    data = {"email": email}
    
    print(f"\n{'='*60}")
    print(f"이메일 발송 테스트: {email}")
    print(f"{'='*60}")
    
    response = requests.post(f"{BASE_URL}/users/send_authnumber/signup", headers=headers, json=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.status_code == 200

def test_email_auth(email, auth_number):
    """이메일 인증번호 확인 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    data = {
        "email": email,
        "auth_number": auth_number
    }
    
    print(f"\n{'='*60}")
    print(f"이메일 인증번호 확인: {email} / {auth_number}")
    print(f"{'='*60}")
    
    response = requests.post(f"{BASE_URL}/users/signup_emailauth/signup", headers=headers, json=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.status_code == 200

def test_password_reset_email(email):
    """비밀번호 재설정 이메일 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    data = {"email": email}
    
    print(f"\n{'='*60}")
    print(f"비밀번호 재설정 이메일 테스트: {email}")
    print(f"{'='*60}")
    
    response = requests.post(f"{BASE_URL}/users/send_authnumber/reset", headers=headers, json=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.status_code == 200

def main():
    print("VideoPlanet 이메일 시스템 테스트 (환경변수 설정 후)")
    print("="*60)
    print("Backend URL:", BASE_URL)
    print("Frontend Origin:", FRONTEND_ORIGIN)
    
    # 1. 새 이메일로 인증번호 발송 테스트
    test_email = f"test_{int(time.time())}@example.com"
    result1 = test_email_send(test_email)
    
    # 2. 잘못된 인증번호로 테스트
    if result1:
        test_email_auth(test_email, "123456")
    
    # 3. 기존 사용자 비밀번호 재설정 이메일 테스트
    existing_email = "test_1751372840@example.com"
    result2 = test_password_reset_email(existing_email)
    
    # 결과 요약
    print(f"\n{'='*60}")
    print("테스트 결과 요약")
    print(f"{'='*60}")
    
    if result1:
        print("✅ 회원가입 이메일 발송: 성공!")
        print("   - Gmail SMTP 연결 성공")
        print("   - 환경변수 올바르게 설정됨")
    else:
        print("❌ 회원가입 이메일 발송: 실패")
        print("   - Railway 재배포가 완료되었는지 확인 필요")
        print("   - railway logs --tail 로 오류 확인")
    
    if result2:
        print("✅ 비밀번호 재설정 이메일 발송: 성공!")
    else:
        print("❌ 비밀번호 재설정 이메일 발송: 실패")
    
    print("\n💡 팁:")
    print("- 이메일이 스팸함에 있을 수 있으니 확인해보세요")
    print("- Gmail 일일 발송 한도는 500개입니다")
    print("- 실제 이메일 수신을 확인하려면 vridgeofficial@gmail.com 받은편지함을 확인하세요")

if __name__ == "__main__":
    main()