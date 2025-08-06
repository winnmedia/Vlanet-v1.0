#!/usr/bin/env python3
import os
import sys
import django

# Django 설정
sys.path.insert(0, '/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

# 사용자 생성 또는 업데이트
email = "ceo@winnmedia.co.kr"
password = "Qwerasdf!234"

try:
    user = User.objects.get(username=email)
    print(f"사용자 이미 존재: {user.username}")
    user.set_password(password)
    user.is_active = True
    user.save()
    print("비밀번호 업데이트 완료")
except User.DoesNotExist:
    user = User.objects.create(
        username=email,
        email=email,
        nickname="CEO",
        is_active=True
    )
    user.set_password(password)
    user.save()
    print(f"새 사용자 생성 완료: {user.username}")

# 사용자 확인
print(f"\n사용자 정보:")
print(f"ID: {user.id}")
print(f"Username: {user.username}")
print(f"Email: {user.email}")
print(f"Active: {user.is_active}")
print(f"Password check: {user.check_password(password)}")

# 전체 사용자 목록
print("\n전체 사용자 목록:")
for u in User.objects.all():
    print(f"- {u.username} (ID: {u.id}, Active: {u.is_active})")