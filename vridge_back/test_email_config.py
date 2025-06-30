#!/usr/bin/env python
"""
이메일 설정 테스트 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_prod')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.mail import send_mail
from django.conf import settings
import argparse

def test_email_config(test_email=None):
    """이메일 설정 테스트"""
    print("="*60)
    print("VideoPlanet 이메일 설정 테스트")
    print("="*60)
    
    # 현재 설정 확인
    print("\n현재 이메일 설정:")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '(설정되지 않음)'}")
    print(f"EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else '(설정되지 않음)'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    # 설정 검증
    print("\n설정 검증:")
    issues = []
    
    if not settings.EMAIL_HOST_USER:
        issues.append("❌ EMAIL_HOST_USER 또는 GOOGLE_ID가 설정되지 않음")
    else:
        print("✅ EMAIL_HOST_USER 설정됨")
        
    if not settings.EMAIL_HOST_PASSWORD:
        issues.append("❌ EMAIL_HOST_PASSWORD 또는 GOOGLE_APP_PASSWORD가 설정되지 않음")
    else:
        print("✅ EMAIL_HOST_PASSWORD 설정됨")
        
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("⚠️  콘솔 백엔드 사용 중 (실제 이메일 발송 안 함)")
    else:
        print("✅ SMTP 백엔드 사용 중")
    
    if issues:
        print("\n문제점:")
        for issue in issues:
            print(issue)
        print("\nRailway 대시보드에서 다음 환경 변수를 설정하세요:")
        print("- EMAIL_HOST_USER 또는 GOOGLE_ID")
        print("- EMAIL_HOST_PASSWORD 또는 GOOGLE_APP_PASSWORD")
        return
    
    # 테스트 이메일 발송
    if test_email:
        print(f"\n테스트 이메일 발송 중: {test_email}")
        try:
            result = send_mail(
                subject='VideoPlanet 테스트 이메일',
                message='이메일 설정이 올바르게 작동하고 있습니다!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[test_email],
                fail_silently=False,
                html_message="""
                <h2>VideoPlanet 이메일 테스트</h2>
                <p>이메일 설정이 올바르게 작동하고 있습니다!</p>
                <p>이제 회원가입 시 인증 이메일이 정상적으로 발송됩니다.</p>
                """
            )
            if result:
                print("✅ 테스트 이메일 발송 성공!")
            else:
                print("❌ 테스트 이메일 발송 실패")
        except Exception as e:
            print(f"❌ 이메일 발송 오류: {e}")
            print("\n가능한 원인:")
            print("1. Gmail 앱 비밀번호가 올바르지 않음")
            print("2. 2단계 인증이 활성화되지 않음")
            print("3. 네트워크 연결 문제")
    else:
        print("\n테스트 이메일을 발송하려면:")
        print("python test_email_config.py your-email@example.com")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='이메일 설정 테스트')
    parser.add_argument('email', nargs='?', help='테스트 이메일을 받을 주소')
    args = parser.parse_args()
    
    test_email_config(args.email)