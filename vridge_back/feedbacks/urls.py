from django.urls import path
from . import views

urlpatterns = [
    path("<int:id>", views.FeedbackDetail.as_view()),
    path("file/<int:id>", views.FeedbackFileDelete.as_view()),
]
