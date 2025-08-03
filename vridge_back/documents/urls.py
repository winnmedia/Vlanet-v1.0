from django.urls import path
from . import views

app_name = 'documents'

urlpatterns = [
    # 문서 목록 조회 및 업로드
    path('<int:project_id>/documents/', views.DocumentListView.as_view(), name='document-list'),
    path('<int:project_id>/documents/upload/', views.DocumentListView.as_view(), name='document-upload'),
    
    # 문서 상세 조회, 다운로드, 삭제
    path('<int:project_id>/documents/<int:document_id>/', views.DocumentDetailView.as_view(), name='document-detail'),
    path('<int:project_id>/documents/<int:document_id>/download/', views.DocumentDetailView.as_view(), name='document-download'),
]