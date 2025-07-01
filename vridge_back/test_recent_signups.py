#!/usr/bin/env python
"""
최근 가입한 사용자들의 로그인 테스트
"""
import os
import sys
import django
import json

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway_simple")
django.setup()

from django.contrib.auth import authenticate, get_user_model
from django.test import RequestFactory
from users.views import SignIn

User = get_user_model()

def test_recent_signups():
    """최근 가입한 사용자들의 로그인 테스트"""
    
    print("=" * 60)
    print("최근 가입한 사용자 로그인 테스트")
    print("=" * 60)
    
    # 최근 가입한 문제가 있는 사용자들
    problem_users = [
        {"username": "signup_test_user@example.com", "expected_password": "알 수 없음"},
        {"username": "test_db_check@example.com", "expected_password": "알 수 없음"},
    ]
    
    for user_info in problem_users:
        username = user_info["username"]
        
        print(f"\n[{username}] 분석:")
        
        try:
            user = User.objects.get(username=username)
            print(f"  - ID: {user.id}")
            print(f"  - Username: {user.username}")
            print(f"  - Email 필드: {user.email if user.email else '(비어있음)'}")
            print(f"  - Nickname: {user.nickname}")
            print(f"  - Login Method: {user.login_method}")
            print(f"  - Is Active: {user.is_active}")
            print(f"  - Has Usable Password: {user.has_usable_password()}")
            print(f"  - Date Joined: {user.date_joined}")
            
            # email 필드 문제 해결
            if not user.email and '@' in user.username:
                print(f"\n  ⚠️  email 필드가 비어있습니다. 수정 중...")
                user.email = user.username
                user.save()
                print(f"  ✓ email 필드를 {user.email}로 설정했습니다.")
            
            # 테스트 비밀번호로 로그인 시도
            test_passwords = ["test1234", "testpass123", "password123", "demo1234"]
            
            print(f"\n  일반적인 비밀번호로 로그인 시도:")
            login_success = False
            
            for test_password in test_passwords:
                if user.check_password(test_password):
                    print(f"    ✓ 비밀번호 '{test_password}'가 맞습니다!")
                    login_success = True
                    
                    # SignIn 뷰 테스트
                    factory = RequestFactory()
                    request_data = {"email": username, "password": test_password}
                    request = factory.post('/api/users/signin/', 
                                         data=json.dumps(request_data),
                                         content_type='application/json')
                    
                    view = SignIn()
                    response = view.post(request)
                    
                    if response.status_code == 201:
                        print(f"    ✓ 로그인 성공!")
                    else:
                        response_data = json.loads(response.content)
                        print(f"    ✗ 로그인 실패: {response_data.get('message')}")
                    
                    break
            
            if not login_success:
                print(f"    ✗ 테스트한 비밀번호가 모두 맞지 않습니다.")
                print(f"    → 새 비밀번호 'testpass123'로 재설정합니다.")
                user.set_password("testpass123")
                user.save()
                print(f"    ✓ 비밀번호가 재설정되었습니다.")
                
        except User.DoesNotExist:
            print(f"  ✗ 사용자가 존재하지 않습니다.")
    
    # 모든 이메일 로그인 사용자들의 email 필드 상태 확인
    print("\n" + "=" * 60)
    print("이메일 로그인 사용자들의 email 필드 상태:")
    print("=" * 60)
    
    email_login_users = User.objects.filter(login_method='email')
    empty_email_count = 0
    
    for user in email_login_users:
        if not user.email:
            empty_email_count += 1
            print(f"  - {user.username}: email 필드 비어있음")
    
    if empty_email_count > 0:
        print(f"\n총 {empty_email_count}명의 사용자가 email 필드가 비어있습니다.")
        print("이들은 로그인이 정상적으로 작동하지 않을 수 있습니다.")
    else:
        print("\n모든 이메일 로그인 사용자의 email 필드가 정상입니다.")

if __name__ == "__main__":
    test_recent_signups()