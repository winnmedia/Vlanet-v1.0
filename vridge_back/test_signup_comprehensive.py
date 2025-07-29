import requests
import json
import time
import random
import string
from datetime import datetime

BASE_URL = "http://localhost:8000"

def generate_random_email():
    """랜덤 이메일 생성"""
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"test_{random_string}@example.com"

def test_signup_api():
    """회원가입 API 테스트"""
    print("\n" + "="*60)
    print("1. 회원가입 API 테스트")
    print("="*60)
    
    test_cases = [
        {
            "name": "정상적인 회원가입",
            "data": {
                "email": generate_random_email(),
                "password": "TestPassword123!",
                "nickname": "테스트사용자"
            },
            "expected_status": 201
        },
        {
            "name": "중복 이메일",
            "data": {
                "email": "test@example.com",
                "password": "TestPassword123!",
                "nickname": "중복테스트"
            },
            "expected_status": 400
        },
        {
            "name": "필수 필드 누락 (이메일)",
            "data": {
                "password": "TestPassword123!",
                "nickname": "필드누락테스트"
            },
            "expected_status": 400
        },
        {
            "name": "약한 비밀번호",
            "data": {
                "email": generate_random_email(),
                "password": "1234",
                "nickname": "약한비밀번호"
            },
            "expected_status": 400
        },
        {
            "name": "잘못된 이메일 형식",
            "data": {
                "email": "invalid-email",
                "password": "TestPassword123!",
                "nickname": "잘못된이메일"
            },
            "expected_status": 400
        }
    ]
    
    success_count = 0
    failure_count = 0
    
    for i, test_case in enumerate(test_cases):
        print(f"\n테스트 {i+1}: {test_case['name']}")
        print("-" * 40)
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/users/signup/",
                json=test_case["data"],
                headers={"Content-Type": "application/json"}
            )
            
            print(f"요청 데이터: {json.dumps(test_case['data'], ensure_ascii=False, indent=2)}")
            print(f"응답 상태 코드: {response.status_code}")
            print(f"응답 내용: {response.text[:200]}")
            
            if response.status_code == test_case["expected_status"]:
                print(f"✅ 성공: 예상된 상태 코드 {test_case['expected_status']}")
                success_count += 1
            else:
                print(f"❌ 실패: 예상 {test_case['expected_status']}, 실제 {response.status_code}")
                failure_count += 1
                
        except Exception as e:
            print(f"❌ 에러 발생: {str(e)}")
            failure_count += 1
    
    print(f"\n총 테스트: {len(test_cases)}")
    print(f"성공: {success_count}")
    print(f"실패: {failure_count}")
    print(f"성공률: {(success_count/len(test_cases)*100):.1f}%")
    
    return success_count == len(test_cases)

if __name__ == "__main__":
    test_signup_api()