#!/usr/bin/env python3
import requests
import json

# 테스트 데이터
login_data = {
    "email": "ceo@winnmedia.co.kr",
    "password": "Qwerasdf!234"
}

# 개선된 로그인 API 테스트
print("=" * 50)
print("개선된 로그인 API 테스트")
print("=" * 50)

# 1. 개선된 로그인 엔드포인트
url = "http://localhost:8000/api/auth/login/"
print(f"\n1. 로그인 시도: {url}")
print(f"   데이터: {login_data}")

try:
    response = requests.post(url, json=login_data)
    print(f"   상태 코드: {response.status_code}")
    print(f"   응답: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get('access_token')
        
        if access_token:
            print("\n✅ 로그인 성공!")
            print(f"   Access Token: {access_token[:50]}...")
            
            # 토큰 검증 테스트
            print("\n2. 토큰 검증 테스트")
            verify_url = "http://localhost:8000/api/auth/verify/"
            verify_response = requests.post(verify_url, json={"token": access_token})
            print(f"   상태 코드: {verify_response.status_code}")
            print(f"   응답: {json.dumps(verify_response.json(), indent=2, ensure_ascii=False)}")
            
            # 인증된 요청 테스트
            print("\n3. 인증된 요청 테스트 (/api/projects/)")
            headers = {"Authorization": f"Bearer {access_token}"}
            projects_response = requests.get("http://localhost:8000/api/projects/", headers=headers)
            print(f"   상태 코드: {projects_response.status_code}")
            if projects_response.status_code == 200:
                print("   ✅ 인증 성공 - 프로젝트 목록 접근 가능")
            else:
                print(f"   ❌ 인증 실패: {projects_response.text}")
                
except Exception as e:
    print(f"❌ 오류 발생: {e}")

# 기존 로그인 엔드포인트도 테스트
print("\n" + "=" * 50)
print("기존 로그인 API와 비교")
print("=" * 50)

old_url = "http://localhost:8000/users/login/"
print(f"\n기존 엔드포인트: {old_url}")
try:
    old_response = requests.post(old_url, json=login_data)
    print(f"상태 코드: {old_response.status_code}")
    if old_response.status_code == 200:
        print("응답 키:", list(old_response.json().keys()))
except Exception as e:
    print(f"오류: {e}")