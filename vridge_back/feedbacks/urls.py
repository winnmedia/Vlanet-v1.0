from django.urls import path
from . import views
from . import views_api
from . import views_guest
# from . import views_redirect

urlpatterns = [
    # 기존 API (하위 호환성 유지)
    path("<int:id>", views.FeedbackDetail.as_view()),
    path("file/<int:id>", views.FeedbackFileDelete.as_view()),
    path("encoding-status/<int:id>", views.VideoEncodingStatus.as_view()),
    
    # 새로운 API 추가
    path("<int:feedback_id>/replies", views_api.FeedbackReply.as_view()),
    path("<int:feedback_id>/replies/<int:reply_id>", views_api.FeedbackReplyDetail.as_view()),
    path("<int:feedback_id>/toggle-important", views_api.FeedbackToggleImportant.as_view()),
    path("<int:feedback_id>/reaction", views_api.FeedbackReactionView.as_view()),
    
    # 게스트 피드백 API
    path("guest/session/create/", views_guest.GuestSessionCreate.as_view()),
    path("guest/<int:id>", views_guest.GuestFeedbackDetail.as_view()),
    
    # 리다이렉트 경로 (프론트엔드가 점진적으로 이동할 수 있도록)
    # path("<int:id>/redirect", views_redirect.FeedbackRedirect.as_view()),
]
