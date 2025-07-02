# -*- coding: utf-8 -*-
"""
마이페이지 종합 뷰
프로필, 프로젝트, 활동 내역 등을 한 번에 제공
"""
import json
import logging
from django.views import View
from django.http import JsonResponse
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .utils import user_validator
from . import models
from projects.models import Project, Members

logger = logging.getLogger(__name__)


class MyPageView(View):
    """마이페이지 종합 정보"""
    
    @user_validator
    def get(self, request):
        """마이페이지 전체 정보 조회"""
        try:
            user = request.user
            
            # 기본 프로필 정보 - 필드가 없을 경우를 대비한 안전한 접근
            profile_data = {
                "email": user.username,
                "nickname": user.nickname if user.nickname else user.username,
                "login_method": user.login_method,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined.strftime("%Y-%m-%d"),
                "last_login": user.last_login.strftime("%Y-%m-%d %H:%M") if user.last_login else None,
                "profile_image": user.profile_image.url if hasattr(user, 'profile_image') and user.profile_image else None,
                "bio": getattr(user, 'bio', ''),
                "phone": getattr(user, 'phone', ''),
                "company": getattr(user, 'company', ''),
                "position": getattr(user, 'position', ''),
            }
            
            # 프로젝트 정보
            owned_projects = user.projects.all().order_by('-created')
            member_projects = Project.objects.filter(
                members__user=user
            ).order_by('-created')
            
            # 최근 활동 프로젝트 (최근 7일)
            recent_date = timezone.now() - timedelta(days=7)
            recent_projects = Project.objects.filter(
                Q(user=user) | Q(members__user=user),
                updated__gte=recent_date
            ).distinct().order_by('-updated')[:5]
            
            projects_data = {
                "owned": {
                    "total": owned_projects.count(),
                    "recent": [{
                        "id": p.id,
                        "name": p.name,
                        "created": p.created.strftime("%Y-%m-%d"),
                        "status": self._get_project_status(p)
                    } for p in owned_projects[:5]]
                },
                "member": {
                    "total": member_projects.count(),
                    "as_manager": member_projects.filter(members__rating="manager").count(),
                    "as_member": member_projects.filter(members__rating="member").count(),
                    "recent": [{
                        "id": p.id,
                        "name": p.name,
                        "role": p.members.filter(user=user).first().rating,
                        "joined": p.members.filter(user=user).first().created.strftime("%Y-%m-%d")
                    } for p in member_projects[:5]]
                },
                "recent_activity": [{
                    "id": p.id,
                    "name": p.name,
                    "updated": p.updated.strftime("%Y-%m-%d %H:%M"),
                    "is_owner": p.user == user
                } for p in recent_projects]
            }
            
            # 활동 통계
            stats_data = {
                "total_projects": owned_projects.count() + member_projects.count(),
                "active_projects": self._get_active_projects_count(user),
                "completed_projects": self._get_completed_projects_count(user),
                "total_collaborators": self._get_collaborators_count(user),
            }
            
            # 최근 메모
            recent_memos = models.UserMemo.objects.filter(
                user=user
            ).order_by('-created')[:5]
            
            memos_data = [{
                "id": memo.id,
                "content": memo.content[:100] + "..." if len(memo.content) > 100 else memo.content,
                "created": memo.created.strftime("%Y-%m-%d %H:%M")
            } for memo in recent_memos]
            
            return JsonResponse({
                "status": "success",
                "data": {
                    "profile": profile_data,
                    "projects": projects_data,
                    "stats": stats_data,
                    "recent_memos": memos_data
                }
            }, status=200)
            
        except Exception as e:
            logger.error(f"MyPage view error: {str(e)}")
            return JsonResponse({
                "message": "마이페이지 정보를 가져오는데 실패했습니다."
            }, status=500)
    
    def _get_project_status(self, project):
        """프로젝트 상태 확인"""
        now = timezone.now()
        
        # 모든 프로세스가 완료되었는지 확인
        if hasattr(project, 'video_delivery') and project.video_delivery.end_date:
            if project.video_delivery.end_date < now:
                return "completed"
        
        # 시작 전인지 확인
        if hasattr(project, 'basic_plan') and project.basic_plan.start_date:
            if project.basic_plan.start_date > now:
                return "planned"
        
        return "in_progress"
    
    def _get_active_projects_count(self, user):
        """진행 중인 프로젝트 수"""
        active_count = 0
        all_projects = Project.objects.filter(
            Q(user=user) | Q(members__user=user)
        ).distinct()
        
        for project in all_projects:
            if self._get_project_status(project) == "in_progress":
                active_count += 1
        
        return active_count
    
    def _get_completed_projects_count(self, user):
        """완료된 프로젝트 수"""
        completed_count = 0
        all_projects = Project.objects.filter(
            Q(user=user) | Q(members__user=user)
        ).distinct()
        
        for project in all_projects:
            if self._get_project_status(project) == "completed":
                completed_count += 1
        
        return completed_count
    
    def _get_collaborators_count(self, user):
        """협업한 사용자 수"""
        # 내가 소유한 프로젝트의 멤버들
        my_project_members = models.User.objects.filter(
            members__project__user=user
        ).distinct()
        
        # 내가 멤버로 참여한 프로젝트의 소유자와 다른 멤버들
        collaborated_users = models.User.objects.filter(
            Q(projects__members__user=user) |  # 프로젝트 소유자
            Q(members__project__members__user=user)  # 같은 프로젝트의 다른 멤버
        ).exclude(id=user.id).distinct()
        
        total_collaborators = (my_project_members | collaborated_users).distinct().count()
        
        return total_collaborators


