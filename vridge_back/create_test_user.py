#!/usr/bin/env python3
import os
import sys
import django

# Django 설정
sys.path.insert(0, '/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

from users.models import User
from django.contrib.auth.hashers import make_password

try:
    # 테스트 사용자 생성
    email = "ceo@winnmedia.co.kr"
    password = "Qwerasdf!234"
    
    # 기존 사용자 확인
    user = User.objects.filter(username=email).first()
    if user:
        print(f"사용자가 이미 존재합니다: {email}")
        # 비밀번호 업데이트
        user.password = make_password(password)
        user.email_verified = True
        user.save()
        print("비밀번호가 업데이트되었습니다.")
    else:
        # 새 사용자 생성
        user = User.objects.create(
            username=email,
            email=email,
            nickname="CEO",
            password=make_password(password),
            email_verified=True,
            is_active=True
        )
        print(f"새 사용자가 생성되었습니다: {email}")
    
    print(f"사용자 정보:")
    print(f"- Username: {user.username}")
    print(f"- Email: {user.email}")
    print(f"- Nickname: {user.nickname}")
    print(f"- Email Verified: {user.email_verified}")
    print(f"- Is Active: {user.is_active}")
    
except Exception as e:
    print(f"오류 발생: {e}")
    import traceback
    traceback.print_exc()