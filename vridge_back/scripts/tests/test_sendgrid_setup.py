#!/usr/bin/env python3
"""
SendGrid 설정 확인 및 테스트
"""
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')

try:
    django.setup()
    print("✅ Django 설정 완료")
except Exception as e:
    print(f"❌ Django 설정 실패: {str(e)}")
    sys.exit(1)

from django.conf import settings
from django.core.mail import send_mail
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_sendgrid_setup():
    """SendGrid 설정 확인"""
    print("\n" + "="*50)
    print("📧 SendGrid 설정 확인")
    print("="*50)
    
    # 환경변수 확인
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    if sendgrid_api_key:
        print(f"✅ SENDGRID_API_KEY 설정됨: SG.{sendgrid_api_key[:10]}...")
    else:
        print("❌ SENDGRID_API_KEY 환경변수가 설정되지 않았습니다.")
        print("\n설정 방법:")
        print("1. SendGrid 계정 생성: https://sendgrid.com")
        print("2. API 키 생성: Settings → API Keys → Create API Key")
        print("3. Railway에 환경변수 추가: SENDGRID_API_KEY=SG.xxxxx")
        return False
    
    # Django 이메일 설정 확인
    print(f"\n현재 이메일 설정:")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    # SendGrid 설정 확인
    if settings.EMAIL_HOST == 'smtp.sendgrid.net':
        print("\n✅ SendGrid SMTP 설정이 활성화되어 있습니다.")
        
        if settings.EMAIL_HOST_USER == 'apikey':
            print("✅ SendGrid 사용자명이 올바르게 설정되었습니다.")
        else:
            print("❌ SendGrid 사용자명이 'apikey'가 아닙니다.")
            return False
            
        if settings.EMAIL_HOST_PASSWORD == sendgrid_api_key:
            print("✅ SendGrid API 키가 비밀번호로 설정되었습니다.")
        else:
            print("❌ SendGrid API 키가 비밀번호로 설정되지 않았습니다.")
            return False
    else:
        print(f"\n⚠️  SendGrid가 아닌 {settings.EMAIL_HOST}를 사용 중입니다.")
        return False
    
    return True

def test_sendgrid_email():
    """SendGrid로 테스트 이메일 발송"""
    print("\n" + "="*50)
    print("📤 SendGrid 테스트 이메일 발송")
    print("="*50)
    
    try:
        # 테스트 이메일 발송
        result = send_mail(
            subject='[VideoPlanet] SendGrid 테스트 이메일',
            message='SendGrid가 정상적으로 설정되었습니다!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['test@example.com'],  # 실제 이메일로 변경 가능
            fail_silently=False,
        )
        
        if result:
            print("✅ SendGrid 테스트 이메일 발송 성공!")
            print(f"   발신자: {settings.DEFAULT_FROM_EMAIL}")
            print("   수신자: test@example.com")
            return True
        else:
            print("❌ SendGrid 테스트 이메일 발송 실패")
            return False
            
    except Exception as e:
        print(f"❌ SendGrid 이메일 발송 오류: {str(e)}")
        print("\n가능한 원인:")
        print("1. SendGrid API 키가 올바르지 않음")
        print("2. SendGrid 계정이 활성화되지 않음")
        print("3. 발신자 이메일이 인증되지 않음")
        print("4. 네트워크 연결 문제")
        return False

def test_html_email():
    """HTML 템플릿 이메일 테스트"""
    print("\n" + "="*50)
    print("🎨 HTML 템플릿 이메일 테스트")
    print("="*50)
    
    try:
        from django.template.loader import render_to_string
        from django.utils.html import strip_tags
        
        # HTML 이메일 내용
        html_content = """
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #1631F8; text-align: center;">VideoPlanet SendGrid 테스트</h1>
                <p style="font-size: 16px; color: #333;">안녕하세요!</p>
                <p style="font-size: 16px; color: #333;">SendGrid를 통한 HTML 이메일 발송이 정상적으로 작동합니다.</p>
                <div style="background: #f0f4ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1631F8; margin-top: 0;">이제 사용 가능한 기능:</h3>
                    <ul style="color: #555;">
                        <li>회원가입 인증 이메일</li>
                        <li>비밀번호 재설정 이메일</li>
                        <li>프로젝트 초대 이메일</li>
                        <li>알림 이메일</li>
                    </ul>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                    © 2025 VideoPlanet. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        # 텍스트 버전
        text_content = strip_tags(html_content)
        
        # HTML 이메일 발송
        result = send_mail(
            subject='[VideoPlanet] SendGrid HTML 테스트',
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['test@example.com'],
            html_message=html_content,
            fail_silently=False,
        )
        
        if result:
            print("✅ HTML 템플릿 이메일 발송 성공!")
            return True
        else:
            print("❌ HTML 템플릿 이메일 발송 실패")
            return False
            
    except Exception as e:
        print(f"❌ HTML 이메일 발송 오류: {str(e)}")
        return False

def main():
    """메인 실행 함수"""
    print("🚀 VideoPlanet SendGrid 설정 테스트")
    print("="*70)
    
    # SendGrid 설정 확인
    if not check_sendgrid_setup():
        print("\n❌ SendGrid 설정이 완료되지 않았습니다.")
        print("위의 안내에 따라 설정을 완료해주세요.")
        return False
    
    # 테스트 이메일 발송
    test_results = {
        'basic_email': test_sendgrid_email(),
        'html_email': test_html_email(),
    }
    
    # 결과 요약
    print("\n" + "="*70)
    print("📋 테스트 결과 요약")
    print("="*70)
    
    all_passed = all(test_results.values())
    
    for test_name, result in test_results.items():
        status = "✅ 성공" if result else "❌ 실패"
        print(f"{test_name}: {status}")
    
    if all_passed:
        print("\n🎉 모든 테스트 통과! SendGrid가 정상적으로 설정되었습니다.")
        print("\n다음 단계:")
        print("1. Railway에 배포하면 자동으로 SendGrid를 사용합니다.")
        print("2. 실제 이메일 주소로 테스트해보세요.")
        print("3. SendGrid 대시보드에서 이메일 통계를 확인할 수 있습니다.")
    else:
        print("\n⚠️  일부 테스트가 실패했습니다.")
        print("SendGrid API 키와 설정을 다시 확인해주세요.")
    
    return all_passed

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ 테스트가 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 예상치 못한 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)