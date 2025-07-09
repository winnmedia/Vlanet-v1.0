#!/usr/bin/env python
"""
이메일 발송 테스트 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from users.utils import auth_send_email
import random

def test_basic_email():
    """기본 이메일 발송 테스트"""
    print("=" * 50)
    print("기본 이메일 발송 테스트")
    print("=" * 50)
    
    try:
        send_mail(
            'VideoPlanet 테스트 메일',
            '이메일 설정이 정상적으로 작동합니다.',
            settings.DEFAULT_FROM_EMAIL or 'noreply@vlanet.net',
            ['test@example.com'],
            fail_silently=False,
        )
        print("✅ 이메일 발송 성공!")
        print(f"발신자: {settings.DEFAULT_FROM_EMAIL or 'noreply@vlanet.net'}")
        print("수신자: test@example.com")
    except Exception as e:
        print(f"❌ 이메일 발송 실패: {e}")

def test_auth_email():
    """인증번호 이메일 발송 테스트"""
    print("\n" + "=" * 50)
    print("인증번호 이메일 발송 테스트")
    print("=" * 50)
    
    try:
        # 임시 request 객체 생성
        class FakeRequest:
            pass
        
        request = FakeRequest()
        email = "test@example.com"
        auth_number = random.randint(100000, 999999)
        
        auth_send_email(request, email, auth_number)
        print("✅ 인증번호 이메일 발송 성공!")
        print(f"수신자: {email}")
        print(f"인증번호: {auth_number}")
    except Exception as e:
        print(f"❌ 인증번호 이메일 발송 실패: {e}")

def check_email_settings():
    """이메일 설정 확인"""
    print("\n" + "=" * 50)
    print("현재 이메일 설정")
    print("=" * 50)
    
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
    print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
    print(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
    print(f"EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Not set')}")
    print(f"DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')}")
    
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("\n📝 현재 콘솔 백엔드를 사용 중입니다. 이메일이 터미널에 출력됩니다.")
    elif settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
        print("\n📧 SMTP 백엔드를 사용 중입니다. 실제 이메일이 발송됩니다.")

if __name__ == "__main__":
    check_email_settings()
    test_basic_email()
    test_auth_email()
    
    print("\n" + "=" * 50)
    print("테스트 완료")
    print("=" * 50)