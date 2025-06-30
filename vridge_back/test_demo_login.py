#!/usr/bin/env python
"""
데모 계정 로그인 테스트
"""
import requests
import json

def test_demo_login():
    """데모 계정 로그인 테스트"""
    print("=" * 50)
    print("데모 계정 로그인 테스트")
    print("=" * 50)
    
    # 테스트할 계정
    test_account = {
        "email": "demo1@videoplanet.com",
        "password": "demo1234"
    }
    
    # 로컬 API 엔드포인트
    url = "http://localhost:8000/users/login"
    
    try:
        response = requests.post(
            url,
            json=test_account,
            headers={
                "Content-Type": "application/json",
            }
        )
        
        print(f"상태 코드: {response.status_code}")
        print(f"응답: {response.text}")
        
        if response.status_code in [200, 201]:
            print("✅ 로그인 성공!")
            data = response.json()
            if 'vridge_session' in data:
                print(f"세션 토큰: {data['vridge_session'][:20]}...")
        else:
            print("❌ 로그인 실패")
            
    except Exception as e:
        print(f"❌ 요청 실패: {e}")

def check_demo_accounts():
    """데모 계정 존재 여부 확인"""
    print("\n" + "=" * 50)
    print("데모 계정 확인")
    print("=" * 50)
    
    import os
    import sys
    import django
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    django.setup()
    
    from users.models import User
    
    for i in range(1, 6):
        email = f"demo{i}@videoplanet.com"
        user = User.objects.filter(username=email).first()
        if user:
            print(f"✅ {email} - 존재함 (닉네임: {user.nickname})")
        else:
            print(f"❌ {email} - 존재하지 않음")

if __name__ == "__main__":
    check_demo_accounts()
    print()
    test_demo_login()