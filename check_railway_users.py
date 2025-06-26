import requests
import json

# Railway 서버의 사용자 목록 확인
API_URL = "https://videoplanet.up.railway.app/api/users/create-test-users"

print("Railway 데이터베이스의 사용자 확인 중...")

# 기존 사용자를 확인하기 위해 다시 호출 (이미 존재하면 업데이트됨)
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
    
    if response.status_code == 200:
        data = response.json()
        print("\n=== 현재 사용자 상태 ===")
        for user in data.get("users", []):
            print(f"- {user['email']}: {user['status']}")
            
        # 로그인 테스트
        print("\n=== 로그인 API 테스트 ===")
        login_url = "https://videoplanet.up.railway.app/api/users/login"
        
        test_accounts = [
            {"email": "test@example.com", "password": "testpass123"},
            {"email": "admin@example.com", "password": "adminpass123"},
            {"email": "demo@example.com", "password": "demopass123"}
        ]
        
        for account in test_accounts:
            print(f"\n테스트: {account['email']}")
            try:
                login_response = requests.post(
                    login_url,
                    json=account,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    timeout=10
                )
                
                if login_response.status_code == 201:
                    print(f"  ✓ 로그인 성공")
                else:
                    print(f"  ✗ 로그인 실패: {login_response.status_code}")
                    try:
                        error_data = login_response.json()
                        print(f"    에러: {error_data.get('message', 'Unknown error')}")
                    except:
                        print(f"    응답: {login_response.text[:200]}")
                        
            except Exception as e:
                print(f"  ✗ 요청 실패: {e}")
    else:
        print(f"사용자 생성 실패: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f"요청 실패: {e}")