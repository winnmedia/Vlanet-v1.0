#!/usr/bin/env python
"""
프롬프트 개선 테스트 - API 키 없이 프롬프트만 확인
"""
import os
import sys
import django

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from video_planning.dalle_service import DalleService

def test_prompts():
    """개선된 프롬프트 생성 테스트"""
    
    print("\n" + "="*60)
    print("🎨 DALL-E 프롬프트 개선 테스트")
    print("="*60)
    
    # DalleService 초기화 (API 키 없어도 프롬프트 생성은 가능)
    service = DalleService()
    
    # 테스트 케이스
    test_cases = [
        {
            'name': 'cafe_entrance',
            'frame': {
                'visual_description': '카페에 들어가는 남자',
                'composition': '미디엄샷',
                'lighting': '자연광'
            }
        },
        {
            'name': 'presentation',
            'frame': {
                'visual_description': '회의실에서 프레젠테이션하는 여성',
                'composition': '와이드샷',
                'lighting': '실내조명'
            }
        },
        {
            'name': 'park_children',
            'frame': {
                'visual_description': '공원에서 뛰어노는 아이들',
                'composition': '풀샷',
                'lighting': '황금시간대'
            }
        },
        {
            'name': 'office_work',
            'frame': {
                'visual_description': '사무실에서 일하는 사람들',
                'composition': '클로즈업',
                'lighting': '부드러운조명'
            }
        }
    ]
    
    # 각 스타일별로 테스트
    styles = ['minimal', 'sketch', 'realistic', 'watercolor', 'cinematic']
    
    print("\n📋 프롬프트 생성 결과:\n")
    
    for test in test_cases:
        print(f"\n[{test['name']}]")
        print(f"한국어: {test['frame']['visual_description']}")
        print(f"구성: {test['frame'].get('composition', '')}")
        print(f"조명: {test['frame'].get('lighting', '')}")
        print("\n생성된 프롬프트:")
        
        for style in styles:
            prompt = service._create_visual_prompt(test['frame'], style)
            print(f"  {style:12}: {prompt}")
            
            # 금지 단어 체크
            forbidden = ['frame', 'scene', 'storyboard', 'text', 'description', 'panel']
            found_forbidden = [word for word in forbidden if word in prompt.lower()]
            if found_forbidden:
                print(f"  ⚠️  WARNING: 금지 단어 발견: {found_forbidden}")
    
    # 개선 사항 요약
    print("\n" + "="*60)
    print("✅ 프롬프트 개선 사항:")
    print("="*60)
    print("1. 모든 스타일에서 텍스트 트리거 단어 제거")
    print("2. Midjourney 스타일의 간결한 프롬프트")
    print("3. 구성과 조명 정보를 자연스럽게 통합")
    print("4. 100자 이내로 프롬프트 길이 제한")
    print("5. 'photo', 'watercolor' 등 단순한 스타일 키워드 사용")
    
    # 예시 프롬프트 비교
    print("\n📊 개선 전후 비교:")
    print("\n❌ 개선 전:")
    print("  'Frame #1: black and white pencil drawing, storyboard style, man entering a café...'")
    print("\n✅ 개선 후:")
    print("  'man walks into cafe, medium shot'")
    print("  'pencil sketch man walks into cafe, natural light'")
    print("  'photo man walks into cafe, medium shot'")

if __name__ == "__main__":
    test_prompts()