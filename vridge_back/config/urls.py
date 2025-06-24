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
from rest_framework_simplejwt import token_blacklist

urlpatterns = [
    path("admin/", admin.site.urls),
    path("users/", include("users.urls")),
    path("projects/", include("projects.urls")),
    path("feedbacks/", include("feedbacks.urls")),
    path("onlines/", include("onlines.urls")),
    # path("feedbacks/", include("feedbacks.routing")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.unregister(token_blacklist.models.BlacklistedToken)
admin.site.unregister(token_blacklist.models.OutstandingToken)
admin.site.unregister(Group)

admin.site.site_title = "윈앤미디어"
admin.site.site_header = "윈앤미디어"
admin.site.index_title = "윈앤미디어"
