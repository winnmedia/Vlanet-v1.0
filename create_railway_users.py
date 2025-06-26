import requests
import json

# Railway 서버에 테스트 사용자 생성
API_URL = "https://videoplanet.up.railway.app/api/users/create-test-users"

print("Railway 데이터베이스에 테스트 사용자 생성 중...")

try:
    response = requests.post(
        API_URL,
        json={"secret_key": "create-test-users-2024"},
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        timeout=30
    )
    
    print(f"응답 상태 코드: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n=== 사용자 생성 결과 ===")
        for user in data.get("users", []):
            print(f"- {user['email']}: {user['status']}")
        
        print("\n=== 로그인 정보 ===")
        for cred in data.get("credentials", []):
            print(f"이메일: {cred['email']}")
            print(f"비밀번호: {cred['password']}")
            print()
    else:
        print(f"오류 발생: {response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"요청 실패: {e}")
    
print("\n참고: Railway 배포가 완료될 때까지 2-3분 기다려주세요.")