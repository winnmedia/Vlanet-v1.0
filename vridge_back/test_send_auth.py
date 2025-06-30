#!/usr/bin/env python
"""
이메일 인증번호 발송 API 테스트
"""
import requests
import json

def test_send_auth_number():
    """인증번호 발송 테스트"""
    print("=" * 50)
    print("이메일 인증번호 발송 테스트")
    print("=" * 50)
    
    # 테스트 데이터
    import random
    test_email = f"test{random.randint(1000, 9999)}@example.com"
    data = {
        "email": test_email
    }
    print(f"테스트 이메일: {test_email}")
    
    # 로컬 테스트
    url = "http://localhost:8000/users/send_authnumber/signup"
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={
                "Content-Type": "application/json",
            }
        )
        
        print(f"상태 코드: {response.status_code}")
        print(f"응답: {response.text}")
        
        if response.status_code == 200:
            print("✅ 인증번호 발송 성공!")
        else:
            print("❌ 인증번호 발송 실패")
            
    except Exception as e:
        print(f"❌ 요청 실패: {e}")

if __name__ == "__main__":
    test_send_auth_number()