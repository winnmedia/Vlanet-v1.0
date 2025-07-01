import os
import sys
import django
import requests
import json
from datetime import datetime

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway_simple")
django.setup()

from users.models import User

# API 베이스 URL
BASE_URL = "http://localhost:8000"  # 로컬 테스트용

def test_signup_process():
    """회원가입 전체 프로세스 테스트"""
    
    # 테스트용 이메일 생성 (타임스탬프 포함)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    test_email = f"test_signup_{timestamp}@example.com"
    test_password = "testpass123"
    test_nickname = f"TestUser{timestamp}"
    
    print("=" * 60)
    print("회원가입 프로세스 테스트")
    print("=" * 60)
    
    # 1. 회원가입 테스트
    print("\n1. 회원가입 시도...")
    print(f"   이메일: {test_email}")
    print(f"   닉네임: {test_nickname}")
    
    signup_data = {
        "email": test_email,
        "password": test_password,
        "nickname": test_nickname
    }
    
    try:
        # API 호출 시뮬레이션 (실제로는 views.py의 SignUp 뷰 직접 테스트)
        from users.views import SignUp
        from django.test import RequestFactory
        from django.contrib.sessions.middleware import SessionMiddleware
        
        factory = RequestFactory()
        request = factory.post('/users/signup/', 
                             data=json.dumps(signup_data),
                             content_type='application/json')
        
        # 세션 미들웨어 추가
        middleware = SessionMiddleware(lambda x: None)
        middleware.process_request(request)
        request.session.save()
        
        # 뷰 호출
        response = SignUp.as_view()(request)
        response_data = json.loads(response.content)
        
        print(f"   응답 상태: {response.status_code}")
        print(f"   응답 데이터: {response_data}")
        
        if response.status_code in [200, 201]:
            print("   ✅ 회원가입 성공!")
        else:
            print("   ❌ 회원가입 실패!")
            return False
            
    except Exception as e:
        print(f"   ❌ 오류 발생: {e}")
        return False
    
    # 2. 데이터베이스 확인
    print("\n2. 데이터베이스에서 사용자 확인...")
    try:
        user = User.objects.get(username=test_email)
        print(f"   ✅ 사용자 발견!")
        print(f"   - username: {user.username}")
        print(f"   - email: {user.email}")
        print(f"   - nickname: {user.nickname}")
        print(f"   - is_active: {user.is_active}")
        print(f"   - login_method: {user.login_method}")
        
        # email 필드 확인
        if not user.email:
            print("   ⚠️  경고: email 필드가 비어있습니다!")
        elif user.email != test_email:
            print(f"   ⚠️  경고: email 불일치! (기대값: {test_email}, 실제값: {user.email})")
        else:
            print("   ✅ email 필드 정상!")
            
    except User.DoesNotExist:
        print(f"   ❌ 사용자를 찾을 수 없습니다: {test_email}")
        return False
    
    # 3. 로그인 테스트
    print("\n3. 로그인 테스트...")
    
    login_data = {
        "email": test_email,
        "password": test_password
    }
    
    try:
        from users.views import SignIn
        
        request = factory.post('/users/login/',
                             data=json.dumps(login_data),
                             content_type='application/json')
        
        # 세션 미들웨어 추가
        middleware.process_request(request)
        request.session.save()
        
        # 로그인 시도
        response = SignIn.as_view()(request)
        response_data = json.loads(response.content)
        
        print(f"   응답 상태: {response.status_code}")
        print(f"   응답 데이터: {response_data}")
        
        if response.status_code in [200, 201]:
            print("   ✅ 로그인 성공!")
            if 'vridge_session' in response_data:
                print("   ✅ JWT 토큰 발급 확인!")
        else:
            print("   ❌ 로그인 실패!")
            return False
            
    except Exception as e:
        print(f"   ❌ 로그인 중 오류 발생: {e}")
        return False
    
    # 4. 비밀번호 검증 테스트
    print("\n4. 비밀번호 검증 테스트...")
    if user.check_password(test_password):
        print("   ✅ 비밀번호 검증 성공!")
    else:
        print("   ❌ 비밀번호 검증 실패!")
        
    print("\n" + "=" * 60)
    print("테스트 완료!")
    print("=" * 60)
    
    return True

def cleanup_test_users():
    """테스트 사용자 정리"""
    print("\n테스트 사용자 정리 중...")
    test_users = User.objects.filter(username__startswith="test_signup_")
    count = test_users.count()
    if count > 0:
        test_users.delete()
        print(f"   {count}명의 테스트 사용자 삭제됨")
    else:
        print("   정리할 테스트 사용자 없음")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "cleanup":
        cleanup_test_users()
    else:
        success = test_signup_process()
        if success:
            print("\n모든 테스트 통과! ✅")
        else:
            print("\n테스트 실패! ❌")
        
        print("\n테스트 사용자를 정리하려면:")
        print("python test_signup_process.py cleanup")