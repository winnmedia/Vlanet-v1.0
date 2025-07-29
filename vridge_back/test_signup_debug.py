#!/usr/bin/env python3
"""회원가입 디버깅 테스트"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
django.setup()

from users.models import User, EmailVerificationToken
from users.email_verification_service import EmailVerificationService
from django.db import connection
import logging

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_database_connection():
    """데이터베이스 연결 테스트"""
    print("\n=== Database Connection Test ===")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print(f"✓ Database connection successful: {result}")
            
            # 테이블 존재 확인
            if connection.vendor == 'sqlite':
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name LIKE '%user%'
                """)
            else:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name LIKE '%user%'
                """)
            tables = cursor.fetchall()
            print(f"✓ User-related tables: {[t[0] for t in tables]}")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False
    return True

def test_email_service():
    """이메일 서비스 테스트"""
    print("\n=== Email Service Test ===")
    try:
        # 테스트 사용자 생성
        test_user = User.objects.create(
            username="test_email_service@example.com",
            email="test_email_service@example.com",
            nickname="TestEmailService"
        )
        
        # 이메일 발송 테스트
        token = EmailVerificationService.send_verification_email(test_user)
        if token:
            print(f"✓ Email service working: Token {token.token}")
        else:
            print("✗ Email service failed to create token")
            
        # 정리
        test_user.delete()
        
    except Exception as e:
        print(f"✗ Email service error: {e}")
        import traceback
        traceback.print_exc()
        return False
    return True

def test_signup_flow():
    """전체 회원가입 플로우 테스트"""
    print("\n=== Signup Flow Test ===")
    try:
        from django.test import Client
        import json
        
        client = Client()
        
        # 회원가입 요청
        response = client.post(
            '/api/users/signup/',
            data=json.dumps({
                "email": "debug_test@example.com",
                "nickname": "DebugTest",
                "password": "DebugPass123!"
            }),
            content_type='application/json'
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✓ Signup successful")
            # 생성된 사용자 삭제
            User.objects.filter(username="debug_test@example.com").delete()
        else:
            print("✗ Signup failed")
            
    except Exception as e:
        print(f"✗ Signup flow error: {e}")
        import traceback
        traceback.print_exc()
        return False
    return True

def check_email_settings():
    """이메일 설정 확인"""
    print("\n=== Email Settings Check ===")
    from django.conf import settings
    
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
    print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
    print(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
    print(f"SENDGRID_API_KEY exists: {bool(os.environ.get('SENDGRID_API_KEY'))}")
    print(f"FRONTEND_URL: {getattr(settings, 'FRONTEND_URL', 'Not set')}")

if __name__ == "__main__":
    print("Starting signup debugging...")
    
    # 데이터베이스 연결 확인
    if not test_database_connection():
        sys.exit(1)
    
    # 이메일 설정 확인
    check_email_settings()
    
    # 이메일 서비스 테스트
    test_email_service()
    
    # 회원가입 플로우 테스트
    test_signup_flow()
    
    print("\nDebugging complete.")