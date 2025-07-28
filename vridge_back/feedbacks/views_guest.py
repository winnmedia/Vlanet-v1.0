import json, logging
from django.conf import settings
from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta
import uuid

from . import models
from projects import models as project_model

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class GuestSessionCreate(View):
    """게스트 피드백 세션 생성"""
    def post(self, request):
        try:
            data = json.loads(request.body)
            invitation_token = data.get("invitation_token")
            guest_name = data.get("guest_name")
            guest_email = data.get("guest_email", "")
            
            if not invitation_token or not guest_name:
                return JsonResponse({"message": "초대 토큰과 이름은 필수입니다."}, status=400)
            
            # 초대 정보 확인
            invitation = project_model.ProjectInvitation.objects.filter(
                token=invitation_token,
                status='pending'
            ).select_related('project').first()
            
            if not invitation:
                return JsonResponse({"message": "유효하지 않은 초대입니다."}, status=404)
            
            # 초대 만료 확인
            if timezone.now() > invitation.expires_at:
                invitation.status = 'expired'
                invitation.save()
                return JsonResponse({"message": "만료된 초대입니다."}, status=400)
            
            # 게스트 세션 생성
            session_token = str(uuid.uuid4())
            expires_at = timezone.now() + timedelta(hours=24)  # 24시간 유효
            
            guest_session = models.GuestFeedbackSession.objects.create(
                token=session_token,
                project=invitation.project,
                invitation=invitation,
                guest_name=guest_name,
                guest_email=guest_email,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                expires_at=expires_at
            )
            
            return JsonResponse({
                "session_token": session_token,
                "project_id": invitation.project.id,
                "project_name": invitation.project.name,
                "expires_at": expires_at.isoformat()
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error creating guest session: {str(e)}", exc_info=True)
            return JsonResponse({"message": "세션 생성 중 오류가 발생했습니다."}, status=500)
    
    def get_client_ip(self, request):
        """클라이언트 IP 주소 가져오기"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@method_decorator(csrf_exempt, name='dispatch')
class GuestFeedbackDetail(View):
    """게스트 피드백 조회 및 작성"""
    def validate_guest_session(self, request):
        """게스트 세션 검증"""
        session_token = request.headers.get('X-Guest-Session-Token')
        if not session_token:
            return None, JsonResponse({"message": "게스트 세션 토큰이 필요합니다."}, status=401)
        
        guest_session = models.GuestFeedbackSession.objects.filter(
            token=session_token,
            is_active=True
        ).select_related('project').first()
        
        if not guest_session:
            return None, JsonResponse({"message": "유효하지 않은 세션입니다."}, status=401)
        
        if guest_session.is_expired():
            guest_session.is_active = False
            guest_session.save()
            return None, JsonResponse({"message": "만료된 세션입니다."}, status=401)
        
        # 마지막 활동 시간 업데이트
        guest_session.last_activity = timezone.now()
        guest_session.save(update_fields=['last_activity'])
        
        return guest_session, None
    
    def get(self, request, id):
        """게스트가 피드백 조회"""
        guest_session, error_response = self.validate_guest_session(request)
        if error_response:
            return error_response
        
        try:
            # 프로젝트 확인
            if guest_session.project.id != id:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            project = guest_session.project
            
            # Raw SQL로 피드백 정보 가져오기
            from django.db import connection
            with connection.cursor() as cursor:
                # 프로젝트 정보
                cursor.execute("""
                    SELECT p.id, p.name, p.manager, p.consumer, p.description,
                           p.user_id, p.created, p.updated, p.feedback_id,
                           u.username, u.nickname
                    FROM projects_project p
                    JOIN users_user u ON p.user_id = u.id
                    WHERE p.id = %s
                """, [id])
                
                row = cursor.fetchone()
                if not row:
                    return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
                
                project_data = {
                    'id': row[0],
                    'name': row[1],
                    'manager': row[2],
                    'consumer': row[3],
                    'description': row[4],
                    'owner_nickname': row[10],
                    'owner_email': row[9],
                    'created': row[6],
                    'updated': row[7],
                    'feedback_id': row[8]
                }
                
                # 피드백 파일 URL 가져오기
                feedback_file_url = None
                if project_data['feedback_id']:
                    cursor.execute("""
                        SELECT files FROM feedbacks_feedback
                        WHERE id = %s
                    """, [project_data['feedback_id']])
                    
                    feedback_row = cursor.fetchone()
                    if feedback_row and feedback_row[0]:
                        file_name = feedback_row[0]
                        if file_name.startswith('/media/'):
                            file_path = file_name
                        elif file_name.startswith('feedback_file/'):
                            file_path = f"/media/{file_name}"
                        else:
                            file_path = f"/media/feedback_file/{file_name}"
                        
                        if settings.DEBUG:
                            feedback_file_url = f"http://127.0.0.1:8000{file_path}"
                        else:
                            host = request.get_host()
                            scheme = 'https' if not host.startswith('localhost') else 'http'
                            feedback_file_url = f"{scheme}://{host}{file_path}"
                
                # 피드백 코멘트 가져오기 (게스트는 볼 수만 있음)
                feedback_comments = []
                if project_data['feedback_id']:
                    cursor.execute("""
                        SELECT c.id, c.security, c.title, c.section, c.text,
                               u.username, u.nickname, c.created,
                               COALESCE(c.display_mode, 'anonymous') as display_mode,
                               c.nickname as custom_nickname,
                               CONCAT(u.first_name, ' ', u.last_name) as full_name
                        FROM feedbacks_feedbackcomment c
                        JOIN users_user u ON c.user_id = u.id
                        WHERE c.feedback_id = %s AND c.parent_id IS NULL
                        ORDER BY c.created DESC
                    """, [project_data['feedback_id']])
                    
                    for comment_row in cursor.fetchall():
                        display_mode = comment_row[8]
                        custom_nickname = comment_row[9]
                        full_name = comment_row[10] if len(comment_row) > 10 else None
                        
                        # 표시 이름 결정
                        if display_mode == 'anonymous' or comment_row[1]:
                            display_name = '익명'
                        elif display_mode == 'nickname' and custom_nickname:
                            display_name = custom_nickname
                        else:
                            # realname 모드
                            if full_name and full_name.strip():
                                display_name = full_name.strip()
                            else:
                                # 실명이 없으면 username 사용
                                display_name = comment_row[5]
                        
                        feedback_comments.append({
                            'id': comment_row[0],
                            'security': comment_row[1],
                            'title': comment_row[2],
                            'section': comment_row[3],
                            'text': comment_row[4],
                            'nickname': display_name,
                            'created': comment_row[7],
                            'display_mode': display_mode
                        })
            
            result = {
                "id": project_data['id'],
                "name": project_data['name'],
                "manager": project_data['manager'],
                "consumer": project_data['consumer'],
                "description": project_data['description'],
                "owner_nickname": project_data['owner_nickname'],
                "owner_email": project_data['owner_email'],
                "created": project_data['created'],
                "updated": project_data['updated'],
                "files": feedback_file_url,
                "feedback": feedback_comments,
                "is_guest": True,
                "guest_name": guest_session.guest_name
            }
            
            return JsonResponse({"result": result}, status=200)
            
        except Exception as e:
            logger.error(f"Error in guest feedback detail: {str(e)}", exc_info=True)
            return JsonResponse({"message": "피드백 조회 중 오류가 발생했습니다."}, status=500)
    
    def put(self, request, id):
        """게스트가 피드백 작성"""
        guest_session, error_response = self.validate_guest_session(request)
        if error_response:
            return error_response
        
        try:
            data = json.loads(request.body)
            
            # 프로젝트 확인
            if guest_session.project.id != id:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            project = guest_session.project
            
            # 피드백 객체 확인/생성
            if not project.feedback:
                feedback = models.FeedBack.objects.create()
                project.feedback = feedback
                project.save()
            else:
                feedback = project.feedback
            
            # 게스트용 임시 사용자 생성 또는 가져오기
            from users.models import User
            guest_user, created = User.objects.get_or_create(
                username=f"guest_{guest_session.token[:8]}",
                defaults={
                    'email': guest_session.guest_email or f"guest_{guest_session.token[:8]}@guest.local",
                    'nickname': guest_session.guest_name,
                    'is_active': False,  # 게스트는 비활성 사용자로 표시
                    'login_method': 'guest'
                }
            )
            
            # 피드백 코멘트 생성
            title = data.get("title", "")
            section = data.get("section", "")
            contents = data.get("contents", "")
            
            models.FeedBackComment.objects.create(
                feedback=feedback,
                user=guest_user,
                security=False,  # 게스트는 항상 실명
                display_mode='nickname',
                nickname=guest_session.guest_name,
                title=title,
                section=section,
                text=contents,
            )
            
            return JsonResponse({"message": "피드백이 등록되었습니다."}, status=200)
            
        except Exception as e:
            logger.error(f"Error in guest feedback submission: {str(e)}", exc_info=True)
            return JsonResponse({"message": "피드백 등록 중 오류가 발생했습니다."}, status=500)