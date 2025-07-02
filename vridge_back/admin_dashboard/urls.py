from django.urls import path
from . import views

urlpatterns = [
    path('dashboard', views.AdminDashboard.as_view()),
    path('users', views.AdminUserList.as_view()),
    path('users/<int:user_id>', views.AdminUserDetail.as_view()),
    path('projects', views.AdminProjectList.as_view()),
]