#!/usr/bin/env python
import os
import sys
import django

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway")
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, identify_hasher

User = get_user_model()

def check_user_issues():
    """사용자 계정 문제 점검"""
    
    print("=" * 80)
    print("모든 사용자 계정 상태 점검")
    print("=" * 80)
    
    users = User.objects.all().order_by('-date_joined')[:20]
    
    problematic_users = []
    
    for user in users:
        print(f"\n[{user.username}]")
        print(f"  - ID: {user.id}")
        print(f"  - Email 필드: {user.email if user.email else '(비어있음)'}")
        print(f"  - Nickname: {getattr(user, 'nickname', 'N/A')}")
        print(f"  - Login Method: {getattr(user, 'login_method', 'N/A')}")
        print(f"  - Is Active: {user.is_active}")
        print(f"  - Has Usable Password: {user.has_usable_password()}")
        print(f"  - Date Joined: {user.date_joined}")
        
        # 비밀번호 해시 확인
        if user.password:
            try:
                hasher = identify_hasher(user.password)
                print(f"  - Password Hasher: {hasher.__class__.__name__}")
            except:
                print(f"  - Password Hasher: 알 수 없음 (비정상)")
                problematic_users.append(user.username)
        else:
            print(f"  - Password: (없음)")
            problematic_users.append(user.username)
        
        # email 필드 문제 확인
        if user.username and '@' in user.username and not user.email:
            print(f"  ⚠️  주의: username은 이메일 형식이지만 email 필드가 비어있음")
            problematic_users.append(user.username)
    
    print("\n" + "=" * 80)
    print("문제가 있을 수 있는 계정들:")
    print("=" * 80)
    
    if problematic_users:
        for username in set(problematic_users):
            print(f"  - {username}")
            
        print("\n권장 조치:")
        print("1. email 필드가 비어있는 경우: username과 동일하게 설정")
        print("2. 비밀번호가 없거나 비정상인 경우: 비밀번호 재설정")
        print("3. login_method가 설정되지 않은 경우: 'email'로 설정")
    else:
        print("  문제가 있는 계정이 없습니다.")
    
    # 최근 생성된 사용자들의 생성 스크립트 확인
    print("\n" + "=" * 80)
    print("사용자 생성 스크립트별 계정 확인:")
    print("=" * 80)
    
    # 스크립트별 생성 패턴 확인
    patterns = {
        "create_test_user.py": ["test@example.com"],
        "create_demo_accounts.py": ["demo1@videoplanet.com", "demo2@videoplanet.com", "demo3@videoplanet.com", "demo4@videoplanet.com", "demo5@videoplanet.com"],
        "create_test_login.py": ["test@example.com"],
        "관리 명령어": ["admin@example.com", "demo@example.com"]
    }
    
    for script, emails in patterns.items():
        print(f"\n[{script}]")
        for email in emails:
            try:
                user = User.objects.get(username=email)
                print(f"  ✓ {email} - email 필드: {user.email if user.email else '(비어있음)'}")
            except User.DoesNotExist:
                print(f"  ✗ {email} - 존재하지 않음")

if __name__ == "__main__":
    check_user_issues()