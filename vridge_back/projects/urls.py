from django.urls import path
from . import views
from . import views_improved
from . import views_fixed
from . import views_safe
from . import views_idempotent
from . import views_idempotent_fixed
from . import views_ultra_safe
from . import views_idempotent_final
from . import views_atomic
from . import views_fixed_final

app_name = "projects"

urlpatterns = [
    path("", views.ProjectList.as_view()),  # GET /api/projects/
    path("project_list/", views.ProjectList.as_view()),  # 기존 경로 호환성
    path(
        "invite_project/<int:project_id>", views.InviteMember.as_view()
    ),  # 초대 보내기, 초대 취소
    path(
        "invite/<str:uid>/<str:token>", views.AcceptInvite.as_view(), name="invite"
    ),  # 초대 받기
    # 최종 수정된 안전한 프로젝트 생성 (권장)
    path("create/", views_fixed_final.CreateProjectFixedFinal.as_view()),  # 최종 수정 버전 (권장)
    path("atomic-create/", views_atomic.AtomicProjectCreate.as_view()),  # 원자적 생성 (백업)
    path("create_idempotent", views_idempotent_final.CreateProjectIdempotentFinal.as_view()),  # 기존 멱등성 버전 (백업)
    
    # 이전 버전들 (백업)
    path("create_safe", views_safe.CreateProjectSafe.as_view()),  # FeedBack 없이 안전하게 작동
    path("create_original", views.CreateProject.as_view()),  # 원본 버전
    path("create_ultra_safe", views_ultra_safe.CreateProjectUltraSafe.as_view()),  # 진단용 초안전 버전
    
    # 개선된 프로젝트 생성 엔드포인트 (디버깅용)
    path("create_improved", views_improved.CreateProjectImproved.as_view()),
    path("debug_info", views_improved.ProjectDebugInfo.as_view()),
    
    path(
        "detail/<int:project_id>/", views.ProjectDetail.as_view()
    ),  # get,update, delete
    path("file/delete/<int:file_id>", views.ProjectFile.as_view()),
    path("memo/<int:id>", views.ProjectMemo.as_view()),  # 프로젝트 메모
    path("date_update/<int:id>", views.ProjectDate.as_view()),  # 프로젝트 날짜변경
]
