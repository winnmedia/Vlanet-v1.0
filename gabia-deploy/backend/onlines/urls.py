from django.urls import path
from . import views

urlpatterns = [
    path("", views.OnlineVideo.as_view()),
]
