from django.urls import path
from . import views

app_name = 'feedbacks'

urlpatterns = [
    # 전체 피드백 목록 (테스트용)
    path('', views.FeedbackListView.as_view(), name='feedback-list'),
    
    # 프로젝트별 피드백 목록 및 생성
    path('projects/<int:project_id>/feedbacks/', 
         views.ProjectFeedbackListView.as_view(), 
         name='project-feedbacks'),
    
    # 피드백 상세 조회, 수정, 삭제
    path('feedbacks/<int:feedback_id>/', 
         views.FeedbackDetailView.as_view(), 
         name='feedback-detail'),
    
    # 피드백 메시지 추가
    path('feedbacks/<int:feedback_id>/messages/', 
         views.FeedbackMessageView.as_view(), 
         name='feedback-messages'),
    
    # 피드백 코멘트 관리
    path('projects/<int:project_id>/feedbacks/<int:feedback_id>/comments/', 
         views.FeedbackCommentView.as_view(), 
         name='feedback-comments'),
    path('projects/<int:project_id>/feedbacks/<int:feedback_id>/comments/<int:comment_id>/', 
         views.FeedbackCommentView.as_view(), 
         name='feedback-comment-detail'),
    
    # 비디오 업로드 관련
    path('projects/<int:project_id>/feedbacks/upload/init/', 
         views.VideoUploadInitView.as_view(), 
         name='upload-init'),
    path('projects/<int:project_id>/feedbacks/upload/chunk/', 
         views.VideoUploadChunkView.as_view(), 
         name='upload-chunk'),
    path('projects/<int:project_id>/feedbacks/upload/complete/', 
         views.VideoUploadCompleteView.as_view(), 
         name='upload-complete'),
    
    # 인코딩 상태 및 스트리밍
    path('projects/<int:project_id>/feedbacks/<int:feedback_id>/encoding-status/', 
         views.FeedbackEncodingStatusView.as_view(), 
         name='encoding-status'),
    path('projects/<int:project_id>/feedbacks/<int:feedback_id>/stream/', 
         views.FeedbackStreamView.as_view(), 
         name='feedback-stream'),
    
    # 하위 호환성을 위한 기존 경로 (점진적 마이그레이션)
    path('<int:id>', views.FeedbackDetail.as_view(), name='feedback-detail-legacy'),
]