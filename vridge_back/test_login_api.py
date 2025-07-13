#!/usr/bin/env python3
"""
로그인 API 테스트 스크립트
"""
import requests
import json

def test_login_api():
    url = "https://videoplanet.up.railway.app/api/users/login/"
    
    # 테스트용 로그인 데이터
    test_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    
    try:
        print(f"🔍 Testing login API: {url}")
        print(f"📦 Request data: {test_data}")
        
        response = requests.post(url, json=test_data, headers=headers, timeout=10)
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📋 Response headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📄 Response data: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"📄 Response text: {response.text}")
            
        return response.status_code, response.text
        
    except Exception as e:
        print(f"❌ Error testing login API: {str(e)}")
        return None, str(e)

if __name__ == "__main__":
    test_login_api()