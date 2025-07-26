#!/usr/bin/env python
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vridge_back.settings')
django.setup()

from video_planning.gemini_service import GeminiService
import json

def test_story_generation():
    """스토리 생성 시 프레임워크가 제대로 반영되는지 테스트"""
    
    service = GeminiService()
    
    # 테스트 기획안
    planning_text = "AI 기술을 활용한 맞춤형 교육 서비스 홍보 영상"
    
    # 테스트할 프레임워크들
    frameworks = ['classic', 'hook_immersion', 'pixar']
    
    for framework in frameworks:
        print(f"\n{'='*50}")
        print(f"Testing framework: {framework}")
        print('='*50)
        
        context = {
            'tone': '친근하고 전문적인',
            'genre': '교육/정보',
            'concept': 'AI 교육의 미래',
            'target': '학부모와 교육자',
            'purpose': '서비스 홍보',
            'duration': '3분',
            'story_framework': framework,
            'development_level': 'balanced'
        }
        
        try:
            result = service.generate_stories_from_planning(planning_text, context)
            
            if 'error' in result:
                print(f"Error: {result['error']}")
                if 'fallback' in result:
                    result = result['fallback']
                else:
                    continue
            
            stories = result.get('stories', [])
            
            print(f"\nGenerated {len(stories)} stories:")
            for i, story in enumerate(stories):
                print(f"\nStory {i+1}:")
                print(f"  Title: {story.get('title', 'N/A')}")
                print(f"  Stage: {story.get('stage', 'N/A')}")
                print(f"  Stage Name: {story.get('stage_name', 'N/A')}")
                print(f"  Planning Options: {'Yes' if 'planning_options' in story else 'No'}")
                
                if 'planning_options' in story:
                    print(f"  Framework in options: {story['planning_options'].get('story_framework', 'N/A')}")
        
        except Exception as e:
            print(f"Exception occurred: {str(e)}")


def test_insert_shots():
    """인서트 샷 생성 테스트"""
    
    service = GeminiService()
    
    # 테스트 씬 데이터
    scene_data = {
        'scene_number': 1,
        'location': '현대적인 교실',
        'time': '오후',
        'action': '학생이 AI 튜터와 대화하며 수학 문제를 풀고 있다',
        'dialogue': '이해가 안 가는 부분이 있어요... 아, 이제 알겠어요!',
        'characters': ['학생', 'AI 튜터(화면)'],
        'mood': '집중적이고 희망적인'
    }
    
    print("\n" + "="*50)
    print("Testing Insert Shots Generation")
    print("="*50)
    
    try:
        insert_shots = service.generate_insert_shots(scene_data)
        
        print(f"\nGenerated {len(insert_shots)} insert shots:")
        for i, shot in enumerate(insert_shots):
            print(f"\n{i+1}. {shot}")
            
        # 구체성 체크
        abstract_words = ['감정', '표현', '분위기', '느낌']
        concrete_count = 0
        
        for shot in insert_shots:
            is_concrete = True
            for word in abstract_words:
                if word in shot:
                    is_concrete = False
                    break
            if is_concrete:
                concrete_count += 1
        
        print(f"\nConcrete shots: {concrete_count}/{len(insert_shots)}")
        
    except Exception as e:
        print(f"Exception occurred: {str(e)}")


if __name__ == "__main__":
    print("Testing Video Planning Backend Fixes...")
    
    # 스토리 프레임워크 테스트
    test_story_generation()
    
    # 인서트 샷 테스트
    test_insert_shots()
    
    print("\n\nTest completed!")