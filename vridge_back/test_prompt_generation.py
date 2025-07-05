#!/usr/bin/env python
"""
DALL-E 프롬프트 생성 테스트
"""
import os
import sys
import django

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from video_planning.dalle_service import DalleService

def test_prompt_generation():
    """프롬프트 생성 로직만 테스트"""
    
    # DalleService 인스턴스의 프롬프트 생성 메소드만 테스트
    service = DalleService()
    
    test_frames = [
        {
            'frame_number': 1,
            'title': '카페 입장',
            'visual_description': '카페에 들어가는 남자',
            'composition': '미디엄샷',
            'lighting': '자연광'
        },
        {
            'frame_number': 2,
            'title': '프레젠테이션',
            'visual_description': '회의실에서 프레젠테이션하는 여성',
            'composition': '와이드샷',
            'lighting': '실내조명'
        },
        {
            'frame_number': 3,
            'title': '공원 놀이',
            'visual_description': '공원에서 뛰어노는 아이들',
            'composition': '풀샷',
            'lighting': '황금시간대'
        }
    ]
    
    print("="*60)
    print("🎨 DALL-E 프롬프트 생성 테스트")
    print("="*60)
    
    for i, frame in enumerate(test_frames):
        print(f"\n📌 Frame {i+1}: {frame['title']}")
        print(f"   한국어 설명: {frame['visual_description']}")
        
        # 다양한 스타일로 프롬프트 생성
        styles = ['minimal', 'sketch', 'realistic', 'cinematic']
        
        for style in styles:
            prompt = service._create_visual_prompt(frame, style)
            print(f"\n   [{style}] 프롬프트:")
            print(f"   {prompt}")
            
            # 금지 단어 체크
            forbidden_words = ['frame', 'scene', 'storyboard', '#', 'description', 'text']
            found_forbidden = [word for word in forbidden_words if word.lower() in prompt.lower()]
            
            if found_forbidden:
                print(f"   ⚠️  금지 단어 발견: {found_forbidden}")
            else:
                print(f"   ✅ 금지 단어 없음")
    
    print("\n" + "="*60)
    print("✅ 프롬프트 생성 테스트 완료")
    print("="*60)

if __name__ == "__main__":
    test_prompt_generation()