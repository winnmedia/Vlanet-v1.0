#!/usr/bin/env python
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver
from django.conf import settings

def show_urls(urlpatterns=None, prefix=''):
    if urlpatterns is None:
        urlpatterns = get_resolver().url_patterns
        
    for pattern in urlpatterns:
        if hasattr(pattern, 'url_patterns'):
            # Include된 URL 패턴
            show_urls(pattern.url_patterns, prefix + str(pattern.pattern))
        else:
            # 일반 URL 패턴
            if hasattr(pattern, 'pattern'):
                url = prefix + str(pattern.pattern)
                if 'feedback' in url or 'upload' in url:
                    print(f"{url} -> {pattern.callback}")

print("=== Feedback/Upload 관련 URL 패턴 ===\n")
show_urls()
print("\n=== 전체 API URL 구조 ===")
print(f"BASE URL: {settings.DEBUG and 'http://localhost:8000' or 'https://videoplanet.up.railway.app'}")
print("API Prefix: /api/")
print("\n주요 엔드포인트:")
print("- /api/projects/{project_id}/feedback/upload/ -> 피드백 파일 업로드")
print("- /api/feedbacks/{project_id} -> 피드백 조회/생성")
print("- /api/feedbacks/messages/{message_id}/ -> 피드백 메시지 수정/삭제")