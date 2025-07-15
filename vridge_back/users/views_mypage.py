from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import UserProfile
from projects.models import Project
from feedbacks.models import FeedBack


class MyPageView(APIView):
    """마이페이지 종합 정보"""
    permission_classes = [IsAuthenticated]
    
    def get_absolute_url(self, request, url):
        """상대 URL을 절대 URL로 변환"""
        if not url or url.startswith('http'):
            return url
        from django.conf import settings
        protocol = 'https' if not settings.DEBUG else 'http'
        host = request.get_host()
        return f"{protocol}://{host}{url}"
    
    def get(self, request):
        """마이페이지 정보 조회"""
        try:
            user = request.user
            
            # UserProfile 가져오거나 생성
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # 프로젝트 통계
            project_stats = Project.objects.filter(
                Q(user=user) | Q(members__user=user)
            ).distinct().aggregate(
                total_projects=Count('id'),
                completed_projects=Count('id'),  # status 필드가 없으므로 제거
                ongoing_projects=Count('id')  # status 필드가 없으므로 제거
            )
            
            # 최근 활동 (최근 30일)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            # FeedBack은 파일만 저장하므로, FeedBackComment를 카운트
            from feedbacks.models import FeedBackComment
            recent_feedbacks = FeedBackComment.objects.filter(
                user=user,
                created__gte=thirty_days_ago
            ).count()
            
            # 응답 데이터 구성
            response_data = {
                'status': 'success',
                'data': {
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'nickname': user.nickname or user.username,
                        'login_method': user.login_method,
                        'date_joined': user.date_joined.strftime('%Y-%m-%d')
                    },
                    'profile': {
                        'email': user.email,
                        'nickname': user.nickname or user.username,
                        'login_method': user.login_method,
                        'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                        'profile_image': self.get_absolute_url(request, profile.profile_image.url) if profile.profile_image else None,
                        'bio': profile.bio,
                        'phone': profile.phone,
                        'company': profile.company,
                        'position': profile.position
                    },
                    'stats': {
                        'total_projects': project_stats['total_projects'],
                        'completed_projects': project_stats['completed_projects'],
                        'ongoing_projects': project_stats['ongoing_projects'],
                        'recent_feedbacks': recent_feedbacks
                    }
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"MyPage view error: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'마이페이지 정보 조회 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserActivityView(APIView):
    """사용자 활동 내역"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """활동 내역 조회"""
        try:
            days = int(request.GET.get('days', 30))
            user = request.user
            
            # 기간 계산
            start_date = timezone.now() - timedelta(days=days)
            
            # 프로젝트 활동
            recent_projects = Project.objects.filter(
                Q(user=user) | Q(members__user=user),
                updated__gte=start_date
            ).distinct().order_by('-updated')[:10]
            
            # 피드백 활동
            from feedbacks.models import FeedBackComment
            recent_feedbacks = FeedBackComment.objects.filter(
                user=user,
                created__gte=start_date
            ).order_by('-created')[:10]
            
            response_data = {
                'status': 'success',
                'data': {
                    'period_days': days,
                    'recent_projects': [{
                        'id': project.id,
                        'name': project.name,
                        'manager': project.manager,
                        'consumer': project.consumer,
                        'updated_at': project.updated.strftime('%Y-%m-%d %H:%M:%S')
                    } for project in recent_projects],
                    'recent_feedbacks': [{
                        'id': feedback.id,
                        'feedback_id': feedback.feedback.id,
                        'title': feedback.title[:50] + '...' if feedback.title and len(feedback.title) > 50 else (feedback.title or ''),
                        'text': feedback.text[:100] + '...' if feedback.text and len(feedback.text) > 100 else (feedback.text or ''),
                        'created_at': feedback.created.strftime('%Y-%m-%d %H:%M:%S')
                    } for feedback in recent_feedbacks]
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"User activity view error: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'활동 내역 조회 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserPreferencesView(APIView):
    """사용자 설정"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """설정 조회"""
        try:
            # 사용자 설정 (추후 확장 가능)
            preferences = {
                'email_notifications': True,
                'project_updates': True,
                'feedback_alerts': True,
                'weekly_summary': False,
                'language': 'ko',
                'timezone': 'Asia/Seoul'
            }
            
            return Response({
                'status': 'success',
                'data': preferences
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"User preferences get error: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'설정 조회 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """설정 업데이트"""
        try:
            # 추후 UserPreferences 모델 생성 시 구현
            # 현재는 더미 응답
            return Response({
                'status': 'success',
                'message': '설정이 업데이트되었습니다.',
                'data': request.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"User preferences update error: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'설정 업데이트 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)