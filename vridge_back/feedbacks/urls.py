from django.urls import path
from . import views
# from . import views_redirect

urlpatterns = [
    # 기존 API (하위 호환성 유지)
    path("<int:id>", views.FeedbackDetail.as_view()),
    path("file/<int:id>", views.FeedbackFileDelete.as_view()),
    path("encoding-status/<int:id>", views.VideoEncodingStatus.as_view()),
    
    # 새로운 메시지 관리 API
    path("messages/<int:message_id>/", views.FeedbackMessageUpdate.as_view()),
    path("messages/<int:message_id>/status/", views.FeedbackMessageStatusUpdate.as_view()),
    
    # 리다이렉트 경로 (프론트엔드가 점진적으로 이동할 수 있도록)
    # path("<int:id>/redirect", views_redirect.FeedbackRedirect.as_view()),
]
