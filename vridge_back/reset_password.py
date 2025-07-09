#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User
from django.contrib.auth.hashers import make_password

# Reset password for test user
email = "test@example.com"
new_password = "test1234"

try:
    user = User.objects.get(username=email)
    user.password = make_password(new_password)
    user.save()
    print(f"Password reset successful for {email}")
    print(f"New password: {new_password}")
except User.DoesNotExist:
    print(f"User {email} not found")

# Also create a simple test user
try:
    user2 = User.objects.get(username="demo@example.com")
    user2.password = make_password("demo1234")
    user2.save()
    print(f"\nAlso reset password for demo@example.com")
    print(f"Email: demo@example.com")
    print(f"Password: demo1234")
except:
    pass