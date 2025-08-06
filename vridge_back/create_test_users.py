#!/usr/bin/env python
"""
VideoPlanet 테스트 사용자 생성 스크립트
실행: python create_test_users.py
"""

import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

User = get_user_model()

def create_test_users():
    """테스트 사용자 생성"""
    
    test_users = [
        {
            'username': 'test@test.com',
            'email': 'test@test.com',
            'nickname': 'TestUser',
            'password': 'Test1234!@',
            'is_staff': False,
            'is_superuser': False
        },
        {
            'username': 'admin@test.com',
            'email': 'admin@test.com',
            'nickname': 'AdminUser',
            'password': 'Admin1234!@',
            'is_staff': True,
            'is_superuser': True
        },
        {
            'username': 'demo@test.com',
            'email': 'demo@test.com',
            'nickname': 'DemoUser',
            'password': 'Demo1234!@',
            'is_staff': False,
            'is_superuser': False
        }
    ]
    
    created_users = []
    
    with transaction.atomic():
        for user_data in test_users:
            username = user_data['username']
            
            # 기존 사용자 확인
            if User.objects.filter(username=username).exists():
                print(f"✓ 사용자 이미 존재: {username}")
                user = User.objects.get(username=username)
                # 비밀번호 업데이트
                user.set_password(user_data['password'])
                user.save()
                created_users.append(user)
            else:
                # 새 사용자 생성
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password']
                )
                user.nickname = user_data['nickname']
                user.is_staff = user_data['is_staff']
                user.is_superuser = user_data['is_superuser']
                user.is_active = True
                
                # 이메일 인증 처리
                if hasattr(user, 'email_verified'):
                    user.email_verified = True
                    user.email_verified_at = timezone.now()
                
                # 로그인 방법 설정
                if hasattr(user, 'login_method'):
                    user.login_method = 'email'
                
                user.save()
                created_users.append(user)
                print(f"✅ 새 사용자 생성: {username}")
    
    print("\n=== 테스트 사용자 목록 ===")
    for user in created_users:
        print(f"- 이메일: {user.email}")
        print(f"  닉네임: {user.nickname}")
        print(f"  관리자: {'예' if user.is_staff else '아니오'}")
        print(f"  활성화: {'예' if user.is_active else '아니오'}")
        print()
    
    return created_users

if __name__ == '__main__':
    print("VideoPlanet 테스트 사용자 생성 시작...")
    create_test_users()
    print("완료!")