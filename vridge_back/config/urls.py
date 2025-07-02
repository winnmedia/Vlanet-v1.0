"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.models import Group
from .views import health_check, root_view
from .views_cors_test import cors_test_view, PublicProjectListView

# token_blacklist import를 보호
try:
    from rest_framework_simplejwt import token_blacklist
    HAS_TOKEN_BLACKLIST = True
except ImportError:
    HAS_TOKEN_BLACKLIST = False
    token_blacklist = None

urlpatterns = [
    path("", root_view, name="root"),  # 루트 경로
    path("health/", health_check, name="health"),  # 헬스체크
    path("cors-test/", cors_test_view, name="cors_test"),  # CORS 테스트
    path("public/projects/", PublicProjectListView.as_view(), name="public_projects"),  # 공개 프로젝트 목록
    path("admin/", admin.site.urls),
    path("admin-dashboard/", include("admin_dashboard.urls")),  # 관리자 대시보드
    path("users/", include("users.urls")),
    path("projects/", include("projects.urls")),
    path("feedbacks/", include("feedbacks.urls")),
    path("onlines/", include("onlines.urls")),
    # path("feedbacks/", include("feedbacks.routing")),
]

# Always serve media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# token_blacklist가 있을 때만 unregister
if HAS_TOKEN_BLACKLIST and token_blacklist:
    try:
        admin.site.unregister(token_blacklist.models.BlacklistedToken)
        admin.site.unregister(token_blacklist.models.OutstandingToken)
    except admin.sites.NotRegistered:
        pass

try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass

admin.site.site_title = "Vlanet 관리자"
admin.site.site_header = "Vlanet 관리 시스템"
admin.site.index_title = "대시보드"
