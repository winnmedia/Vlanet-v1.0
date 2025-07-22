import logging
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from users.decorators import admin_required
from users import models as user_models
from projects import models as project_models
from feedbacks import models as feedback_models
from video_planning import models as planning_models
from django.db.models import Avg, Sum, Max, Min
import json

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(admin_required, name='dispatch')
class AdminDashboardStats(View):
    """관리자 대시보드 통계 API"""
    
    def get(self, request):
        try:
            # 현재 시간
            now = timezone.now()
            
            # 사용자 통계
            total_users = user_models.User.objects.count()
            active_users = user_models.User.objects.filter(
                last_login__gte=now - timedelta(days=30)
            ).count()
            
            # 로그인 방식별 통계
            login_methods = user_models.User.objects.values('login_method').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # 프로젝트 통계
            total_projects = project_models.Project.objects.count()
            active_projects = project_models.Project.objects.filter(
                updated__gte=now - timedelta(days=30)
            ).count()
            
            # 최근 가입자 (7일)
            recent_users = user_models.User.objects.filter(
                date_joined__gte=now - timedelta(days=7)
            ).count()
            
            # 일별 가입자 추이 (최근 30일)
            daily_signups = []
            for i in range(30):
                date = now - timedelta(days=i)
                count = user_models.User.objects.filter(
                    date_joined__date=date.date()
                ).count()
                daily_signups.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'count': count
                })
            
            # 피드백 통계
            total_feedbacks = feedback_models.Feedback.objects.count()
            pending_feedbacks = feedback_models.Feedback.objects.filter(
                is_read=False
            ).count()
            
            # 영상 기획 통계
            total_planning = planning_models.VideoPlanningProject.objects.count()
            completed_planning = planning_models.VideoPlanningProject.objects.filter(
                status='completed'
            ).count()
            
            # 프로젝트 단계별 통계
            project_phases = project_models.Project.objects.values('production_phase').annotate(
                count=Count('id')
            ).order_by('production_phase')
            
            # 월별 프로젝트 생성 추이 (최근 6개월)
            monthly_projects = []
            for i in range(6):
                start_date = now.replace(day=1) - timedelta(days=30*i)
                end_date = (start_date + timedelta(days=32)).replace(day=1)
                count = project_models.Project.objects.filter(
                    created__gte=start_date,
                    created__lt=end_date
                ).count()
                monthly_projects.append({
                    'month': start_date.strftime('%Y-%m'),
                    'count': count
                })
            
            # 평균 프로젝트 멤버 수
            avg_members = project_models.Members.objects.values('project').annotate(
                member_count=Count('user')
            ).aggregate(avg=Avg('member_count'))['avg'] or 0
            
            stats = {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'recent': recent_users,
                    'by_login_method': list(login_methods)
                },
                'projects': {
                    'total': total_projects,
                    'active': active_projects,
                    'by_phase': list(project_phases),
                    'avg_members': round(avg_members, 1)
                },
                'feedbacks': {
                    'total': total_feedbacks,
                    'pending': pending_feedbacks
                },
                'planning': {
                    'total': total_planning,
                    'completed': completed_planning
                },
                'trends': {
                    'daily_signups': daily_signups,
                    'monthly_projects': monthly_projects
                }
            }
            
            return JsonResponse({
                'status': 'success',
                'data': stats
            })
            
        except Exception as e:
            logger.error(f"Admin dashboard stats error: {str(e)}")
            return JsonResponse({
                'error': '통계 데이터를 불러오는 중 오류가 발생했습니다.'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(admin_required, name='dispatch')
class AdminUserList(View):
    """관리자 사용자 목록 API"""
    
    def get(self, request):
        try:
            # 페이지네이션
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 20))
            
            # 검색
            search = request.GET.get('search', '')
            
            # 필터링
            login_method = request.GET.get('login_method', '')
            is_active = request.GET.get('is_active', '')
            
            # 쿼리셋 생성
            queryset = user_models.User.objects.all()
            
            # 검색 적용
            if search:
                queryset = queryset.filter(
                    Q(username__icontains=search) |
                    Q(nickname__icontains=search)
                )
            
            # 필터 적용
            if login_method:
                queryset = queryset.filter(login_method=login_method)
            
            if is_active:
                is_active = is_active.lower() == 'true'
                queryset = queryset.filter(is_active=is_active)
            
            # 총 개수
            total = queryset.count()
            
            # 페이지네이션 적용
            start = (page - 1) * per_page
            end = start + per_page
            users = queryset[start:end]
            
            # 사용자 데이터 직렬화
            user_list = []
            for user in users:
                user_list.append({
                    'id': user.id,
                    'username': user.username,
                    'nickname': user.nickname,
                    'login_method': user.login_method,
                    'is_active': user.is_active,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'projects_count': user.projects.count()
                })
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'users': user_list,
                    'pagination': {
                        'total': total,
                        'page': page,
                        'per_page': per_page,
                        'total_pages': (total + per_page - 1) // per_page
                    }
                }
            })
            
        except Exception as e:
            logger.error(f"Admin user list error: {str(e)}")
            return JsonResponse({
                'error': '사용자 목록을 불러오는 중 오류가 발생했습니다.'
            }, status=500)
    
    def patch(self, request):
        """사용자 상태 업데이트"""
        try:
            import json
            data = json.loads(request.body)
            user_id = data.get('user_id')
            action = data.get('action')
            
            if not user_id or not action:
                return JsonResponse({
                    'error': '필수 파라미터가 누락되었습니다.'
                }, status=400)
            
            user = user_models.User.objects.get(id=user_id)
            
            if action == 'toggle_active':
                user.is_active = not user.is_active
                user.save()
                message = f"사용자 {user.username}의 활성 상태가 변경되었습니다."
            
            elif action == 'reset_password':
                # 임시 비밀번호 생성 및 이메일 발송
                # TODO: 구현 필요
                message = "비밀번호 재설정 이메일이 발송되었습니다."
            
            else:
                return JsonResponse({
                    'error': '유효하지 않은 액션입니다.'
                }, status=400)
            
            logger.info(f"Admin action: {action} for user {user_id} by {request.user.username}")
            
            return JsonResponse({
                'status': 'success',
                'message': message
            })
            
        except user_models.User.DoesNotExist:
            return JsonResponse({
                'error': '사용자를 찾을 수 없습니다.'
            }, status=404)
        except Exception as e:
            logger.error(f"Admin user update error: {str(e)}")
            return JsonResponse({
                'error': '사용자 정보 업데이트 중 오류가 발생했습니다.'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(admin_required, name='dispatch')
class AdminProjectList(View):
    """관리자 프로젝트 목록 API"""
    
    def get(self, request):
        try:
            # 페이지네이션
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 20))
            
            # 검색
            search = request.GET.get('search', '')
            
            # 필터링
            production_phase = request.GET.get('production_phase', '')
            status = request.GET.get('status', '')
            
            # 쿼리셋 생성
            queryset = project_models.Project.objects.all().order_by('-created')
            
            # 검색 적용
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(manager__icontains=search) |
                    Q(owner_nickname__icontains=search)
                )
            
            # 필터 적용
            if production_phase:
                queryset = queryset.filter(production_phase=production_phase)
            
            if status == 'active':
                queryset = queryset.filter(
                    updated__gte=timezone.now() - timedelta(days=30)
                )
            elif status == 'inactive':
                queryset = queryset.filter(
                    updated__lt=timezone.now() - timedelta(days=30)
                )
            
            # 총 개수
            total = queryset.count()
            
            # 페이지네이션 적용
            start = (page - 1) * per_page
            end = start + per_page
            projects = queryset[start:end]
            
            # 프로젝트 데이터 직렬화
            project_list = []
            for project in projects:
                member_count = project.members.count() + 1  # +1 for owner
                feedback_count = project.feedbacks.count()
                
                project_list.append({
                    'id': project.id,
                    'name': project.name,
                    'manager': project.manager,
                    'owner_nickname': project.owner_nickname,
                    'production_phase': project.production_phase,
                    'color': project.color,
                    'member_count': member_count,
                    'feedback_count': feedback_count,
                    'created': project.created.isoformat(),
                    'updated': project.updated.isoformat(),
                    'is_active': project.updated >= timezone.now() - timedelta(days=30)
                })
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'projects': project_list,
                    'pagination': {
                        'total': total,
                        'page': page,
                        'per_page': per_page,
                        'total_pages': (total + per_page - 1) // per_page
                    }
                }
            })
            
        except Exception as e:
            logger.error(f"Admin project list error: {str(e)}")
            return JsonResponse({
                'error': '프로젝트 목록을 불러오는 중 오류가 발생했습니다.'
            }, status=500)
    
    def delete(self, request):
        """프로젝트 삭제"""
        try:
            data = json.loads(request.body)
            project_id = data.get('project_id')
            
            if not project_id:
                return JsonResponse({
                    'error': '프로젝트 ID가 필요합니다.'
                }, status=400)
            
            project = project_models.Project.objects.get(id=project_id)
            project_name = project.name
            
            # 관련 데이터도 삭제 (CASCADE)
            project.delete()
            
            logger.info(f"Admin deleted project: {project_name} (ID: {project_id}) by {request.user.username}")
            
            return JsonResponse({
                'status': 'success',
                'message': f'프로젝트 "{project_name}"가 삭제되었습니다.'
            })
            
        except project_models.Project.DoesNotExist:
            return JsonResponse({
                'error': '프로젝트를 찾을 수 없습니다.'
            }, status=404)
        except Exception as e:
            logger.error(f"Admin project delete error: {str(e)}")
            return JsonResponse({
                'error': '프로젝트 삭제 중 오류가 발생했습니다.'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(admin_required, name='dispatch')
class AdminFeedbackStats(View):
    """관리자 피드백 통계 API"""
    
    def get(self, request):
        try:
            # 전체 피드백 통계
            total_feedbacks = feedback_models.Feedback.objects.count()
            unread_feedbacks = feedback_models.Feedback.objects.filter(is_read=False).count()
            
            # 프로젝트별 피드백 통계
            feedbacks_by_project = feedback_models.Feedback.objects.values(
                'project__name', 'project__id'
            ).annotate(
                total=Count('id'),
                unread=Count('id', filter=Q(is_read=False))
            ).order_by('-total')[:10]
            
            # 최근 피드백 (7일)
            recent_date = timezone.now() - timedelta(days=7)
            recent_feedbacks = feedback_models.Feedback.objects.filter(
                created__gte=recent_date
            ).order_by('-created')[:20]
            
            recent_list = []
            for feedback in recent_feedbacks:
                recent_list.append({
                    'id': feedback.id,
                    'project_name': feedback.project.name if feedback.project else 'Unknown',
                    'content': feedback.content[:100] + '...' if len(feedback.content) > 100 else feedback.content,
                    'is_read': feedback.is_read,
                    'created': feedback.created.isoformat()
                })
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'total': total_feedbacks,
                    'unread': unread_feedbacks,
                    'by_project': list(feedbacks_by_project),
                    'recent': recent_list
                }
            })
            
        except Exception as e:
            logger.error(f"Admin feedback stats error: {str(e)}")
            return JsonResponse({
                'error': '피드백 통계를 불러오는 중 오류가 발생했습니다.'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(admin_required, name='dispatch')
class AdminSystemInfo(View):
    """시스템 정보 API"""
    
    def get(self, request):
        try:
            from django.conf import settings
            import sys
            import django
            
            # 데이터베이스 크기 (대략적)
            db_size = {
                'users': user_models.User.objects.count(),
                'projects': project_models.Project.objects.count(),
                'feedbacks': feedback_models.Feedback.objects.count(),
                'planning': planning_models.VideoPlanningProject.objects.count()
            }
            
            # 스토리지 사용량 (미디어 파일)
            media_count = feedback_models.FeedbackFiles.objects.count()
            
            # 시스템 정보
            system_info = {
                'django_version': django.__version__,
                'python_version': sys.version.split()[0],
                'debug_mode': settings.DEBUG,
                'allowed_hosts': settings.ALLOWED_HOSTS,
                'time_zone': settings.TIME_ZONE,
                'database': {
                    'engine': settings.DATABASES['default']['ENGINE'].split('.')[-1],
                    'tables': db_size,
                    'total_records': sum(db_size.values())
                },
                'media': {
                    'total_files': media_count
                }
            }
            
            return JsonResponse({
                'status': 'success',
                'data': system_info
            })
            
        except Exception as e:
            logger.error(f"Admin system info error: {str(e)}")
            return JsonResponse({
                'error': '시스템 정보를 불러오는 중 오류가 발생했습니다.'
            }, status=500)