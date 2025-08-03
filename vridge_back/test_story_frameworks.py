#!/usr/bin/env python
"""스토리 프레임워크별 테스트 스크립트"""
import os
import sys
import django
import json
from datetime import datetime

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from video_planning.gemini_service import GeminiService

print("=" * 80)
print("VideoPlanet 스토리 프레임워크 테스트")
print("=" * 80)

# 테스트용 기획안
planning_text = """
인공지능이 우리 일상에 미치는 영향에 대한 3분짜리 영상을 만들려고 합니다.
AI가 어떻게 우리의 삶을 편리하게 만들면서도 동시에 새로운 고민거리를 주는지,
균형잡힌 시각으로 다루고 싶습니다.
"""

# 모든 스토리 프레임워크
frameworks = [
    ('classic', '기승전결'),
    ('hook_immersion', '훅-몰입-반전-떡밥'),
    ('pixar', '픽사 스토리텔링'),
    ('deductive', '연역식 전개'),
    ('inductive', '귀납식 전개'),
    ('documentary', '다큐멘터리 형식')
]

# 테스트 컨텍스트
base_context = {
    'tone': '균형잡힌',
    'genre': '교육/정보',
    'concept': '인포그래픽',
    'target': '20-30대 직장인',
    'purpose': '정보 전달과 성찰',
    'duration': '3분',
    'character_name': '',
    'character_description': ''
}

# GeminiService 초기화
print("\n📌 서비스 초기화 중...")
try:
    service = GeminiService()
    print("✅ GeminiService 초기화 성공")
    
    # Gemini 서비스 사용 확인
    print("✅ Gemini 서비스를 사용하여 모든 텍스트를 생성합니다")
    
except Exception as e:
    print(f"❌ 서비스 초기화 실패: {str(e)}")
    sys.exit(1)

# 결과 저장용
results = {}
success_count = 0

# 각 프레임워크별로 테스트
for framework_key, framework_name in frameworks:
    print(f"\n{'='*60}")
    print(f"📚 테스트: {framework_name} ({framework_key})")
    print("="*60)
    
    # 컨텍스트에 프레임워크 추가
    context = base_context.copy()
    context['story_framework'] = framework_key
    
    try:
        # 스토리 생성
        print(f"⏳ {framework_name} 방식으로 스토리 생성 중...")
        result = service.generate_stories_from_planning(planning_text, context)
        
        if result and 'stories' in result and len(result['stories']) > 0:
            stories = result['stories']
            print(f"✅ 성공! {len(stories)}개의 스토리 생성됨")
            
            # 각 스토리 출력
            for i, story in enumerate(stories, 1):
                print(f"\n[스토리 {i}]")
                print(f"제목: {story.get('title', 'N/A')}")
                print(f"단계: {story.get('stage', 'N/A')} - {story.get('stage_name', 'N/A')}")
                print(f"등장인물: {', '.join(story.get('characters', []))}")
                print(f"핵심 내용: {story.get('key_content', 'N/A')}")
                print(f"요약: {story.get('summary', 'N/A')[:100]}...")
            
            results[framework_key] = {
                'success': True,
                'stories': stories,
                'count': len(stories)
            }
            success_count += 1
            
        else:
            print(f"❌ 실패: 스토리가 생성되지 않았습니다.")
            results[framework_key] = {
                'success': False,
                'error': result.get('error', 'Unknown error') if result else 'No result'
            }
            
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        results[framework_key] = {
            'success': False,
            'error': str(e)
        }

# 토큰 사용량 확인
print(f"\n{'='*60}")
print("📊 토큰 사용량 통계")
print("="*60)
token_usage = service.get_token_usage()
print(f"전체 토큰: {token_usage['total']:,}")
print(f"프롬프트 토큰: {token_usage['prompt']:,}")
print(f"응답 토큰: {token_usage['response']:,}")

# 결과 분석
print(f"\n{'='*60}")
print("📈 테스트 결과 분석")
print("="*60)
print(f"성공률: {success_count}/{len(frameworks)} ({success_count/len(frameworks)*100:.1f}%)")

# 프레임워크별 차이점 분석
print("\n🔍 프레임워크별 차이점 분석:")
for framework_key, framework_name in frameworks:
    if results[framework_key]['success']:
        stories = results[framework_key]['stories']
        print(f"\n[{framework_name}]")
        
        # 각 단계의 이름 출력
        stages = [story.get('stage_name', '') for story in stories]
        print(f"단계 구성: {' → '.join(stages)}")
        
        # 첫 번째 스토리의 특징 분석
        first_story = stories[0]
        print(f"시작 방식: {first_story.get('title', 'N/A')}")

# 결과를 파일로 저장
output_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n💾 상세 결과가 {output_file}에 저장되었습니다.")

# 샘플 씬 생성 테스트
print(f"\n{'='*60}")
print("🎬 샘플 씬 생성 테스트")
print("="*60)

# 성공한 프레임워크 중 하나를 선택
successful_framework = None
for framework_key, _ in frameworks:
    if results[framework_key]['success']:
        successful_framework = framework_key
        break

if successful_framework:
    test_story = results[successful_framework]['stories'][0]
    test_story['planning_options'] = base_context
    
    print(f"'{test_story.get('title', 'N/A')}' 스토리로 씬 생성 테스트...")
    
    try:
        scene_result = service.generate_scenes_from_story(test_story)
        if scene_result and 'scenes' in scene_result:
            scenes = scene_result['scenes']
            print(f"✅ {len(scenes)}개의 씬 생성 성공!")
            
            for i, scene in enumerate(scenes, 1):
                print(f"\n[씬 {i}]")
                print(f"장소: {scene.get('location', 'N/A')}")
                print(f"시간: {scene.get('time', 'N/A')}")
                print(f"액션: {scene.get('action', 'N/A')}")
                
        else:
            print("❌ 씬 생성 실패")
            
    except Exception as e:
        print(f"❌ 씬 생성 오류: {str(e)}")

print("\n" + "="*80)
print("테스트 완료!")
print("="*80)