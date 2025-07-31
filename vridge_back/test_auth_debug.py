#!/usr/bin/env python3
"""
인증 시스템 디버깅 테스트
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("🔐 인증 시스템 디버깅")
print("=" * 50)

# 로그인 테스트
print("\n1️⃣ 로그인 상세 테스트")
login_data = {
    "email": "test@example.com",
    "password": "Test123!"
}

try:
    response = requests.post(f"{BASE_URL}/api/users/login/", json=login_data)
    print(f"상태 코드: {response.status_code}")
    print(f"응답 헤더: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("✅ 로그인 성공")
        
        # 응답 내용 출력
        print("\n응답 내용:")
        response_text = response.text
        print(response_text)
        
        try:
            data = response.json()
            print("\n파싱된 JSON:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # 토큰 확인
            access_token = data.get('access') or data.get('access_token')
            refresh_token = data.get('refresh') or data.get('refresh_token')
            
            if access_token:
                print(f"\n🔑 Access Token: {access_token[:50]}...")
                
                # 토큰으로 인증된 요청 테스트
                print("\n2️⃣ 인증된 요청 테스트 (사용자 정보)")
                headers = {"Authorization": f"Bearer {access_token}"}
                
                me_response = requests.get(f"{BASE_URL}/api/users/me/", headers=headers)
                print(f"상태 코드: {me_response.status_code}")
                
                if me_response.status_code == 200:
                    print("✅ 사용자 정보 조회 성공")
                    print(json.dumps(me_response.json(), indent=2, ensure_ascii=False))
                else:
                    print("❌ 사용자 정보 조회 실패")
                    print(me_response.text[:500])
                    
            else:
                print("\n⚠️ 토큰을 찾을 수 없습니다")
                print("가능한 키:", list(data.keys()))
                
        except json.JSONDecodeError as e:
            print(f"\n❌ JSON 파싱 오류: {e}")
            
    else:
        print("❌ 로그인 실패")
        print("응답:", response.text[:500])
        
except Exception as e:
    print(f"❌ 오류: {e}")

print("\n" + "=" * 50)