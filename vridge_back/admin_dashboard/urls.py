from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('stats/', views.AdminDashboardStats.as_view(), name='stats'),
    path('users/', views.AdminUserList.as_view(), name='users'),
]