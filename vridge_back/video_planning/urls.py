from django.urls import path
from . import views
from . import views_debug

app_name = 'video_planning'

urlpatterns = [
    # 디버그 엔드포인트
    path('debug/services/', views_debug.check_services_status, name='check_services_status'),
    path('debug/test-openai/', views_debug.test_openai_direct, name='test_openai_direct'),
    
    # 생성 관련 API
    path('generate/structure/', views.generate_structure, name='generate_structure'),
    path('generate/story/', views.generate_story, name='generate_story'),
    path('generate/scenes/', views.generate_scenes, name='generate_scenes'),
    path('generate/shots/', views.generate_shots, name='generate_shots'),
    path('generate/storyboards/', views.generate_storyboards, name='generate_storyboards'),
    
    # 이미지 관련 API
    path('regenerate/storyboard-image/', views.regenerate_storyboard_image, name='regenerate_storyboard_image'),
    path('download/storyboard-image/', views.download_storyboard_image, name='download_storyboard_image'),
    
    # 기획 저장/조회 API
    path('save/', views.save_planning, name='save_planning'),
    path('list/', views.get_planning_list, name='get_planning_list'),
    path('detail/<int:planning_id>/', views.get_planning_detail, name='get_planning_detail'),
    path('update/<int:planning_id>/', views.update_planning, name='update_planning'),
    path('delete/<int:planning_id>/', views.delete_planning, name='delete_planning'),
    
    # 최근 기획 로그 API
    path('recent/', views.get_recent_plannings, name='get_recent_plannings'),
    
    # 라이브러리 API (프론트엔드에서 사용하는 경로)
    path('library/', views.planning_library_view, name='planning_library'),
    path('library/<int:planning_id>/', views.get_planning_detail, name='get_planning_detail_library'),
]