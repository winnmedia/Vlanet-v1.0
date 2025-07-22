from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('stats/', views.AdminDashboardStats.as_view(), name='stats'),
    path('users/', views.AdminUserList.as_view(), name='users'),
    path('projects/', views.AdminProjectList.as_view(), name='projects'),
    path('feedbacks/', views.AdminFeedbackStats.as_view(), name='feedbacks'),
    path('system/', views.AdminSystemInfo.as_view(), name='system'),
]