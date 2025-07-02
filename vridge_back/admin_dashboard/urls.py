from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('stats/', views.dashboard_stats, name='stats'),
    path('', views.admin_dashboard, name='dashboard'),
]