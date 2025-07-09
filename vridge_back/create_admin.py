#!/usr/bin/env python
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from users.models import User

def create_admin():
    username = 'admin@vlanet.net'
    email = 'admin@vlanet.net'
    password = 'vlanet2024!@#'
    nickname = 'Vlanet Admin'
    
    if User.objects.filter(username=username).exists():
        print(f'User {username} already exists')
        return
        
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        nickname=nickname
    )
    
    print(f'''
Admin user created successfully!

========================================
Django Admin Access Information
========================================
URL: /admin/
Username: {username}
Email: {email}
Password: {password}
========================================

Please change the password after first login!
    ''')

if __name__ == '__main__':
    create_admin()