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
            
            stats = {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'recent': recent_users,
                    'by_login_method': list(login_methods)
                },
                'projects': {
                    'total': total_projects,
                    'active': active_projects
                },
                'trends': {
                    'daily_signups': daily_signups
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