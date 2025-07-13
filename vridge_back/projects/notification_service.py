"""
프로젝트 알림 서비스
"""
from django.contrib.auth import get_user_model
from . import models
from users.models import Notification
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class NotificationService:
    """알림 서비스"""
    
    NOTIFICATION_TYPES = {
        'INVITATION_RECEIVED': {
            'title': '프로젝트 초대',
            'icon': '📨',
            'color': '#1631F8'
        },
        'INVITATION_ACCEPTED': {
            'title': '초대 수락',
            'icon': '✅',
            'color': '#28a745'
        },
        'INVITATION_DECLINED': {
            'title': '초대 거절',
            'icon': '❌',
            'color': '#dc3545'
        },
        'MEMBER_JOINED': {
            'title': '새 멤버 참여',
            'icon': '👥',
            'color': '#17a2b8'
        },
        'MEMBER_LEFT': {
            'title': '멤버 퇴장',
            'icon': '👋',
            'color': '#ffc107'
        },
        'PROJECT_UPDATED': {
            'title': '프로젝트 업데이트',
            'icon': '📝',
            'color': '#6c757d'
        },
        'FEEDBACK_RECEIVED': {
            'title': '새로운 피드백',
            'icon': '💬',
            'color': '#fd7e14'
        }
    }
    
    @staticmethod
    def create_notification(user, notification_type, title, message, related_object=None, action_url=None):
        """알림 생성"""
        try:
            notification_config = NotificationService.NOTIFICATION_TYPES.get(notification_type, {})
            
            notification = Notification.objects.create(
                recipient=user,
                notification_type=notification_type.lower(),
                title=title,
                message=message
            )
            
            # 관련 프로젝트 연결 (선택사항)
            if related_object:
                if hasattr(related_object, 'project') and hasattr(related_object.project, 'id'):
                    notification.project_id = related_object.project.id
                elif hasattr(related_object, 'id') and hasattr(related_object, '_meta') and hasattr(related_object, '_meta') and related_object._meta.model_name == 'project':
                    notification.project_id = related_object.id
            
            notification.save()
            
            logger.info(f"알림 생성 성공: {user.email} - {notification_type}")
            return notification
            
        except Exception as e:
            logger.error(f"알림 생성 중 오류: {str(e)}")
            return None
    
    @staticmethod
    def notify_invitation_received(invitation):
        """초대 받음 알림"""
        try:
            # 초대받은 사람이 가입된 사용자인 경우만 알림 생성
            invitee_user = User.objects.filter(email=invitation.invitee_email).first()
            if not invitee_user:
                return None
            
            title = f"'{invitation.project.name}' 프로젝트 초대"
            message = f"{invitation.inviter.nickname}님이 프로젝트에 초대하셨습니다."
            action_url = f"/invitation/{invitation.token}"
            
            return NotificationService.create_notification(
                user=invitee_user,
                notification_type='INVITATION_RECEIVED',
                title=title,
                message=message,
                related_object=invitation,
                action_url=action_url
            )
            
        except Exception as e:
            logger.error(f"초대 받음 알림 생성 중 오류: {str(e)}")
            return None
    
    @staticmethod
    def notify_invitation_accepted(invitation):
        """초대 수락 알림 (초대자에게)"""
        try:
            title = f"초대가 수락되었습니다"
            message = f"{invitation.invitee_email}님이 '{invitation.project.name}' 프로젝트 초대를 수락했습니다."
            action_url = f"/project/{invitation.project.id}"
            
            return NotificationService.create_notification(
                user=invitation.inviter,
                notification_type='INVITATION_ACCEPTED',
                title=title,
                message=message,
                related_object=invitation,
                action_url=action_url
            )
            
        except Exception as e:
            logger.error(f"초대 수락 알림 생성 중 오류: {str(e)}")
            return None
    
    @staticmethod
    def notify_invitation_declined(invitation):
        """초대 거절 알림 (초대자에게)"""
        try:
            title = f"초대가 거절되었습니다"
            message = f"{invitation.invitee_email}님이 '{invitation.project.name}' 프로젝트 초대를 거절했습니다."
            action_url = f"/project/{invitation.project.id}"
            
            return NotificationService.create_notification(
                user=invitation.inviter,
                notification_type='INVITATION_DECLINED',
                title=title,
                message=message,
                related_object=invitation,
                action_url=action_url
            )
            
        except Exception as e:
            logger.error(f"초대 거절 알림 생성 중 오류: {str(e)}")
            return None
    
    @staticmethod
    def notify_member_joined(project, new_member):
        """새 멤버 참여 알림 (프로젝트 멤버들에게)"""
        try:
            # 프로젝트의 모든 멤버 (소유자 + 멤버들)
            project_members = []
            
            # 소유자 추가
            if project.user:
                project_members.append(project.user)
            
            # 기존 멤버들 추가
            existing_members = models.Members.objects.filter(project=project).select_related('user')
            for member in existing_members:
                if member.user not in project_members:
                    project_members.append(member.user)
            
            # 새로 참여한 멤버 제외
            project_members = [member for member in project_members if member != new_member]
            
            title = f"새 멤버가 참여했습니다"
            message = f"{new_member.nickname}님이 '{project.name}' 프로젝트에 참여했습니다."
            action_url = f"/project/{project.id}"
            
            notifications = []
            for member in project_members:
                notification = NotificationService.create_notification(
                    user=member,
                    notification_type='MEMBER_JOINED',
                    title=title,
                    message=message,
                    related_object=project,
                    action_url=action_url
                )
                if notification:
                    notifications.append(notification)
            
            return notifications
            
        except Exception as e:
            logger.error(f"새 멤버 참여 알림 생성 중 오류: {str(e)}")
            return []
    
    @staticmethod
    def get_user_notifications(user, unread_only=False, limit=20):
        """사용자 알림 조회"""
        try:
            queryset = Notification.objects.filter(recipient=user)
            
            if unread_only:
                queryset = queryset.filter(is_read=False)
            
            return queryset.order_by('-created')[:limit]
            
        except Exception as e:
            logger.error(f"사용자 알림 조회 중 오류: {str(e)}")
            return []
    
    @staticmethod
    def mark_as_read(notification_ids, user):
        """알림 읽음 처리"""
        try:
            updated_count = Notification.objects.filter(
                id__in=notification_ids,
                recipient=user
            ).update(is_read=True)
            
            logger.info(f"알림 읽음 처리: {updated_count}개")
            return updated_count
            
        except Exception as e:
            logger.error(f"알림 읽음 처리 중 오류: {str(e)}")
            return 0
    
    @staticmethod
    def get_unread_count(user):
        """읽지 않은 알림 개수"""
        try:
            return Notification.objects.filter(recipient=user, is_read=False).count()
        except Exception as e:
            logger.error(f"읽지 않은 알림 개수 조회 중 오류: {str(e)}")
            return 0