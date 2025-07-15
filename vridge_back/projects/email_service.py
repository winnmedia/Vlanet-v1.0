"""
프로젝트 초대 이메일 발송 서비스
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
import logging
from users.email_queue import email_queue_manager

logger = logging.getLogger(__name__)

class ProjectInvitationEmailService:
    """프로젝트 초대 이메일 서비스"""
    
    @staticmethod
    def send_invitation_email(invitation):
        """프로젝트 초대 이메일 발송"""
        try:
            # 초대 링크 생성
            invitation_url = f"{settings.FRONTEND_URL}/invitation/{invitation.token}"
            
            # 이메일 제목
            subject = f"[VideoPlanet] {invitation.project.name} 프로젝트 초대"
            
            # 이메일 본문 (HTML) - 프리미엄 템플릿 사용
            html_message = render_to_string('emails/project_invitation_premium.html', {
                'project_name': invitation.project.name,
                'inviter_name': invitation.inviter.nickname,
                'invitation_url': invitation_url,
                'message': invitation.message,
                'site_name': 'VideoPlanet',
                'site_url': settings.FRONTEND_URL,
            })
            
            # 이메일 본문 (텍스트)
            text_message = f"""
안녕하세요!

{invitation.inviter.nickname}님이 "{invitation.project.name}" 프로젝트에 초대하셨습니다.

초대 메시지: {invitation.message}

아래 링크를 클릭하여 초대를 수락하세요:
{invitation_url}

이 초대는 {invitation.expires_at.strftime('%Y년 %m월 %d일')}까지 유효합니다.

감사합니다.
VideoPlanet 팀
            """
            
            # 이메일 큐에 추가 (높은 우선순위)
            email_id = email_queue_manager.add_email(
                subject=subject,
                body=text_message,
                recipient_list=[invitation.invitee_email],
                html_message=html_message,
                priority=2,  # 높은 우선순위
                email_type='invitation'
            )
            
            if email_id:
                logger.info(f"초대 이메일이 큐에 추가됨: {invitation.invitee_email} (ID: {email_id})")
                return True
            else:
                logger.error(f"초대 이메일 큐 추가 실패: {invitation.invitee_email}")
                return False
                
        except Exception as e:
            logger.error(f"초대 이메일 발송 중 오류: {str(e)}")
            return False
    
    @staticmethod
    def send_invitation_accepted_email(invitation):
        """초대 수락 알림 이메일 (초대자에게)"""
        try:
            subject = f"[VideoPlanet] {invitation.invitee_email}님이 초대를 수락했습니다"
            
            html_message = render_to_string('emails/invitation_accepted_premium.html', {
                'project_name': invitation.project.name,
                'project_id': invitation.project.id,
                'invitee_name': invitation.invitee_email.split('@')[0],
                'site_name': 'VideoPlanet',
                'site_url': settings.FRONTEND_URL,
            })
            
            text_message = f"""
안녕하세요 {invitation.inviter.nickname}님!

{invitation.invitee_email}님이 "{invitation.project.name}" 프로젝트 초대를 수락했습니다.

이제 함께 프로젝트를 진행하실 수 있습니다.

감사합니다.
VideoPlanet 팀
            """
            
            email_id = email_queue_manager.add_email(
                subject=subject,
                body=text_message,
                recipient_list=[invitation.inviter.email],
                html_message=html_message,
                priority=3,  # 일반 우선순위
                email_type='notification'
            )
            
            if email_id:
                logger.info(f"초대 수락 알림이 큐에 추가됨: {invitation.inviter.email} (ID: {email_id})")
                return True
            else:
                logger.error(f"초대 수락 알림 큐 추가 실패: {invitation.inviter.email}")
                return False
                
        except Exception as e:
            logger.error(f"초대 수락 알림 이메일 발송 중 오류: {str(e)}")
            return False
    
    @staticmethod
    def send_invitation_declined_email(invitation):
        """초대 거절 알림 이메일 (초대자에게)"""
        try:
            subject = f"[VideoPlanet] {invitation.invitee_email}님이 초대를 거절했습니다"
            
            html_message = render_to_string('emails/invitation_declined_premium.html', {
                'project_name': invitation.project.name,
                'project_id': invitation.project.id,
                'invitee_name': invitation.invitee_email.split('@')[0],
                'site_name': 'VideoPlanet',
                'site_url': settings.FRONTEND_URL,
            })
            
            text_message = f"""
안녕하세요 {invitation.inviter.nickname}님!

{invitation.invitee_email}님이 "{invitation.project.name}" 프로젝트 초대를 거절했습니다.

다른 멤버를 초대하여 프로젝트를 진행하실 수 있습니다.

감사합니다.
VideoPlanet 팀
            """
            
            email_id = email_queue_manager.add_email(
                subject=subject,
                body=text_message,
                recipient_list=[invitation.inviter.email],
                html_message=html_message,
                priority=3,  # 일반 우선순위
                email_type='notification'
            )
            
            if email_id:
                logger.info(f"초대 거절 알림이 큐에 추가됨: {invitation.inviter.email} (ID: {email_id})")
                return True
            else:
                logger.error(f"초대 거절 알림 큐 추가 실패: {invitation.inviter.email}")
                return False
                
        except Exception as e:
            logger.error(f"초대 거절 알림 이메일 발송 중 오류: {str(e)}")
            return False