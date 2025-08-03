#!/usr/bin/env python3
import os
import sys
import django

# Django 설정
sys.path.insert(0, '/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

from django.core.cache import cache
from users.models import User

try:
    # 특정 사용자의 캐시 클리어
    user = User.objects.filter(username="ceo@winnmedia.co.kr").first()
    if user:
        cache_key = f"project_list_{user.id}"
        cache.delete(cache_key)
        print(f"캐시 '{cache_key}'가 삭제되었습니다.")
        
        # 전체 프로젝트 캐시도 클리어
        cache.delete("all_projects")
        print("전체 프로젝트 캐시도 삭제되었습니다.")
    else:
        print("사용자를 찾을 수 없습니다.")
        
except Exception as e:
    print(f"오류 발생: {e}")
    import traceback
    traceback.print_exc()