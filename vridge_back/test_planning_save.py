#!/usr/bin/env python3
import os
import sys
import django

# Django 설정
sys.path.insert(0, '/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

from video_planning.models import VideoPlanning
from users.models import User

try:
    # 테스트 사용자 가져오기
    user = User.objects.get(username='ceo@winnmedia.co.kr')
    print(f"테스트 사용자: {user.username}")
    
    # 테스트 기획 생성
    planning = VideoPlanning.objects.create(
        user=user,
        title='테스트 기획',
        planning_text='테스트 기획 내용',
        stories=[],
        scenes=[],
        shots=[],
        storyboards=[]
    )
    print(f"기획 생성 성공! ID: {planning.id}")
    
    # 생성된 기획 확인
    saved_planning = VideoPlanning.objects.get(id=planning.id)
    print(f"저장된 기획 확인: {saved_planning.title}")
    
except Exception as e:
    print(f"오류 발생: {e}")
    import traceback
    traceback.print_exc()