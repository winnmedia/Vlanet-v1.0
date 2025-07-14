#!/usr/bin/env python3
import requests
import json
from datetime import datetime

# Production URL
BASE_URL = "https://vridge-back-production.up.railway.app"

def test_api_health():
    """API 헬스 체크"""
    print("=== API 헬스 체크 ===")
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=10)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ API 서버가 정상 작동 중입니다.")
        else:
            print("❌ API 서버 응답 오류")
        print(f"응답 내용: {response.text[:200]}")
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
    print()

def test_signup():
    """회원가입 테스트"""
    print("=== 회원가입 테스트 ===")
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    test_data = {
        "email": f"prod_test_{timestamp}@example.com",
        "password": "testpass123",
        "nickname": f"ProdTest{timestamp}"
    }
    
    print(f"테스트 데이터: {test_data}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/signup/",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"상태 코드: {response.status_code}")
        print(f"응답: {response.text}")
        
        if response.status_code in [200, 201]:
            print("✅ 회원가입 성공!")
            return test_data["email"], test_data["password"]
        else:
            print("❌ 회원가입 실패!")
            return None, None
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
        return None, None
    print()

def test_login(email, password):
    """로그인 테스트"""
    print("=== 로그인 테스트 ===")
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/signin/",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"상태 코드: {response.status_code}")
        print(f"응답: {response.text}")
        
        if response.status_code in [200, 201]:
            print("✅ 로그인 성공!")
            data = response.json()
            return data.get("vridge_session")
        else:
            print("❌ 로그인 실패!")
            return None
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
        return None
    print()

def test_project_create(token):
    """프로젝트 생성 테스트"""
    print("=== 프로젝트 생성 테스트 ===")
    
    project_data = {
        "inputs": {
            "name": "Production Test Project",
            "description": "프로덕션 환경 테스트",
            "manager": "테스트 매니저",
            "consumer": "테스트 회사"
        },
        "process": [
            {
                "key": "basic_plan",
                "startDate": "2025-07-01",
                "endDate": "2025-07-10"
            }
        ]
    }
    
    # multipart/form-data로 전송
    files = {}
    data = {
        'inputs': json.dumps(project_data['inputs']),
        'process': json.dumps(project_data['process'])
    }
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/projects/create",
            data=data,
            files=files,
            headers=headers,
            timeout=10
        )
        print(f"상태 코드: {response.status_code}")
        print(f"응답: {response.text}")
        
        if response.status_code in [200, 201]:
            print("✅ 프로젝트 생성 성공!")
        else:
            print("❌ 프로젝트 생성 실패!")
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
    print()

def main():
    print("=" * 60)
    print("Production API 테스트")
    print("=" * 60)
    print()
    
    # 1. API 헬스 체크
    test_api_health()
    
    # 2. 회원가입 테스트
    email, password = test_signup()
    
    if email and password:
        # 3. 로그인 테스트
        token = test_login(email, password)
        
        if token:
            # 4. 프로젝트 생성 테스트
            test_project_create(token)
    
    print("\n테스트 완료!")

if __name__ == "__main__":
    main()