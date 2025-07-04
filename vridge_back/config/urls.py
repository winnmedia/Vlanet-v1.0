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
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.models import Group
from django.shortcuts import redirect
from .views import health_check, root_view
from .views_cors_test import cors_test_view, PublicProjectListView
from .views_spa import SPAView
from api_health import csrf_token_view

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
    path("api/health/", health_check, name="api_health"),  # API 헬스체크
    path("cors-test/", cors_test_view, name="cors_test"),  # CORS 테스트
    path("public/projects/", PublicProjectListView.as_view(), name="public_projects"),  # 공개 프로젝트 목록
    path("admin/", admin.site.urls),
    path("admin-dashboard/", include("admin_dashboard.urls")),  # 관리자 대시보드
    
    # API 경로 (권장) - /api/ 프리픽스를 사용하는 표준 경로
    path("api/users/", include("users.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/feedbacks/", include("feedbacks.urls")),
    path("api/onlines/", include("onlines.urls")),
    path("api/video-planning/", include("video_planning.urls")),
    
    # 레거시 경로 (하위 호환성) - /api/ 프리픽스가 없는 구 경로
    # 새로운 개발에서는 위의 /api/ 경로를 사용할 것을 권장
    path("users/", include("users.urls")),
    path("projects/", include("projects.urls")),
    path("feedbacks/", include("feedbacks.urls")),
    path("onlines/", include("onlines.urls")),
    
    # CSRF 토큰 (특별 경로)
    path("users/csrf-token/", csrf_token_view, name="csrf_token"),
]

# Always serve media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# SPA catch-all route - API 경로가 아닌 모든 요청을 React로 전달
# 이것은 반드시 맨 마지막에 와야 함
if not settings.DEBUG:
    # 프로덕션에서만 활성화
    urlpatterns += [
        re_path(r'^(?!api|admin|media|static|health|users|projects|feedbacks|onlines).*$', SPAView.as_view(), name='spa'),
    ]

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
