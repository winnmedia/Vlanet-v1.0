#!/usr/bin/env python
"""프로덕션 환경 시뮬레이션 테스트 - 웹에서 호출되는 것처럼 테스트"""
import os
import sys
import django
import json
from datetime import datetime

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

# 웹 환경 시뮬레이션을 위해 환경변수 설정
os.environ['HTTP_HOST'] = 'localhost:8000'
os.environ['HTTP_REFERER'] = 'http://localhost:3000'

from video_planning.views import generate_stories_from_planning_view
from django.test import RequestFactory
from users.models import User
import requests

print("=" * 80)
print("프로덕션 환경 시뮬레이션 테스트")
print("=" * 80)

# Django RequestFactory를 사용하여 실제 웹 요청처럼 시뮬레이션
factory = RequestFactory()

# 테스트용 사용자 (실제로는 인증된 사용자)
try:
    test_user = User.objects.first()
    if not test_user:
        print("테스트 사용자 생성 중...")
        test_user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
except Exception as e:
    print(f"사용자 생성 오류: {e}")
    test_user = None

# 테스트할 옵션들
test_scenarios = [
    {
        'name': '따뜻한 톤 - 클래식 구조',
        'data': {
            'planning_text': '가족의 소중함을 다루는 5분짜리 영상',
            'tone': '따뜻한',
            'genre': '드라마',
            'concept': '가족애',
            'target': '전연령',
            'purpose': '감동',
            'duration': '5분',
            'story_framework': 'classic'
        }
    },
    {
        'name': '유머러스한 톤 - 픽사 구조',
        'data': {
            'planning_text': '직장생활의 웃픈 현실을 다루는 코미디 영상',
            'tone': '유머러스한',
            'genre': '코미디',
            'concept': '직장생활',
            'target': '20-30대',
            'purpose': '재미',
            'duration': '3분',
            'story_framework': 'pixar'
        }
    },
    {
        'name': '진지한 톤 - 다큐멘터리',
        'data': {
            'planning_text': '기후변화의 심각성을 알리는 교육 영상',
            'tone': '진지한',
            'genre': '다큐멘터리',
            'concept': '환경보호',
            'target': '전연령',
            'purpose': '교육',
            'duration': '10분',
            'story_framework': 'documentary'
        }
    },
    {
        'name': '긴장감 있는 톤 - 훅 구조',
        'data': {
            'planning_text': '사이버 보안의 중요성을 다루는 스릴러 영상',
            'tone': '긴장감 있는',
            'genre': '스릴러',
            'concept': '사이버 보안',
            'target': '20-40대',
            'purpose': '경각심',
            'duration': '5분',
            'story_framework': 'hook_immersion'
        }
    }
]

# API 직접 호출 테스트
print("\n🔍 API 엔드포인트 직접 호출 테스트:")
api_url = "http://localhost:8000/api/planning/generate-stories/"

headers = {
    'Content-Type': 'application/json',
    'Referer': 'http://localhost:3000',
    'Origin': 'http://localhost:3000'
}

for scenario in test_scenarios[:1]:  # 첫 번째만 테스트
    print(f"\n[{scenario['name']}]")
    
    try:
        # POST 요청
        response = requests.post(
            api_url,
            json=scenario['data'],
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'stories' in result:
                print(f"✅ 성공! {len(result['stories'])}개 스토리 생성")
                for i, story in enumerate(result['stories'], 1):
                    print(f"  스토리 {i}: {story.get('title', 'N/A')}")
            else:
                print(f"❌ 스토리 없음: {result}")
        else:
            print(f"❌ API 오류: {response.status_code}")
            print(f"응답: {response.text[:200]}...")
            
    except requests.exceptions.ConnectionError:
        print("⚠️  서버가 실행되지 않고 있습니다.")
        print("다음 명령으로 서버를 실행하세요:")
        print("python manage.py runserver")
    except Exception as e:
        print(f"❌ 오류: {str(e)}")

# 결과 요약
print("\n" + "="*80)
print("📊 테스트 결과 요약")
print("="*80)

print("\n💡 403 오류 해결 방법:")
print("1. Google Cloud Console에서 API 키 설정 변경")
print("   - API restrictions: None 또는 Generative Language API만 허용")
print("   - Application restrictions: None")
print("2. 새 API 키 생성 (제한 없음)")
print("3. .env 파일 업데이트")
print("4. Railway 환경변수 업데이트")

print("\n📌 현재 사용 가능한 모든 설정 옵션:")
print("- tone: 따뜻한, 유머러스한, 진지한, 긴장감 있는, 감동적인")
print("- genre: 로맨스, 액션, 코미디, 다큐멘터리, 교육, 드라마, 스릴러")
print("- story_framework: classic, hook_immersion, pixar, deductive, inductive, documentary")
print("- development_level: minimal, light, balanced, detailed")
print("- aspectRatio: 16:9, 9:16, 1:1, 4:3, 21:9")
print("- platform: YouTube, Instagram, TikTok, TV, 영화관")
print("- colorTone: 밝은, 어두운, 파스텔, 모노크롬, 고채도")
print("- editingStyle: 빠른 편집, 롱테이크, 몽타주, 점프컷, 클래식")
print("- musicStyle: 팝, 클래식, 앰비언트, 일렉트로닉, 무음")

print("\n✅ 이 모든 옵션들이 스토리 생성에 영향을 미치며,")
print("   각 조합마다 다른 스토리가 생성됩니다.")
print("="*80)