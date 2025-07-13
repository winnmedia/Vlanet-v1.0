"""
SendGrid 이메일 서비스
"""
import os
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class SendGridEmailService:
    """SendGrid를 사용한 이메일 발송 서비스"""
    
    @staticmethod
    def send_verification_email(user, verification_token):
        """회원가입 인증 이메일 발송"""
        try:
            # 인증 링크 생성
            verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token.token}"
            
            # HTML 템플릿 렌더링
            html_content = render_to_string('emails/email_verification_premium.html', {
                'user': user,
                'verification_url': verification_url,
                'valid_hours': 24,
                'current_year': 2025,
            })
            
            # 텍스트 버전 생성
            text_content = strip_tags(html_content)
            
            # SendGrid로 이메일 발송
            result = send_mail(
                subject='[VideoPlanet] 이메일 인증을 완료해주세요',
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False,
            )
            
            if result:
                logger.info(f"SendGrid로 인증 이메일 발송 성공: {user.email}")
                return True
            else:
                logger.error(f"SendGrid 인증 이메일 발송 실패: {user.email}")
                return False
                
        except Exception as e:
            logger.error(f"SendGrid 이메일 발송 오류: {str(e)}")
            return False
    
    @staticmethod
    def send_welcome_email(user):
        """인증 완료 후 환영 이메일 발송"""
        try:
            # HTML 템플릿 렌더링
            html_content = render_to_string('emails/welcome_email.html', {
                'user': user,
                'login_url': f"{settings.FRONTEND_URL}/login",
                'features': [
                    '영상 프로젝트 관리',
                    '실시간 피드백 시스템',
                    'AI 기반 콘티 생성',
                    '팀원 협업 기능'
                ],
                'current_year': 2025,
            })
            
            # 텍스트 버전 생성
            text_content = strip_tags(html_content)
            
            # SendGrid로 이메일 발송
            result = send_mail(
                subject='[VideoPlanet] 환영합니다! 🎬',
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False,
            )
            
            if result:
                logger.info(f"SendGrid로 환영 이메일 발송 성공: {user.email}")
                return True
            else:
                logger.error(f"SendGrid 환영 이메일 발송 실패: {user.email}")
                return False
                
        except Exception as e:
            logger.error(f"SendGrid 환영 이메일 발송 오류: {str(e)}")
            return False
    
    @staticmethod
    def send_password_reset_email(user, reset_code):
        """비밀번호 재설정 이메일 발송"""
        try:
            # HTML 템플릿 렌더링
            html_content = render_to_string('emails/password_reset.html', {
                'user': user,
                'reset_code': reset_code,
                'valid_minutes': 30,
                'current_year': 2025,
            })
            
            # 텍스트 버전 생성
            text_content = f"""
VideoPlanet 비밀번호 재설정 인증번호

안녕하세요 {user.nickname or user.username}님,

비밀번호 재설정을 위한 인증번호입니다:

인증번호: {reset_code}

이 인증번호는 30분간 유효합니다.

감사합니다.
VideoPlanet 팀
            """
            
            # SendGrid로 이메일 발송
            result = send_mail(
                subject='[VideoPlanet] 비밀번호 재설정 인증번호',
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False,
            )
            
            if result:
                logger.info(f"SendGrid로 비밀번호 재설정 이메일 발송 성공: {user.email}")
                return True
            else:
                logger.error(f"SendGrid 비밀번호 재설정 이메일 발송 실패: {user.email}")
                return False
                
        except Exception as e:
            logger.error(f"SendGrid 비밀번호 재설정 이메일 발송 오류: {str(e)}")
            return False
    
    @staticmethod
    def test_sendgrid_connection():
        """SendGrid 연결 테스트"""
        try:
            if not os.environ.get('SENDGRID_API_KEY'):
                return False, "SendGrid API 키가 설정되지 않았습니다."
            
            # 테스트 이메일 발송
            result = send_mail(
                subject='[VideoPlanet] SendGrid 연결 테스트',
                message='SendGrid가 정상적으로 설정되었습니다.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=['test@example.com'],
                fail_silently=False,
            )
            
            if result:
                return True, "SendGrid 연결 성공"
            else:
                return False, "SendGrid 이메일 발송 실패"
                
        except Exception as e:
            return False, f"SendGrid 연결 오류: {str(e)}"