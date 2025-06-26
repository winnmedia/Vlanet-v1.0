import os
import sys
import django

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway_simple")
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def create_test_user():
    """테스트 사용자 생성"""
    test_email = "test@example.com"
    test_password = "testpass123"
    
    try:
        with transaction.atomic():
            # 기존 사용자 확인
            if User.objects.filter(email=test_email).exists():
                print(f"사용자 {test_email}가 이미 존재합니다.")
                user = User.objects.get(email=test_email)
                user.set_password(test_password)
                user.save()
                print(f"비밀번호가 {test_password}로 재설정되었습니다.")
            else:
                # 새 사용자 생성
                user = User.objects.create_user(
                    username=test_email,  # username 필드 추가
                    email=test_email,
                    password=test_password,
                    first_name="Test",
                    last_name="User",
                    is_active=True
                )
                print(f"테스트 사용자 생성 완료:")
                print(f"  이메일: {test_email}")
                print(f"  비밀번호: {test_password}")
            
            return user
            
    except Exception as e:
        print(f"사용자 생성 중 오류 발생: {e}")
        return None

if __name__ == "__main__":
    user = create_test_user()
    if user:
        print("\n로그인 테스트를 위한 계정 정보:")
        print("이메일: test@example.com")
        print("비밀번호: testpass123")