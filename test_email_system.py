#!/usr/bin/env python
"""
이메일 시스템 테스트 스크립트
Railway 환경에서 이메일 발송이 정상적으로 작동하는지 확인
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway_email_fix')
sys.path.append('/home/winnmedia/VideoPlanet/vridge_back')
django.setup()

from django.core.mail import send_mail, EmailMessage
from django.conf import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_django_email():
    """Django 이메일 발송 테스트"""
    print("\n=== Django Email Test ===")
    try:
        result = send_mail(
            subject='VideoPlanet Test Email',
            message='This is a test email from VideoPlanet',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['vridgeofficial@gmail.com'],  # 자신에게 테스트 발송
            fail_silently=False,
        )
        print(f"✅ Django email sent successfully: {result}")
        return True
    except Exception as e:
        print(f"❌ Django email failed: {str(e)}")
        return False

def test_smtp_direct():
    """SMTP 직접 연결 테스트"""
    print("\n=== Direct SMTP Test ===")
    try:
        # SMTP 서버 연결
        print(f"Connecting to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.set_debuglevel(1)  # 디버그 출력
        
        if settings.EMAIL_USE_TLS:
            print("Starting TLS...")
            server.starttls()
        
        print(f"Logging in as {settings.EMAIL_HOST_USER}")
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        
        # 테스트 메일 작성
        msg = MIMEMultipart()
        msg['From'] = settings.DEFAULT_FROM_EMAIL
        msg['To'] = 'vridgeofficial@gmail.com'
        msg['Subject'] = 'VideoPlanet SMTP Test'
        msg.attach(MIMEText('Direct SMTP test successful', 'plain'))
        
        # 메일 발송
        server.send_message(msg)
        server.quit()
        
        print("✅ Direct SMTP test successful")
        return True
    except Exception as e:
        print(f"❌ Direct SMTP test failed: {str(e)}")
        return False

def check_email_config():
    """이메일 설정 확인"""
    print("\n=== Email Configuration Check ===")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_USE_SSL: {getattr(settings, 'EMAIL_USE_SSL', False)}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER[:3]}..." if settings.EMAIL_HOST_USER else "Not set")
    print(f"EMAIL_HOST_PASSWORD: {'Set' if settings.EMAIL_HOST_PASSWORD else 'Not set'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    # Railway 환경변수 확인
    print("\n=== Railway Environment Variables ===")
    env_vars = ['EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD', 'GOOGLE_ID', 'GOOGLE_APP_PASSWORD']
    for var in env_vars:
        value = os.environ.get(var)
        if value:
            print(f"{var}: {value[:3]}...")
        else:
            print(f"{var}: Not set")

if __name__ == "__main__":
    print("VideoPlanet Email System Test")
    print("=============================")
    
    # 1. 설정 확인
    check_email_config()
    
    # 2. Django 이메일 테스트
    django_success = test_django_email()
    
    # 3. SMTP 직접 테스트 (Django 실패 시)
    if not django_success:
        test_smtp_direct()
    
    print("\n=== Test Complete ===")