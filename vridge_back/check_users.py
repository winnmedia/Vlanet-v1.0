#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User

print("=== 모든 사용자 목록 ===")
users = User.objects.all()
for user in users:
    print(f"ID: {user.id}, Email: {user.username}, Nickname: {user.nickname}, Login Method: {user.login_method}")

print(f"\n총 사용자 수: {users.count()}")

# test@example.com 사용자 확인
test_user = User.objects.filter(username="test@example.com").first()
if test_user:
    print(f"\ntest@example.com 사용자 정보:")
    print(f"- ID: {test_user.id}")
    print(f"- Email: {test_user.email}")
    print(f"- Username: {test_user.username}")
    print(f"- Nickname: {test_user.nickname}")
    print(f"- Has password: {bool(test_user.password)}")
else:
    print("\ntest@example.com 사용자가 없습니다!")