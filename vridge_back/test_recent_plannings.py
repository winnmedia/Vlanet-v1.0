import os
import django
import sys

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from video_planning.views import get_recent_plannings
from video_planning.models import VideoPlanning
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIRequestFactory, force_authenticate

User = get_user_model()

def test_recent_plannings():
    # 테스트 사용자 생성 또는 가져오기
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={'username': 'testuser', 'nickname': 'Test User'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"Created test user: {user.email}")
    else:
        print(f"Using existing user: {user.email}")
    
    # 테스트 기획 데이터 생성
    for i in range(3):
        VideoPlanning.objects.get_or_create(
            user=user,
            title=f"테스트 기획 {i+1}",
            defaults={
                'planning_text': f"테스트 기획 내용 {i+1}",
                'current_step': i+1,
                'is_completed': i == 2,
                'selected_story': {
                    'planning_options': {
                        'tone': '밝은',
                        'genre': '다큐멘터리',
                        'concept': '일상',
                        'target': '20대',
                        'purpose': '홍보',
                        'duration': '3분'
                    }
                }
            }
        )
    
    print(f"\nTotal plannings for user: {VideoPlanning.objects.filter(user=user).count()}")
    
    # API Request Factory로 요청 생성 (JWT 인증 시뮬레이션)
    factory = APIRequestFactory()
    request = factory.get('/api/video-planning/recent/')
    
    # Force authenticate the request
    force_authenticate(request, user=user)
    
    # 뷰 함수 호출
    print("\nCalling get_recent_plannings view...")
    response = get_recent_plannings(request)
    
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
    
    if response.status_code == 200:
        print("\n✅ Recent plannings test PASSED!")
        planning_logs = response.data['data']['planning_logs']
        print(f"Found {len(planning_logs)} recent plannings:")
        for idx, planning in enumerate(planning_logs, 1):
            print(f"{idx}. {planning['title']} - Created: {planning['created_at']}")
    else:
        print("\n❌ Recent plannings test FAILED!")

if __name__ == "__main__":
    test_recent_plannings()