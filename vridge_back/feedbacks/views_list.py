"""
피드백 목록 뷰
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import FeedBack as Feedback
from .serializers import FeedBackSerializer as FeedbackSerializer

class FeedbackListView(generics.ListAPIView):
    """
    전체 피드백 목록 조회 (테스트용)
    """
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """
        사용자가 접근 가능한 피드백만 반환
        """
        if self.request.user.is_authenticated:
            # 로그인한 사용자는 자신의 프로젝트 피드백만
            return Feedback.objects.filter(
                project__members=self.request.user
            ).select_related('project', 'user').distinct()
        else:
            # 비로그인 사용자는 빈 목록
            return Feedback.objects.none()
    
    def list(self, request, *args, **kwargs):
        """
        빈 목록이라도 항상 200 응답
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })