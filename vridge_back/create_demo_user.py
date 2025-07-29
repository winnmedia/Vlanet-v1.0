#!/usr/bin/env python3
"""데모 계정 생성 스크립트"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
django.setup()

from users.models import User, UserProfile
from django.utils import timezone

def create_demo_accounts():
    """데모 계정 생성"""
    
    demo_accounts = [
        {
            'username': 'demo@example.com',
            'email': 'demo@example.com',
            'nickname': 'Demo User',
            'password': 'DemoPass123!',
            'is_staff': False,
        },
        {
            'username': 'test@example.com',
            'email': 'test@example.com',
            'nickname': 'Test User',
            'password': 'TestPass123!',
            'is_staff': False,
        },
        {
            'username': 'admin@videoplanet.com',
            'email': 'admin@videoplanet.com',
            'nickname': 'Admin',
            'password': 'AdminPass123!',
            'is_staff': True,
            'is_superuser': True,
        }
    ]
    
    for account_data in demo_accounts:
        try:
            # 기존 사용자 확인
            user = User.objects.filter(username=account_data['username']).first()
            
            if user:
                print(f"User {account_data['username']} already exists, updating...")
                # 비밀번호 업데이트
                user.set_password(account_data['password'])
                user.nickname = account_data['nickname']
                user.email_verified = True
                user.email_verified_at = timezone.now()
                user.save()
            else:
                print(f"Creating user {account_data['username']}...")
                user = User.objects.create_user(
                    username=account_data['username'],
                    email=account_data['email'],
                    password=account_data['password'],
                    nickname=account_data['nickname'],
                    is_staff=account_data.get('is_staff', False),
                    is_superuser=account_data.get('is_superuser', False),
                )
                user.email_verified = True
                user.email_verified_at = timezone.now()
                user.save()
            
            # 프로필 생성
            if not hasattr(user, 'profile'):
                UserProfile.objects.create(
                    user=user,
                    bio=f"This is a demo account for {user.nickname}"
                )
            
            print(f"✓ Account ready: {user.username} / {account_data['password']}")
            
        except Exception as e:
            print(f"✗ Error creating {account_data['username']}: {e}")
    
    print("\nDemo accounts summary:")
    print("-" * 50)
    print("1. demo@example.com / DemoPass123!")
    print("2. test@example.com / TestPass123!")
    print("3. admin@videoplanet.com / AdminPass123! (admin)")

if __name__ == "__main__":
    create_demo_accounts()