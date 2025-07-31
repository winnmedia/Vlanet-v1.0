#!/usr/bin/env python3
"""
인증 시스템 완전 테스트 스크립트
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    """완전한 인증 플로우 테스트"""
    print("🔐 인증 시스템 완전 테스트")
    print("=" * 50)
    
    # 1. 회원가입
    print("\n1️⃣ 회원가입 테스트")
    signup_data = {
        "email": f"test_{datetime.now().timestamp()}@example.com",
        "password": "Test123!",
        "name": "테스트 사용자"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/users/signup/", json=signup_data)
        print(f"상태 코드: {response.status_code}")
        if response.status_code in [200, 201]:
            print("✅ 회원가입 성공")
            print("응답:", response.json())
        else:
            print("❌ 회원가입 실패")
            print("응답:", response.text[:500])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 2. 로그인
    print("\n2️⃣ 로그인 테스트")
    login_data = {
        "email": "test@example.com",
        "password": "Test123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/users/login/", json=login_data)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 로그인 성공")
            data = response.json()
            print(f"토큰: {data.get('access', '')[:50]}...")
            return data.get('access')
        else:
            print("❌ 로그인 실패")
            print("응답:", response.text[:500])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    return None

def test_authenticated_endpoints(token):
    """인증이 필요한 엔드포인트 테스트"""
    if not token:
        print("\n⚠️ 토큰이 없어 인증 테스트를 건너뜁니다")
        return
    
    print("\n3️⃣ 인증된 API 테스트")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 사용자 정보
    print("\n- 사용자 정보 조회")
    try:
        response = requests.get(f"{BASE_URL}/api/users/me/", headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공")
            print("사용자 정보:", response.json())
        else:
            print("❌ 실패")
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 프로젝트 목록
    print("\n- 프로젝트 목록 조회")
    try:
        response = requests.get(f"{BASE_URL}/api/projects/", headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공")
            print(f"프로젝트 수: {len(response.json())}")
        else:
            print("❌ 실패")
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 프로젝트 생성
    print("\n- 프로젝트 생성")
    project_data = {
        "name": f"테스트 프로젝트 {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "description": "인증 테스트용 프로젝트"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/projects/", json=project_data, headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code in [200, 201]:
            print("✅ 성공")
            print("프로젝트 생성:", response.json())
        else:
            print("❌ 실패")
            print("응답:", response.text[:500])
    except Exception as e:
        print(f"❌ 오류: {e}")

def main():
    """메인 실행"""
    # 인증 플로우 테스트
    token = test_auth_flow()
    
    # 인증된 엔드포인트 테스트
    test_authenticated_endpoints(token)
    
    print("\n" + "=" * 50)
    print("테스트 완료")

if __name__ == "__main__":
    main()