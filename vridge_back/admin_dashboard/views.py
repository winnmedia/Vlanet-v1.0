"""
관리자 대시보드 뷰
"""
import json
from django.views import View
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from users.models import User
from projects.models import Project
from users.utils import user_validator


@method_decorator(staff_member_required, name='dispatch')
class AdminDashboard(View):
    """관리자 대시보드 메인"""
    
    def get(self, request):
        try:
            # 기본 통계
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            total_projects = Project.objects.count()
            
            # 최근 7일간 가입자 수
            seven_days_ago = timezone.now() - timedelta(days=7)
            recent_signups = User.objects.filter(
                date_joined__gte=seven_days_ago
            ).count()
            
            # 로그인 방식별 사용자 수
            login_methods = User.objects.values('login_method').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # 프로젝트 통계
            projects_by_month = []
            for i in range(6):
                month_start = timezone.now() - timedelta(days=30 * (5 - i))
                month_end = month_start + timedelta(days=30)
                count = Project.objects.filter(
                    created__gte=month_start,
                    created__lt=month_end
                ).count()
                projects_by_month.append({
                    'month': month_start.strftime('%Y-%m'),
                    'count': count
                })
            
            dashboard_data = {
                'overview': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'total_projects': total_projects,
                    'recent_signups': recent_signups
                },
                'login_methods': list(login_methods),
                'projects_by_month': projects_by_month
            }
            
            return JsonResponse({
                'status': 'success',
                'data': dashboard_data
            }, status=200)
            
        except Exception as e:
            return JsonResponse({
                'message': f'대시보드 로드 중 오류 발생: {str(e)}'
            }, status=500)


@method_decorator(staff_member_required, name='dispatch')
class AdminUserList(View):
    """관리자 사용자 목록"""
    
    def get(self, request):
        try:
            # 페이지네이션
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            search = request.GET.get('search', '')
            login_method = request.GET.get('login_method', '')
            
            # 쿼리셋 생성
            users = User.objects.all()
            
            # 검색 필터
            if search:
                users = users.filter(
                    Q(username__icontains=search) |
                    Q(nickname__icontains=search) |
                    Q(email__icontains=search)
                )
            
            # 로그인 방식 필터
            if login_method:
                users = users.filter(login_method=login_method)
            
            # 정렬
            users = users.order_by('-date_joined')
            
            # 전체 개수
            total_count = users.count()
            
            # 페이지네이션
            start = (page - 1) * page_size
            end = start + page_size
            users_page = users[start:end]
            
            # 사용자 데이터 직렬화
            users_data = []
            for user in users_page:
                users_data.append({
                    'id': user.id,
                    'email': user.username,
                    'nickname': user.nickname or user.username,
                    'login_method': user.login_method,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M'),
                    'last_login': user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else None,
                    'projects_count': user.projects.count(),
                    'member_projects_count': user.members.count()
                })
            
            return JsonResponse({
                'status': 'success',
                'users': users_data,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            }, status=200)
            
        except Exception as e:
            return JsonResponse({
                'message': f'사용자 목록 조회 중 오류 발생: {str(e)}'
            }, status=500)


@method_decorator(staff_member_required, name='dispatch')
class AdminProjectList(View):
    """관리자 프로젝트 목록"""
    
    def get(self, request):
        try:
            # 페이지네이션
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            search = request.GET.get('search', '')
            
            # 쿼리셋 생성
            projects = Project.objects.select_related(
                'user', 'basic_plan', 'video_delivery'
            ).prefetch_related('members')
            
            # 검색 필터
            if search:
                projects = projects.filter(
                    Q(name__icontains=search) |
                    Q(manager__icontains=search) |
                    Q(consumer__icontains=search) |
                    Q(user__username__icontains=search)
                )
            
            # 정렬
            projects = projects.order_by('-created')
            
            # 전체 개수
            total_count = projects.count()
            
            # 페이지네이션
            start = (page - 1) * page_size
            end = start + page_size
            projects_page = projects[start:end]
            
            # 프로젝트 데이터 직렬화
            projects_data = []
            for project in projects_page:
                # 프로젝트 상태 계산
                now = timezone.now()
                if project.video_delivery.end_date and project.video_delivery.end_date < now:
                    status = 'completed'
                elif project.basic_plan.start_date and project.basic_plan.start_date > now:
                    status = 'planned'
                else:
                    status = 'in_progress'
                
                projects_data.append({
                    'id': project.id,
                    'name': project.name,
                    'manager': project.manager,
                    'consumer': project.consumer,
                    'owner_email': project.user.username,
                    'owner_nickname': project.user.nickname or project.user.username,
                    'status': status,
                    'members_count': project.members.count(),
                    'start_date': project.basic_plan.start_date.strftime('%Y-%m-%d') if project.basic_plan.start_date else None,
                    'end_date': project.video_delivery.end_date.strftime('%Y-%m-%d') if project.video_delivery.end_date else None,
                    'created': project.created.strftime('%Y-%m-%d %H:%M'),
                    'color': project.color
                })
            
            return JsonResponse({
                'status': 'success',
                'projects': projects_data,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            }, status=200)
            
        except Exception as e:
            return JsonResponse({
                'message': f'프로젝트 목록 조회 중 오류 발생: {str(e)}'
            }, status=500)


@method_decorator(staff_member_required, name='dispatch')
class AdminUserDetail(View):
    """관리자 사용자 상세 정보"""
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # 사용자 프로젝트 목록
            owned_projects = []
            for project in user.projects.all().order_by('-created')[:10]:
                owned_projects.append({
                    'id': project.id,
                    'name': project.name,
                    'created': project.created.strftime('%Y-%m-%d')
                })
            
            # 참여 프로젝트 목록
            member_projects = []
            for member in user.members.all().select_related('project').order_by('-id')[:10]:
                member_projects.append({
                    'id': member.project.id,
                    'name': member.project.name,
                    'rating': member.rating
                })
            
            user_detail = {
                'id': user.id,
                'email': user.username,
                'nickname': user.nickname or user.username,
                'login_method': user.login_method,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M'),
                'last_login': user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else None,
                'owned_projects': owned_projects,
                'member_projects': member_projects,
                'total_owned_projects': user.projects.count(),
                'total_member_projects': user.members.count()
            }
            
            return JsonResponse({
                'status': 'success',
                'user': user_detail
            }, status=200)
            
        except User.DoesNotExist:
            return JsonResponse({
                'message': '사용자를 찾을 수 없습니다.'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'message': f'사용자 정보 조회 중 오류 발생: {str(e)}'
            }, status=500)
    
    def post(self, request, user_id):
        """사용자 정보 수정 (관리자)"""
        try:
            user = User.objects.get(id=user_id)
            data = json.loads(request.body)
            
            # 활성화 상태 변경
            if 'is_active' in data:
                user.is_active = data['is_active']
            
            # 스태프 권한 변경
            if 'is_staff' in data:
                user.is_staff = data['is_staff']
            
            # 닉네임 변경
            if 'nickname' in data:
                user.nickname = data['nickname']
            
            user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': '사용자 정보가 수정되었습니다.'
            }, status=200)
            
        except User.DoesNotExist:
            return JsonResponse({
                'message': '사용자를 찾을 수 없습니다.'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'message': f'사용자 정보 수정 중 오류 발생: {str(e)}'
            }, status=500)