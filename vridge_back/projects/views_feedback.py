"""
프로젝트 하위 리소스로 피드백을 제공하는 뷰
URL 패턴: /api/projects/{project_id}/feedback/
"""
import json
import logging
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from users.utils import user_validator
from . import models as project_model
from feedbacks import models as feedback_model


logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectFeedback(View):
    """프로젝트의 피드백 정보를 조회하거나 생성"""
    
    @user_validator
    def get(self, request, project_id):
        try:
            user = request.user
            
            # 프로젝트 조회
            project = project_model.Project.objects.select_related(
                'user', 'feedback'
            ).prefetch_related(
                'members__user'
            ).filter(id=project_id).first()
            
            if not project:
                return JsonResponse({
                    "error": "프로젝트를 찾을 수 없습니다.",
                    "project_id": project_id
                }, status=404)
            
            # 권한 확인
            is_member = project.members.filter(user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({"error": "권한이 없습니다."}, status=403)
            
            # 피드백이 없으면 생성
            if not project.feedback:
                with transaction.atomic():
                    feedback = feedback_model.FeedBack.objects.create()
                    project.feedback = feedback
                    project.save()
                    logger.info(f"Created feedback {feedback.id} for project {project_id}")
            
            # 피드백 정보 구성
            feedback_data = {
                "id": project.feedback.id,
                "project_id": project.id,
                "project_name": project.name,
                "files": None,
                "comments": []
            }
            
            # 파일 정보
            if project.feedback.files:
                file_path = project.feedback.files.name
                if settings.DEBUG:
                    feedback_data["files"] = f"http://127.0.0.1:8000/media/{file_path}"
                else:
                    feedback_data["files"] = f"https://videoplanet.up.railway.app/media/{file_path}"
            
            # 피드백 코멘트
            comments = feedback_model.FeedBackComment.objects.filter(
                feedback=project.feedback
            ).select_related('user').order_by('-created')
            
            feedback_data["comments"] = [
                {
                    "id": comment.id,
                    "user": comment.user.nickname or comment.user.username,
                    "security": comment.security,
                    "title": comment.title,
                    "section": comment.section,
                    "text": comment.text,
                    "created": comment.created.isoformat()
                }
                for comment in comments
            ]
            
            return JsonResponse({
                "status": "success",
                "feedback": feedback_data
            })
            
        except Exception as e:
            logger.error(f"Error in ProjectFeedback.get: {str(e)}")
            return JsonResponse({
                "error": "서버 오류가 발생했습니다."
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectFeedbackComments(View):
    """프로젝트 피드백의 코멘트 관리"""
    
    @user_validator
    def get(self, request, project_id):
        """피드백 코멘트 목록 조회"""
        try:
            user = request.user
            
            # 프로젝트 조회
            project = project_model.Project.objects.select_related('feedback').get(id=project_id)
            
            # 권한 확인
            is_member = project.members.filter(user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({"error": "권한이 없습니다."}, status=403)
            
            if not project.feedback:
                return JsonResponse({"error": "피드백이 생성되지 않았습니다."}, status=400)
            
            # 코멘트 조회
            comments = feedback_model.FeedBackComment.objects.filter(
                feedback=project.feedback
            ).select_related('user').order_by('-created')
            
            comments_data = [
                {
                    "id": comment.id,
                    "user": comment.user.nickname or comment.user.username,
                    "user_id": comment.user.id,
                    "is_mine": comment.user == user,
                    "security": comment.security,
                    "title": comment.title,
                    "section": comment.section,
                    "text": comment.text,
                    "created": comment.created.isoformat()
                }
                for comment in comments
            ]
            
            return JsonResponse({
                "status": "success",
                "comments": comments_data,
                "total": len(comments_data)
            })
            
        except project_model.Project.DoesNotExist:
            return JsonResponse({"error": "프로젝트를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in ProjectFeedbackComments.get: {str(e)}")
            return JsonResponse({"error": "서버 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def post(self, request, project_id):
        """피드백 코멘트 작성"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            # 프로젝트 조회
            project = project_model.Project.objects.select_related('feedback').get(id=project_id)
            
            # 권한 확인
            is_member = project.members.filter(user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({"error": "권한이 없습니다."}, status=403)
            
            if not project.feedback:
                return JsonResponse({"error": "피드백이 생성되지 않았습니다."}, status=400)
            
            # 코멘트 생성
            comment = feedback_model.FeedBackComment.objects.create(
                feedback=project.feedback,
                user=user,
                security=data.get('security', False),
                title=data.get('title', ''),
                section=data.get('section', ''),
                text=data.get('text', '')
            )
            
            return JsonResponse({
                "status": "success",
                "comment": {
                    "id": comment.id,
                    "user": comment.user.nickname or comment.user.username,
                    "created": comment.created.isoformat()
                }
            })
            
        except project_model.Project.DoesNotExist:
            return JsonResponse({"error": "프로젝트를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in ProjectFeedbackComments.post: {str(e)}")
            return JsonResponse({"error": "서버 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectFeedbackUpload(View):
    """프로젝트 피드백 파일 업로드"""
    
    @user_validator
    def post(self, request, project_id):
        try:
            user = request.user
            
            # 프로젝트 조회
            project = project_model.Project.objects.select_related('feedback').get(id=project_id)
            
            # 권한 확인 (관리자만)
            is_manager = project.members.filter(user=user, rating='manager').exists()
            if project.user != user and not is_manager:
                return JsonResponse({"error": "파일 업로드는 관리자만 가능합니다."}, status=403)
            
            if not project.feedback:
                # 피드백 생성
                with transaction.atomic():
                    feedback = feedback_model.FeedBack.objects.create()
                    project.feedback = feedback
                    project.save()
            
            # 파일 업로드
            if 'files' in request.FILES:
                project.feedback.files = request.FILES['files']
                project.feedback.save()
                
                return JsonResponse({
                    "status": "success",
                    "message": "파일이 업로드되었습니다.",
                    "file_name": project.feedback.files.name
                })
            else:
                return JsonResponse({"error": "파일이 없습니다."}, status=400)
                
        except project_model.Project.DoesNotExist:
            return JsonResponse({"error": "프로젝트를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in ProjectFeedbackUpload.post: {str(e)}")
            return JsonResponse({"error": "서버 오류가 발생했습니다."}, status=500)