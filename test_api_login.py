import requests
import json

# Railway 서버 URL
API_URL = "https://videoplanet.up.railway.app/api/users/login"

# 테스트 계정
test_credentials = {
    "email": "test@example.com",
    "password": "testpass123"
}

print(f"로그인 API 테스트: {API_URL}")
print(f"테스트 계정: {test_credentials['email']}")

try:
    # POST 요청
    response = requests.post(
        API_URL,
        json=test_credentials,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        timeout=10
    )
    
    print(f"\n응답 상태 코드: {response.status_code}")
    print(f"응답 헤더: {dict(response.headers)}")
    
    # 응답 본문
    try:
        response_data = response.json()
        print(f"\n응답 데이터: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
    except:
        print(f"\n응답 텍스트: {response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"\n요청 실패: {e}")