class UserActivityView(View):
    """사용자 활동 내역"""
    
    @user_validator
    def get(self, request):
        """사용자의 최근 활동 내역 조회"""
        try:
            user = request.user
            days = int(request.GET.get('days', 30))  # 기본 30일
            
            start_date = timezone.now() - timedelta(days=days)
            
            # 프로젝트 생성 활동
            created_projects = Project.objects.filter(
                user=user,
                created__gte=start_date
            ).values('id', 'name', 'created')
            
            # 프로젝트 참여 활동
            joined_projects = Members.objects.filter(
                user=user,
                created__gte=start_date
            ).select_related('project').values(
                'project__id', 'project__name', 'created', 'rating'
            )
            
            # 메모 작성 활동
            created_memos = models.UserMemo.objects.filter(
                user=user,
                created__gte=start_date
            ).values('id', 'created')
            
            # 활동 내역 통합
            activities = []
            
            for project in created_projects:
                activities.append({
                    "type": "project_created",
                    "description": f"프로젝트 '{project['name']}' 생성",
                    "date": project['created'].strftime("%Y-%m-%d %H:%M"),
                    "project_id": project['id']
                })
            
            for join in joined_projects:
                role = "관리자" if join['rating'] == "manager" else "멤버"
                activities.append({
                    "type": "project_joined",
                    "description": f"프로젝트 '{join['project__name']}'에 {role}로 참여",
                    "date": join['created'].strftime("%Y-%m-%d %H:%M"),
                    "project_id": join['project__id']
                })
            
            for memo in created_memos:
                activities.append({
                    "type": "memo_created",
                    "description": "메모 작성",
                    "date": memo['created'].strftime("%Y-%m-%d %H:%M"),
                    "memo_id": memo['id']
                })
            
            # 날짜순 정렬
            activities.sort(key=lambda x: x['date'], reverse=True)
            
            return JsonResponse({
                "status": "success",
                "activities": activities[:50],  # 최대 50개
                "total": len(activities),
                "period_days": days
            }, status=200)
            
        except Exception as e:
            logger.error(f"User activity error: {str(e)}")
            return JsonResponse({
                "message": "활동 내역을 가져오는데 실패했습니다."
            }, status=500)


class UserPreferencesView(View):
    """사용자 설정"""
    
    @user_validator
    def get(self, request):
        """사용자 설정 조회"""
        try:
            user = request.user
            
            # 사용자 설정 (확장 가능)
            preferences = {
                "notifications": {
                    "email": True,  # 이메일 알림
                    "project_updates": True,  # 프로젝트 업데이트 알림
                    "member_invites": True,  # 멤버 초대 알림
                },
                "privacy": {
                    "show_email": False,  # 이메일 공개 여부
                    "show_projects": True,  # 프로젝트 목록 공개 여부
                },
                "display": {
                    "language": "ko",  # 언어 설정
                    "timezone": "Asia/Seoul",  # 시간대
                }
            }
            
            return JsonResponse({
                "status": "success",
                "preferences": preferences
            }, status=200)
            
        except Exception as e:
            logger.error(f"User preferences error: {str(e)}")
            return JsonResponse({
                "message": "설정을 가져오는데 실패했습니다."
            }, status=500)
    
    @user_validator
    def post(self, request):
        """사용자 설정 업데이트"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            # 여기서는 간단한 예시만 제공
            # 실제로는 UserPreference 모델을 만들어서 저장
            
            return JsonResponse({
                "status": "success",
                "message": "설정이 업데이트되었습니다."
            }, status=200)
            
        except Exception as e:
            logger.error(f"Update preferences error: {str(e)}")
            return JsonResponse({
                "message": "설정 업데이트에 실패했습니다."
            }, status=500)