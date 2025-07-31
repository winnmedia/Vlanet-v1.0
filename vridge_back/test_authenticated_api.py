#!/usr/bin/env python3
"""
인증된 API 전체 테스트
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """로그인하여 토큰 획득"""
    login_data = {
        "email": "test@example.com", 
        "password": "Test123!"
    }
    response = requests.post(f"{BASE_URL}/api/users/login/", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data.get('vridge_session')  # access token
    return None

def test_authenticated_endpoints():
    """인증된 API 엔드포인트 테스트"""
    print("🔐 인증된 API 엔드포인트 전체 테스트")
    print("=" * 50)
    
    # 토큰 획득
    token = get_auth_token()
    if not token:
        print("❌ 로그인 실패 - 토큰을 획득할 수 없습니다")
        return
    
    print(f"✅ 토큰 획득 성공")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. 사용자 정보 조회
    print("\n1️⃣ 사용자 정보 조회 (/api/users/me/)")
    try:
        response = requests.get(f"{BASE_URL}/api/users/me/", headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print("❌ 실패")
            print(response.text[:300])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 2. 프로젝트 목록
    print("\n2️⃣ 프로젝트 목록 조회 (/api/projects/)")
    try:
        response = requests.get(f"{BASE_URL}/api/projects/", headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공")
            projects = response.json()
            print(f"프로젝트 수: {len(projects)}")
            if projects:
                print("프로젝트 목록:")
                for p in projects[:3]:  # 최대 3개만 표시
                    print(f"  - {p.get('name', 'N/A')} (ID: {p.get('id', 'N/A')})")
        else:
            print("❌ 실패")
            print(response.text[:300])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 3. 프로젝트 생성
    print("\n3️⃣ 프로젝트 생성 (/api/projects/)")
    project_data = {
        "name": "테스트 프로젝트",
        "description": "API 테스트용 프로젝트",
        "genre": "광고",
        "project_type": "video"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/projects/", json=project_data, headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code in [200, 201]:
            print("✅ 성공")
            created = response.json()
            print(f"생성된 프로젝트: {created.get('name')} (ID: {created.get('id')})")
            return created.get('id')
        else:
            print("❌ 실패")
            print(response.text[:300])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 4. 피드백 목록
    print("\n4️⃣ 피드백 목록 조회 (/api/feedbacks/)")
    try:
        response = requests.get(f"{BASE_URL}/api/feedbacks/", headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공")
            feedbacks = response.json()
            print(f"피드백 수: {len(feedbacks)}")
        else:
            print("❌ 실패")
            print(response.text[:300])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 5. 알림 목록
    print("\n5️⃣ 알림 목록 조회 (/api/users/notifications/)")
    try:
        response = requests.get(f"{BASE_URL}/api/users/notifications/", headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공")
            notifications = response.json()
            print(f"알림 수: {len(notifications)}")
        else:
            print("❌ 실패")
            print(response.text[:300])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    # 6. 마이페이지 정보
    print("\n6️⃣ 마이페이지 정보 조회 (/api/users/mypage/)")
    try:
        response = requests.get(f"{BASE_URL}/api/users/mypage/", headers=headers)
        print(f"상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공")
            mypage = response.json()
            print(f"사용자 이름: {mypage.get('user', {}).get('username', 'N/A')}")
        else:
            print("❌ 실패")
            print(response.text[:300])
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    print("\n" + "=" * 50)
    print("테스트 완료")

if __name__ == "__main__":
    test_authenticated_endpoints()