#!/usr/bin/env python
import os
import sys
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# Get a test user
user = User.objects.filter(username="wltn5055@naver.com").first()
if not user:
    user = User.objects.first()
    
print(f"Using user: {user.username}")

# Generate token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
print(f"Generated token: {access_token[:20]}...")

# Test API
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# Test project 8
response = requests.get('http://localhost:8000/feedbacks/8', headers=headers)
print(f"\nAPI Response Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Full Response: {data}")
    print(f"Project Name: {data.get('name')}")
    print(f"File URL: {data.get('file')}")
else:
    print(f"Error: {response.text[:500]}")