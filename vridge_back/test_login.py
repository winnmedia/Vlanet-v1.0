import os
import sys
import django

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway_simple")
django.setup()

from django.contrib.auth import authenticate, get_user_model
from django.db import connection

User = get_user_model()

def test_login():
    """로그인 테스트"""
    
    # 데이터베이스 연결 확인
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("데이터베이스 연결 성공")
    
    # 사용자 목록 확인
    print("\n현재 등록된 사용자:")
    users = User.objects.all()
    for user in users:
        print(f"  - {user.username} (email: {user.email}, is_active: {user.is_active})")
    
    # 테스트 사용자 확인 및 생성
    test_email = "test@example.com"
    test_password = "testpass123"
    
    try:
        user = User.objects.get(username=test_email)
        print(f"\n사용자 {test_email} 정보:")
        print(f"  - username: {user.username}")
        print(f"  - email: {user.email}")
        print(f"  - is_active: {user.is_active}")
        print(f"  - login_method: {getattr(user, 'login_method', 'N/A')}")
        
        # 비밀번호 재설정
        user.set_password(test_password)
        user.is_active = True
        user.save()
        print(f"  - 비밀번호가 재설정되었습니다.")
        
    except User.DoesNotExist:
        # 새 사용자 생성
        user = User.objects.create_user(
            username=test_email,
            email=test_email,
            password=test_password,
            is_active=True
        )
        print(f"\n새 사용자 {test_email}가 생성되었습니다.")
    
    # 로그인 테스트
    print(f"\n로그인 테스트 (username={test_email}, password={test_password}):")
    
    # 방법 1: authenticate 함수 사용
    auth_user = authenticate(username=test_email, password=test_password)
    if auth_user:
        print("  ✓ authenticate() 성공")
    else:
        print("  ✗ authenticate() 실패")
        
        # 직접 비밀번호 체크
        user = User.objects.get(username=test_email)
        if user.check_password(test_password):
            print("  ✓ check_password() 성공")
        else:
            print("  ✗ check_password() 실패")

if __name__ == "__main__":
    test_login()