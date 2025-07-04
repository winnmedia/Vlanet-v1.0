"""
프롬프트 생성 테스트
"""
import os
import sys

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_minimal')

import django
django.setup()

from video_planning.dalle_service import DalleService

def test_prompt_generation():
    print("\n=== 콘티 프롬프트 생성 테스트 ===\n")
    
    # 테스트 프레임 데이터들
    test_frames = [
        {
            'frame_number': 1,
            'title': '미래의 사무실',
            'visual_description': '현대적인 사무실 공간. 큰 창문으로 도시 전경이 보이고, AI 로봇과 사람들이 함께 일하고 있다.',
            'composition': '와이드샷',
            'lighting': '자연광'
        },
        {
            'frame_number': 2,
            'title': 'AI 로봇 클로즈업',
            'visual_description': '친근한 표정의 흰색 휴머노이드 로봇. 파란색 LED 눈이 부드럽게 빛나고 있다.',
            'composition': '클로즈업',
            'lighting': '부드러운 조명'
        },
        {
            'frame_number': 3,
            'visual_description': '사람과 로봇이 함께 홀로그램 디스플레이를 보며 프로젝트를 논의하는 모습',
            'composition': '미디엄샷',
            'lighting': '혼합 조명 (자연광 + 홀로그램 빛)'
        },
        {
            'frame_number': 4,
            'title': '빈 제목',
            'visual_description': '',  # 빈 설명
            'composition': '',
            'lighting': ''
        }
    ]
    
    # DalleService 초기화 (API 키 없어도 프롬프트 생성은 가능)
    service = DalleService()
    
    for frame in test_frames:
        print(f"\n프레임 {frame['frame_number']}:")
        print(f"제목: {frame.get('title', 'N/A')}")
        print(f"시각적 설명: {frame.get('visual_description', 'N/A')}")
        
        # 프롬프트 생성
        prompt = service._create_storyboard_prompt(frame)
        
        print(f"\n생성된 프롬프트:")
        print(f'"{prompt}"')
        print(f"\n프롬프트 길이: {len(prompt)} 문자")
        print("-" * 80)

if __name__ == '__main__':
    test_prompt_generation()