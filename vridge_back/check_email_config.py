#!/usr/bin/env python3
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.conf import settings
from django.core.mail import send_mail

print('=== Email Configuration Check ===')
print(f'EMAIL_BACKEND: {settings.EMAIL_BACKEND}')
print(f'EMAIL_HOST: {settings.EMAIL_HOST}')
print(f'EMAIL_PORT: {settings.EMAIL_PORT}')
print(f'EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}')
print(f'EMAIL_HOST_USER: {settings.EMAIL_HOST_USER[:5]}...' if settings.EMAIL_HOST_USER else 'EMAIL_HOST_USER: Not set')
print(f'EMAIL_HOST_PASSWORD: {"*" * 10}' if settings.EMAIL_HOST_PASSWORD else 'EMAIL_HOST_PASSWORD: Not set')
print(f'DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')

print('\n=== Environment Variables ===')
print(f'EMAIL_HOST_USER env: {os.environ.get("EMAIL_HOST_USER", "Not set")}')
print(f'EMAIL_HOST_PASSWORD env: {"Set" if os.environ.get("EMAIL_HOST_PASSWORD") else "Not set"}')
print(f'GOOGLE_ID env: {os.environ.get("GOOGLE_ID", "Not set")}')
print(f'GOOGLE_APP_PASSWORD env: {"Set" if os.environ.get("GOOGLE_APP_PASSWORD") else "Not set"}')
print(f'SENDGRID_API_KEY env: {"Set" if os.environ.get("SENDGRID_API_KEY") else "Not set"}')

# Test email send
print('\n=== Testing Email Send ===')
try:
    result = send_mail(
        'Test Email from VideoPlanet',
        'This is a test email to verify email configuration.',
        settings.DEFAULT_FROM_EMAIL,
        ['test@example.com'],
        fail_silently=False
    )
    print(f'Email test result: Success - {result} email(s) sent')
except Exception as e:
    print(f'Email test result: Failed - {type(e).__name__}: {str(e)}')
    
print('\n=== Railway Specific Settings ===')
print(f'RAILWAY_ENVIRONMENT: {os.environ.get("RAILWAY_ENVIRONMENT", "Not set")}')
print(f'Current settings module: {os.environ.get("DJANGO_SETTINGS_MODULE", "Not set")}')

# Railway 환경인지 확인
if os.environ.get("RAILWAY_ENVIRONMENT"):
    print('\n=== Railway Email Configuration ===')
    print('Running in Railway environment')
    print(f'Should use railway settings: config.settings.railway')
else:
    print('\n=== Local Email Configuration ===')
    print('Running in local environment')