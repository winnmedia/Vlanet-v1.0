#!/usr/bin/env python
import os
import sys
import django
import json

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway_simple")
django.setup()

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.test import RequestFactory
from users.views import SignIn

User = get_user_model()

def test_user_accounts():
    """사용자 계정들의 로그인 테스트"""
    
    # 테스트할 계정들
    test_accounts = [
        {"email": "test@example.com", "password": "testpass123"},
        {"email": "demo1@videoplanet.com", "password": "demo1234"},
        {"email": "demo2@videoplanet.com", "password": "demo1234"},
    ]
    
    print("=" * 60)
    print("사용자 계정 로그인 테스트")
    print("=" * 60)
    
    for account in test_accounts:
        email = account["email"]
        password = account["password"]
        
        print(f"\n[{email}] 테스트:")
        
        # 1. 사용자 존재 확인
        try:
            user = User.objects.get(username=email)
            print(f"  ✓ 사용자 존재 (ID: {user.id})")
            print(f"  - email 필드: {user.email}")
            print(f"  - nickname: {getattr(user, 'nickname', 'N/A')}")
            print(f"  - login_method: {getattr(user, 'login_method', 'N/A')}")
            print(f"  - is_active: {user.is_active}")
            print(f"  - has_usable_password: {user.has_usable_password()}")
            
            # 2. 비밀번호 직접 체크
            if user.check_password(password):
                print(f"  ✓ 비밀번호 체크 성공")
            else:
                print(f"  ✗ 비밀번호 체크 실패")
                # 비밀번호 재설정
                user.set_password(password)
                user.save()
                print(f"  → 비밀번호 재설정 완료")
            
            # 3. authenticate 테스트
            auth_user = authenticate(username=email, password=password)
            if auth_user:
                print(f"  ✓ authenticate() 성공")
            else:
                print(f"  ✗ authenticate() 실패")
            
            # 4. SignIn 뷰 테스트
            factory = RequestFactory()
            request_data = {"email": email, "password": password}
            request = factory.post('/api/users/signin/', 
                                 data=json.dumps(request_data),
                                 content_type='application/json')
            
            view = SignIn()
            response = view.post(request)
            
            print(f"  - SignIn 뷰 응답 상태: {response.status_code}")
            if response.status_code == 201:
                print(f"  ✓ SignIn 뷰 로그인 성공")
                response_data = json.loads(response.content)
                if 'vridge_session' in response_data:
                    print(f"  - JWT 토큰 생성됨: {response_data['vridge_session'][:20]}...")
            else:
                print(f"  ✗ SignIn 뷰 로그인 실패")
                response_data = json.loads(response.content)
                print(f"  - 에러 메시지: {response_data.get('message', 'N/A')}")
                
        except User.DoesNotExist:
            print(f"  ✗ 사용자가 존재하지 않음")
        except Exception as e:
            print(f"  ✗ 예외 발생: {str(e)}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("AUTHENTICATION_BACKENDS 설정 확인:")
    from django.conf import settings
    backends = getattr(settings, 'AUTHENTICATION_BACKENDS', ['django.contrib.auth.backends.ModelBackend'])
    for backend in backends:
        print(f"  - {backend}")

if __name__ == "__main__":
    test_user_accounts()