#!/usr/bin/env python
"""
이메일 인증 시스템 테스트 스크립트
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.conf import settings
from users.models import User, EmailVerify

def check_settings():
    """설정 확인"""
    print("="*60)
    print("📋 현재 설정 확인")
    print("="*60)
    
    print(f"\n1. Django 설정:")
    print(f"   - DEBUG: {settings.DEBUG}")
    print(f"   - SECRET_KEY 설정됨: {bool(settings.SECRET_KEY)}")
    print(f"   - ALGORITHM: {getattr(settings, 'ALGORITHM', 'NOT SET')}")
    
    print(f"\n2. 이메일 설정:")
    print(f"   - EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   - EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"   - EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"   - EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or 'NOT SET'}")
    print(f"   - EMAIL_HOST_PASSWORD: {'SET' if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    print(f"   - DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    print(f"\n3. CORS 설정:")
    print(f"   - CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', [])}")
    print(f"   - CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)}")
    print(f"   - CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', False)}")
    
    print(f"\n4. Google OAuth 설정:")
    print(f"   - GOOGLE_CLIENT_ID: {getattr(settings, 'GOOGLE_CLIENT_ID', 'NOT SET')}")
    print(f"   - GOOGLE_CLIENT_SECRET: {'SET' if getattr(settings, 'GOOGLE_CLIENT_SECRET', None) else 'NOT SET'}")

def test_email_auth():
    """이메일 인증 테스트"""
    print("\n" + "="*60)
    print("📧 이메일 인증 테스트")
    print("="*60)
    
    test_email = f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    
    # 1. 인증번호 발송 테스트
    print(f"\n1. 인증번호 발송 테스트")
    print(f"   테스트 이메일: {test_email}")
    
    url = "http://localhost:8000/users/send_authnumber/signup"
    data = {"email": test_email}
    
    try:
        response = requests.post(url, json=data)
        print(f"   상태 코드: {response.status_code}")
        print(f"   응답: {response.text}")
        
        if response.status_code == 200:
            print("   ✅ 인증번호 발송 성공")
            
            # EmailVerify 확인
            email_verify = EmailVerify.objects.filter(email=test_email).first()
            if email_verify:
                print(f"   인증번호: {email_verify.auth_number}")
                return email_verify.auth_number
            else:
                print("   ❌ EmailVerify 레코드를 찾을 수 없음")
        else:
            print("   ❌ 인증번호 발송 실패")
            
    except Exception as e:
        print(f"   ❌ 요청 실패: {e}")
    
    return None

def test_google_login():
    """구글 로그인 테스트"""
    print("\n" + "="*60)
    print("🔐 구글 로그인 설정 확인")
    print("="*60)
    
    # 프론트엔드 설정 확인
    frontend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                     'vridge_front', '.env.local')
    
    if os.path.exists(frontend_env_path):
        print(f"\n✅ 프론트엔드 .env.local 파일 존재")
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if 'GOOGLE_CLIENT_ID' in line:
                    print(f"   {line.strip()}")
    else:
        print(f"\n❌ 프론트엔드 .env.local 파일 없음")
    
    # 백엔드 설정 확인
    if hasattr(settings, 'GOOGLE_CLIENT_ID'):
        print(f"\n백엔드 Google Client ID: {settings.GOOGLE_CLIENT_ID}")
    else:
        print(f"\n❌ 백엔드에 GOOGLE_CLIENT_ID 설정 없음")

def check_database():
    """데이터베이스 연결 확인"""
    print("\n" + "="*60)
    print("🗄️ 데이터베이스 확인")
    print("="*60)
    
    try:
        user_count = User.objects.count()
        print(f"✅ 데이터베이스 연결 성공")
        print(f"   총 사용자 수: {user_count}")
        
        # 최근 생성된 사용자
        recent_users = User.objects.order_by('-created')[:5]
        if recent_users:
            print("\n최근 생성된 사용자:")
            for user in recent_users:
                print(f"   - {user.username} (생성일: {user.created})")
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")

if __name__ == "__main__":
    print("\n🔍 VideoPlanet 인증 시스템 진단")
    print("="*60)
    
    check_settings()
    check_database()
    test_google_login()
    test_email_auth()
    
    print("\n\n💡 권장사항:")
    print("1. .env 파일에 이메일 설정 추가 (EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)")
    print("2. Google OAuth 클라이언트 ID 설정")
    print("3. 프론트엔드 재시작 (npm start)")
    print("4. 백엔드 재시작 (python manage.py runserver)")