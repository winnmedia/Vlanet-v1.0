"""
사용자 이메일 인증 서비스
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.urls import reverse
import logging
import os

from .models import User, EmailVerificationToken

# email_queue_manager 안전하게 임포트
try:
    from .email_queue import email_queue_manager
    # 큐 매니저 시작 확인
    if not email_queue_manager.is_running:
        email_queue_manager.start()
except Exception as e:
    logger.warning(f"Email queue manager not available: {str(e)}")
    email_queue_manager = None

logger = logging.getLogger(__name__)

class EmailVerificationService:
    """이메일 인증 서비스"""
    
    @staticmethod
    def send_verification_email(user):
        """회원가입 인증 이메일 발송"""
        try:
            # 기존 인증 토큰이 있다면 삭제
            EmailVerificationToken.objects.filter(
                user=user, 
                email=user.email,
                is_verified=False
            ).delete()
            
            # 새 인증 토큰 생성 (24시간 유효)
            verification_token = EmailVerificationToken.objects.create(
                user=user,
                email=user.email,
                expires_at=timezone.now() + timedelta(hours=24)
            )
            
            # 인증 링크 생성
            verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token.token}"
            
            # 이메일 제목
            subject = "[VideoPlanet] 이메일 인증을 완료해 주세요"
            
            # 이메일 본문 (HTML) - 템플릿 사용 (없으면 기본 HTML)
            try:
                html_message = render_to_string('emails/email_verification_premium.html', {
                    'user_name': user.nickname or user.username,
                    'user_email': user.email,
                    'verification_url': verification_url,
                    'expires_hours': 24,
                    'site_name': 'VideoPlanet',
                    'site_url': settings.FRONTEND_URL,
                })
            except Exception:
                # 템플릿이 없으면 기본 HTML 사용
                html_message = f"""
                <html>
                <body>
                    <h2>안녕하세요 {user.nickname or user.username}님!</h2>
                    <p>VideoPlanet 회원가입을 환영합니다.</p>
                    <p>이메일 인증을 완료하기 위해 아래 링크를 클릭해 주세요:</p>
                    <p><a href="{verification_url}" style="background-color: #1631F8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">이메일 인증하기</a></p>
                    <p>또는 아래 링크를 복사해서 브라우저에 붙여넣으세요:</p>
                    <p>{verification_url}</p>
                    <p>이 인증 링크는 24시간 동안 유효합니다.</p>
                    <br>
                    <p>감사합니다.<br>VideoPlanet 팀</p>
                </body>
                </html>
                """
            
            # 이메일 본문 (텍스트)
            text_message = f"""
안녕하세요 {user.nickname or user.username}님!

VideoPlanet 회원가입을 환영합니다.

이메일 인증을 완료하기 위해 아래 링크를 클릭해 주세요:
{verification_url}

이 인증 링크는 24시간 동안 유효합니다.

감사합니다.
VideoPlanet 팀
            """
            
            # 이메일 발송 시도
            if email_queue_manager:
                # 큐 매니저가 있으면 큐에 추가
                email_id = email_queue_manager.add_email(
                    subject=subject,
                    body=text_message,
                    recipient_list=[user.email],
                    html_message=html_message,
                    priority=1,  # 높은 우선순위
                    email_type='verification'
                )
                
                if email_id:
                    logger.info(f"이메일 인증이 큐에 추가됨: {user.email} (ID: {email_id})")
                    return verification_token
                else:
                    logger.error(f"이메일 인증 큐 추가 실패: {user.email}")
            else:
                # 큐 매니저가 없으면 직접 발송
                from django.core.mail import send_mail
                try:
                    result = send_mail(
                        subject=subject,
                        message=text_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        html_message=html_message,
                        fail_silently=False,
                    )
                    if result:
                        logger.info(f"이메일 인증 직접 발송 성공: {user.email}")
                        return verification_token
                except Exception as send_error:
                    logger.error(f"이메일 직접 발송 실패: {str(send_error)}")
            
            # 이메일 발송 실패해도 토큰은 반환 (나중에 재발송 가능)
            return verification_token
                
        except Exception as e:
            logger.error(f"이메일 인증 발송 중 오류: {str(e)}")
            return None
    
    @staticmethod
    def verify_email(token):
        """이메일 인증 처리"""
        try:
            verification_token = EmailVerificationToken.objects.get(
                token=token,
                is_verified=False
            )
            
            # 토큰 만료 확인
            if verification_token.is_expired():
                logger.warning(f"만료된 토큰으로 인증 시도: {verification_token.email}")
                return False, "인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해 주세요."
            
            # 사용자 이메일 인증 완료 처리
            user = verification_token.user
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.save()
            
            # 토큰 인증 완료 처리
            verification_token.is_verified = True
            verification_token.verified_at = timezone.now()
            verification_token.save()
            
            logger.info(f"이메일 인증 완료: {user.email}")
            return True, "이메일 인증이 완료되었습니다. 이제 모든 기능을 이용하실 수 있습니다."
            
        except EmailVerificationToken.DoesNotExist:
            logger.warning(f"존재하지 않는 토큰으로 인증 시도: {token}")
            return False, "유효하지 않은 인증 링크입니다."
        except Exception as e:
            logger.error(f"이메일 인증 처리 중 오류: {str(e)}")
            return False, "인증 처리 중 오류가 발생했습니다. 다시 시도해 주세요."
    
    @staticmethod
    def resend_verification_email(user):
        """인증 이메일 재발송"""
        if user.email_verified:
            return False, "이미 이메일 인증이 완료된 계정입니다."
        
        # 기존 토큰 삭제 후 새로 발송
        verification_token = EmailVerificationService.send_verification_email(user)
        
        if verification_token:
            return True, "인증 이메일이 재발송되었습니다. 이메일을 확인해 주세요."
        else:
            return False, "이메일 발송 중 오류가 발생했습니다. 다시 시도해 주세요."
    
    @staticmethod
    def send_welcome_email(user):
        """이메일 인증 완료 후 환영 이메일 발송"""
        try:
            subject = "[VideoPlanet] 회원가입이 완료되었습니다! 🎉"
            
            html_message = render_to_string('emails/welcome_premium.html', {
                'user_name': user.nickname or user.username,
                'user_email': user.email,
                'site_name': 'VideoPlanet',
                'site_url': settings.FRONTEND_URL,
            })
            
            text_message = f"""
안녕하세요 {user.nickname or user.username}님!

VideoPlanet 회원가입이 완료되었습니다.

이제 다음과 같은 기능들을 이용하실 수 있습니다:
- 영상 프로젝트 생성 및 관리
- 팀원 초대 및 협업
- 실시간 피드백 시스템
- 프로젝트 일정 관리

지금 바로 첫 번째 프로젝트를 시작해 보세요!

감사합니다.
VideoPlanet 팀
            """
            
            success = send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            if success:
                email_backend = 'SendGrid' if os.environ.get('SENDGRID_API_KEY') else 'Gmail'
                logger.info(f"{email_backend}로 환영 이메일 발송 성공: {user.email}")
                return True
            else:
                logger.error(f"환영 이메일 발송 실핌: {user.email}")
                return False
                
        except Exception as e:
            logger.error(f"환영 이메일 발송 중 오류: {str(e)}")
            return False