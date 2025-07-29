import requests
import json

# 로그인 테스트
url = "http://localhost:8000/api/users/login/"
data = {
    "email": "test@example.com",
    "password": "Test123!"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(response, 'text'):
        print(f"Raw response: {response.text}")