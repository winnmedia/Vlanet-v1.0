#!/usr/bin/env python3
"""
최소 기능 테스트 - 캐시 클리어 후 재테스트
"""

import requests
import json
import random
import string
import time

BASE_URL = "http://localhost:8000"

def generate_random_email():
    """랜덤 이메일 생성"""
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"test_{random_string}@example.com"

def test_basic_functionality():
    """기본 기능 테스트"""
    
    print("\n=== 기본 기능 테스트 시작 ===\n")
    
    # 1. 회원가입 테스트
    print("1. 회원가입 테스트")
    signup_data = {
        "email": generate_random_email(),
        "password": "TestPassword123!",
        "nickname": f"test_user_{random.randint(1000, 9999)}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/users/signup/",
            json=signup_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   상태 코드: {response.status_code}")
        print(f"   응답: {response.text[:200]}")
        
        if response.status_code == 201:
            print("   ✅ 회원가입 성공!")
            
            # 2. 로그인 테스트
            print("\n2. 로그인 테스트")
            login_data = {
                "email": signup_data["email"],
                "password": signup_data["password"]
            }
            
            # 먼저 login 엔드포인트 시도
            login_response = requests.post(
                f"{BASE_URL}/api/users/login/",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   /api/users/login/ 상태 코드: {login_response.status_code}")
            
            if login_response.status_code == 404:
                # signin 엔드포인트 시도
                login_response = requests.post(
                    f"{BASE_URL}/api/users/signin/",
                    json=login_data,
                    headers={"Content-Type": "application/json"}
                )
                print(f"   /api/users/signin/ 상태 코드: {login_response.status_code}")
            
            if login_response.status_code == 200:
                print("   ✅ 로그인 성공!")
                auth_data = login_response.json()
                access_token = auth_data.get("access")
                
                if access_token:
                    # 3. 인증된 요청 테스트
                    print("\n3. 인증된 사용자 정보 조회")
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                    
                    me_response = requests.get(
                        f"{BASE_URL}/api/users/me/",
                        headers=headers
                    )
                    
                    print(f"   상태 코드: {me_response.status_code}")
                    if me_response.status_code == 200:
                        print("   ✅ 사용자 정보 조회 성공!")
                        user_info = me_response.json()
                        print(f"   사용자 이메일: {user_info.get('email')}")
                    else:
                        print(f"   ❌ 사용자 정보 조회 실패: {me_response.text[:100]}")
            else:
                print(f"   ❌ 로그인 실패: {login_response.text[:200]}")
        else:
            print(f"   ❌ 회원가입 실패")
            
    except Exception as e:
        print(f"   ❌ 오류 발생: {str(e)}")
    
    print("\n=== 테스트 완료 ===\n")

if __name__ == "__main__":
    # 헬스체크
    try:
        health = requests.get(f"{BASE_URL}/api/health/")
        if health.status_code == 200:
            print("✅ 서버 상태: 정상")
        else:
            print("❌ 서버 상태: 비정상")
    except:
        print("❌ 서버에 연결할 수 없습니다.")
        exit(1)
    
    # 기본 테스트 실행
    test_basic_functionality()