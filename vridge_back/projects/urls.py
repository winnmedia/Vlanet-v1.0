from django.urls import path
from . import views

app_name = "projects"

urlpatterns = [
    path("project_list", views.ProjectList.as_view()),
    path(
        "invite_project/<int:project_id>", views.InviteMember.as_view()
    ),  # 초대 보내기, 초대 취소
    path(
        "invite/<str:uid>/<str:token>", views.AcceptInvite.as_view(), name="invite"
    ),  # 초대 받기
    path("create", views.CreateProject.as_view()),
    path(
        "detail/<int:project_id>", views.ProjectDetail.as_view()
    ),  # get,update, delete
    path("file/delete/<int:file_id>", views.ProjectFile.as_view()),
    path("memo/<int:id>", views.ProjectMemo.as_view()),  # 프로젝트 메모
    path("date_update/<int:id>", views.ProjectDate.as_view()),  # 프로젝트 날짜변경
]
