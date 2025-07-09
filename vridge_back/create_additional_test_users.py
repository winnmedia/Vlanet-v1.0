import os
import sys
import django

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway")
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def create_test_users():
    """여러 테스트 사용자 생성"""
    test_users = [
        {
            "email": "test@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "nickname": "테스트유저"
        },
        {
            "email": "admin@example.com",
            "password": "adminpass123",
            "first_name": "Admin",
            "last_name": "User",
            "nickname": "관리자",
            "is_staff": True,
            "is_superuser": True
        },
        {
            "email": "demo@example.com",
            "password": "demopass123",
            "first_name": "Demo",
            "last_name": "User",
            "nickname": "데모유저"
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        email = user_data["email"]
        password = user_data["password"]
        
        try:
            with transaction.atomic():
                # 기존 사용자 확인
                if User.objects.filter(email=email).exists():
                    print(f"\n사용자 {email}가 이미 존재합니다.")
                    user = User.objects.get(email=email)
                    user.set_password(password)
                    user.first_name = user_data.get("first_name", "")
                    user.last_name = user_data.get("last_name", "")
                    user.nickname = user_data.get("nickname", "")
                    if user_data.get("is_staff"):
                        user.is_staff = True
                    if user_data.get("is_superuser"):
                        user.is_superuser = True
                    user.save()
                    print(f"정보가 업데이트되었습니다.")
                else:
                    # 새 사용자 생성
                    user = User.objects.create_user(
                        username=email,
                        email=email,
                        password=password,
                        first_name=user_data.get("first_name", ""),
                        last_name=user_data.get("last_name", ""),
                        is_active=True,
                        is_staff=user_data.get("is_staff", False),
                        is_superuser=user_data.get("is_superuser", False)
                    )
                    user.nickname = user_data.get("nickname", "")
                    user.save()
                    print(f"\n새 사용자 생성 완료: {email}")
                
                created_users.append({
                    "email": email,
                    "password": password,
                    "nickname": user_data.get("nickname", ""),
                    "is_admin": user_data.get("is_superuser", False)
                })
                
        except Exception as e:
            print(f"사용자 {email} 생성 중 오류 발생: {e}")
    
    return created_users

if __name__ == "__main__":
    users = create_test_users()
    
    print("\n" + "="*50)
    print("테스트 계정 정보")
    print("="*50)
    
    for user in users:
        print(f"\n이메일: {user['email']}")
        print(f"비밀번호: {user['password']}")
        print(f"닉네임: {user['nickname']}")
        if user['is_admin']:
            print("(관리자 계정)")
    
    print("\n" + "="*50)