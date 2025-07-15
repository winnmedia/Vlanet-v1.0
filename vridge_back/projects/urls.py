from django.urls import path
from . import views
# 아래 모듈들은 아직 구현되지 않음
# from . import views_improved
# from . import views_fixed
# from . import views_safe
# from . import views_idempotent
# from . import views_idempotent_fixed
# from . import views_ultra_safe
# from . import views_idempotent_final
# from . import views_atomic
# from . import views_fixed_final
# from . import views_column_safe

app_name = "projects"

urlpatterns = [
    path("", views.ProjectList.as_view()),  # GET /api/projects/
    path("project_list/", views.ProjectList.as_view()),  # 기존 경로 호환성
    path(
        "invite_project/<int:project_id>", views.InviteMember.as_view()
    ),  # 초대 보내기, 초대 취소
    path(
        "invite/<str:uid>/<str:token>/", views.LegacyInviteRedirect.as_view(), name="legacy_invite"
    ),  # 초대 받기
    # 프로젝트 생성 - 기본 버전 사용
    path("create/", views.CreateProject.as_view()),  # 기본 프로젝트 생성
    
    # 아래는 구현 예정
    # path("create_fixed/", views_fixed_final.CreateProjectFixedFinal.as_view()),  # 이전 수정 버전
    # path("atomic-create/", views_atomic.AtomicProjectCreate.as_view()),  # 원자적 생성 (백업)
    # path("create_idempotent", views_idempotent_final.CreateProjectIdempotentFinal.as_view()),  # 기존 멱등성 버전 (백업)
    # path("create_safe", views_safe.CreateProjectSafe.as_view()),  # FeedBack 없이 안전하게 작동
    # path("create_ultra_safe", views_ultra_safe.CreateProjectUltraSafe.as_view()),  # 진단용 초안전 버전
    # path("create_improved", views_improved.CreateProjectImproved.as_view()),
    # path("debug_info", views_improved.ProjectDebugInfo.as_view()),
    
    path(
        "detail/<int:project_id>/", views.ProjectDetail.as_view()
    ),  # get,update, delete
    path("file/delete/<int:file_id>", views.ProjectFile.as_view()),
    path("memo/<int:id>", views.ProjectMemo.as_view()),  # 프로젝트 메모
    path("date_update/<int:id>", views.ProjectDate.as_view()),  # 프로젝트 날짜변경
    
    # 프로젝트 하위 리소스로 피드백 제공
    path("<int:project_id>/feedback/", views.ProjectFeedback.as_view()),  # 프로젝트의 피드백 조회/생성
    path("<int:project_id>/feedback/comments/", views.ProjectFeedbackComments.as_view()),  # 피드백 코멘트 목록/작성
    path("<int:project_id>/feedback/upload/", views.ProjectFeedbackUpload.as_view()),  # 피드백 파일 업로드
    path("<int:project_id>/feedback/encoding-status/", views.ProjectFeedbackEncodingStatus.as_view()),  # 인코딩 상태 확인
    
    # 프로젝트 초대 관련
    path("<int:project_id>/invitations/", views.ProjectInvitation.as_view()),  # 프로젝트 초대 생성/조회
    path("invitations/", views.ProjectInvitation.as_view()),  # 사용자의 모든 초대 조회
    path("invitations/token/<str:token>/", views.InvitationToken.as_view()),  # 토큰으로 초대 정보 조회
    path("invitations/<int:invitation_id>/response/", views.InvitationResponse.as_view()),  # 초대 수락/거절
    
    # 기획안 디벨롭 프레임워크 관련
    path("frameworks/", views.DevelopmentFrameworkList.as_view()),  # 프레임워크 목록 조회/생성
    path("frameworks/<int:framework_id>/", views.DevelopmentFrameworkDetail.as_view()),  # 프레임워크 상세/수정/삭제
    path("frameworks/<int:framework_id>/set-default/", views.SetDefaultFramework.as_view()),  # 기본 프레임워크 설정
]
