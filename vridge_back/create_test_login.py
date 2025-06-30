#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User
from django.contrib.auth.hashers import make_password

# Create test user
email = "test@example.com"
password = "test1234"

try:
    user = User.objects.get(username=email)
    print(f"User already exists: {email}")
except User.DoesNotExist:
    user = User.objects.create(
        username=email,
        email=email,
        nickname="테스트유저",
        password=make_password(password),
        login_method="email"
    )
    print(f"Created user: {email}")

print(f"\n로그인 정보:")
print(f"이메일: {email}")
print(f"비밀번호: {password}")
print(f"\n브라우저에서 http://localhost:3000/login 으로 접속하여 로그인하세요.")