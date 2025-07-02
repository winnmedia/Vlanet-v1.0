# -*- coding: utf-8 -*-
"""
사용자 프로필 관련 뷰
"""
import json
import logging
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .utils import user_validator
from . import models

logger = logging.getLogger(__name__)


class UserProfile(View):
    """사용자 프로필 조회 및 수정"""
    
    @user_validator
    def get(self, request):
        """현재 로그인한 사용자의 프로필 정보 조회"""
        try:
            user = request.user
            
            profile_data = {
                "email": user.username,
                "nickname": user.nickname if user.nickname else user.username,
                "login_method": user.login_method,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined.strftime("%Y-%m-%d"),
                "projects_count": user.projects.count(),
                "member_projects_count": user.members.count(),
                "profile_image": user.profile_image.url if hasattr(user, 'profile_image') and user.profile_image else None,
                "bio": getattr(user, 'bio', ''),
                "phone": getattr(user, 'phone', ''),
                "company": getattr(user, 'company', ''),
                "position": getattr(user, 'position', ''),
            }
            
            return JsonResponse({
                "status": "success",
                "profile": profile_data
            }, status=200)
            
        except Exception as e:
            logger.error(f"Profile retrieval error: {str(e)}")
            return JsonResponse({
                "message": "프로필 정보를 가져오는데 실패했습니다."
            }, status=500)
    
    @user_validator
    def post(self, request):
        """사용자 프로필 정보 수정"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            nickname = data.get("nickname")
            
            # 닉네임 수정
            if nickname:
                # 닉네임 길이 검증
                if len(nickname) < 2:
                    return JsonResponse({
                        "message": "닉네임은 최소 2자 이상이어야 합니다."
                    }, status=400)
                
                # 닉네임 중복 확인 (자기 자신 제외)
                existing_user = models.User.objects.filter(
                    nickname=nickname
                ).exclude(id=user.id).first()
                
                if existing_user:
                    return JsonResponse({
                        "message": "이미 사용 중인 닉네임입니다."
                    }, status=409)
                
                user.nickname = nickname
                user.save()
                
                return JsonResponse({
                    "status": "success",
                    "message": "프로필이 성공적으로 업데이트되었습니다.",
                    "nickname": user.nickname
                }, status=200)
            
            return JsonResponse({
                "message": "수정할 정보를 입력해주세요."
            }, status=400)
            
        except Exception as e:
            logger.error(f"Profile update error: {str(e)}")
            return JsonResponse({
                "message": "프로필 수정 중 오류가 발생했습니다."
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ChangePassword(View):
    """비밀번호 변경"""
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            data = json.loads(request.body)
            
            # 소셜 로그인 사용자는 비밀번호 변경 불가
            if user.login_method != "email":
                return JsonResponse({
                    "message": f"{user.login_method} 로그인 사용자는 비밀번호를 변경할 수 없습니다."
                }, status=400)
            
            current_password = data.get("current_password")
            new_password = data.get("new_password")
            
            # 입력값 검증
            if not current_password or not new_password:
                return JsonResponse({
                    "message": "현재 비밀번호와 새 비밀번호를 모두 입력해주세요."
                }, status=400)
            
            # 현재 비밀번호 확인
            if not check_password(current_password, user.password):
                return JsonResponse({
                    "message": "현재 비밀번호가 일치하지 않습니다."
                }, status=401)
            
            # 새 비밀번호 길이 검증
            if len(new_password) < 10:
                return JsonResponse({
                    "message": "새 비밀번호는 최소 10자 이상이어야 합니다."
                }, status=400)
            
            # 현재 비밀번호와 새 비밀번호가 같은지 확인
            if current_password == new_password:
                return JsonResponse({
                    "message": "새 비밀번호는 현재 비밀번호와 달라야 합니다."
                }, status=400)
            
            # 비밀번호 변경
            user.set_password(new_password)
            user.save()
            
            return JsonResponse({
                "status": "success",
                "message": "비밀번호가 성공적으로 변경되었습니다."
            }, status=200)
            
        except Exception as e:
            logger.error(f"Password change error: {str(e)}")
            return JsonResponse({
                "message": "비밀번호 변경 중 오류가 발생했습니다."
            }, status=500)


class UserStats(View):
    """사용자 통계 정보"""
    
    @user_validator
    def get(self, request):
        try:
            user = request.user
            
            # 프로젝트 통계
            owned_projects = user.projects.all()
            member_projects = user.members.all()
            
            # 진행 상태별 프로젝트 수 계산
            def get_project_status(project):
                # 각 단계의 날짜를 확인하여 현재 상태 파악
                now = timezone.now()
                if project.video_delivery.end_date and project.video_delivery.end_date < now:
                    return "completed"
                elif project.basic_plan.start_date and project.basic_plan.start_date > now:
                    return "planned"
                else:
                    return "in_progress"
            
            owned_status = {"planned": 0, "in_progress": 0, "completed": 0}
            for project in owned_projects:
                status = get_project_status(project)
                owned_status[status] += 1
            
            stats = {
                "total_projects": owned_projects.count() + member_projects.count(),
                "owned_projects": {
                    "total": owned_projects.count(),
                    "by_status": owned_status
                },
                "member_projects": {
                    "total": member_projects.count(),
                    "as_manager": member_projects.filter(rating="manager").count(),
                    "as_member": member_projects.filter(rating="member").count()
                },
                "recent_activity": {
                    "last_project_created": owned_projects.order_by('-created').first().created.strftime("%Y-%m-%d") if owned_projects.exists() else None,
                    "active_projects": owned_status["in_progress"]
                }
            }
            
            return JsonResponse({
                "status": "success",
                "stats": stats
            }, status=200)
            
        except Exception as e:
            logger.error(f"User stats error: {str(e)}")
            return JsonResponse({
                "message": "통계 정보를 가져오는데 실패했습니다."
            }, status=500)


from django.utils import timezone

class DeleteAccount(View):
    """계정 삭제"""
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            data = json.loads(request.body)
            
            password = data.get("password")
            confirm_delete = data.get("confirm_delete", False)
            
            # 삭제 확인
            if not confirm_delete:
                return JsonResponse({
                    "message": "계정 삭제를 확인해주세요."
                }, status=400)
            
            # 이메일 로그인 사용자는 비밀번호 확인
            if user.login_method == "email":
                if not password:
                    return JsonResponse({
                        "message": "비밀번호를 입력해주세요."
                    }, status=400)
                
                if not check_password(password, user.password):
                    return JsonResponse({
                        "message": "비밀번호가 일치하지 않습니다."
                    }, status=401)
            
            # 소유한 프로젝트가 있는지 확인
            if user.projects.exists():
                return JsonResponse({
                    "message": "소유한 프로젝트가 있습니다. 프로젝트를 먼저 삭제하거나 다른 사용자에게 이전해주세요.",
                    "owned_projects_count": user.projects.count()
                }, status=400)
            
            # 계정 삭제 (실제로는 비활성화)
            user.is_active = False
            user.save()
            
            return JsonResponse({
                "status": "success",
                "message": "계정이 성공적으로 삭제되었습니다."
            }, status=200)
            
        except Exception as e:
            logger.error(f"Account deletion error: {str(e)}")
            return JsonResponse({
                "message": "계정 삭제 중 오류가 발생했습니다."
            }, status=500)