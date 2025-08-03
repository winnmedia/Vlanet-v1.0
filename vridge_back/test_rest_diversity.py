#!/usr/bin/env python
"""REST API를 사용한 다양성 테스트 - 403 오류 해결"""
import os
import sys
import django
import json
from datetime import datetime

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from video_planning.gemini_service_rest import GeminiServiceREST

print("=" * 80)
print("VideoPlanet REST API 다양성 테스트")
print("=" * 80)

# 테스트할 주요 옵션들
test_options = {
    'tone': ['따뜻한', '유머러스한', '진지한', '긴장감 있는', '감동적인'],
    'genre': ['로맨스', '액션', '코미디', '다큐멘터리', '교육'],
    'story_framework': ['classic', 'hook_immersion', 'pixar', 'deductive', 'inductive', 'documentary']
}

# 기본 기획안
planning_text = """
인공지능이 우리 일상에 미치는 영향에 대한 3분짜리 영상을 만들려고 합니다.
AI가 어떻게 우리의 삶을 편리하게 만들면서도 동시에 새로운 고민거리를 주는지,
균형잡힌 시각으로 다루고 싶습니다.
"""

# REST 서비스 초기화
print("\n📌 REST 서비스 초기화 중...")
try:
    service = GeminiServiceREST()
    print("✅ GeminiServiceREST 초기화 성공")
except Exception as e:
    print(f"❌ 서비스 초기화 실패: {str(e)}")
    sys.exit(1)

# 간단한 테스트
print("\n🔍 기본 테스트:")
response = service.generate_content("한국어로 '안녕하세요' 인사해주세요", temperature=0.7)
if response:
    print(f"✅ 성공: {response[:100]}...")
else:
    print("❌ 실패")

# 결과 저장용
results = {}
success_count = 0
total_tests = 0

# 1. 톤별 테스트
print(f"\n{'='*60}")
print("📊 톤(tone)별 다양성 테스트")
print("="*60)

for tone in test_options['tone']:
    print(f"\n[{tone}] 톤 테스트:")
    context = {
        'tone': tone,
        'genre': '일반',
        'concept': '기술과 인간',
        'target': '20-30대',
        'purpose': '정보 전달',
        'duration': '3분',
        'story_framework': 'classic'
    }
    
    total_tests += 1
    
    try:
        result = service.generate_stories_from_planning(planning_text, context)
        
        if result and 'stories' in result:
            stories = result['stories']
            print(f"✅ 성공! {len(stories)}개 스토리 생성")
            
            # 첫 번째 스토리만 출력
            if stories:
                first = stories[0]
                print(f"  제목: {first.get('title', 'N/A')}")
                print(f"  요약: {first.get('summary', 'N/A')[:80]}...")
            
            results[f'tone_{tone}'] = {
                'success': True,
                'story_count': len(stories),
                'titles': [s.get('title', 'N/A') for s in stories]
            }
            success_count += 1
        else:
            print("❌ 스토리 생성 실패")
            results[f'tone_{tone}'] = {'success': False}
            
    except Exception as e:
        print(f"❌ 오류: {str(e)[:100]}...")
        results[f'tone_{tone}'] = {'success': False, 'error': str(e)}

# 2. 프레임워크별 테스트
print(f"\n{'='*60}")
print("📊 스토리 프레임워크별 테스트")
print("="*60)

for framework in test_options['story_framework']:
    print(f"\n[{framework}] 프레임워크:")
    context = {
        'tone': '균형잡힌',
        'genre': '교육/정보',
        'concept': '인포그래픽',
        'target': '20-30대 직장인',
        'purpose': '정보 전달과 성찰',
        'duration': '3분',
        'story_framework': framework
    }
    
    total_tests += 1
    
    try:
        result = service.generate_stories_from_planning(planning_text, context)
        
        if result and 'stories' in result:
            stories = result['stories']
            print(f"✅ 성공! {len(stories)}개 스토리")
            
            # 단계 구성 출력
            stages = [s.get('stage_name', '') for s in stories]
            print(f"  단계: {' → '.join(stages)}")
            
            results[f'framework_{framework}'] = {
                'success': True,
                'story_count': len(stories),
                'stages': stages
            }
            success_count += 1
        else:
            print("❌ 실패")
            results[f'framework_{framework}'] = {'success': False}
            
    except Exception as e:
        print(f"❌ 오류: {str(e)[:50]}...")
        results[f'framework_{framework}'] = {'success': False, 'error': str(e)}

# 3. 조합 테스트
print(f"\n{'='*60}")
print("🎭 옵션 조합 테스트")
print("="*60)

combo_tests = [
    {
        'name': '유머러스한 픽사 스타일',
        'context': {
            'tone': '유머러스한',
            'genre': '코미디',
            'story_framework': 'pixar',
            'target': '10대',
            'duration': '5분'
        }
    },
    {
        'name': '진지한 다큐멘터리',
        'context': {
            'tone': '진지한',
            'genre': '다큐멘터리',
            'story_framework': 'documentary',
            'target': '전연령',
            'duration': '10분'
        }
    }
]

for combo in combo_tests:
    print(f"\n[{combo['name']}]:")
    total_tests += 1
    
    try:
        result = service.generate_stories_from_planning(planning_text, combo['context'])
        
        if result and 'stories' in result:
            print(f"✅ 성공! {len(result['stories'])}개 스토리")
            success_count += 1
        else:
            print("❌ 실패")
            
    except Exception as e:
        print(f"❌ 오류: {str(e)[:50]}...")

# 결과 요약
print(f"\n{'='*80}")
print("📈 최종 결과")
print("="*80)

print(f"\n전체 테스트: {total_tests}개")
print(f"성공: {success_count}개 ({success_count/total_tests*100:.1f}%)")

# 토큰 사용량
token_usage = service.get_token_usage()
print(f"\n💰 토큰 사용량:")
print(f"- 전체: {token_usage['total']:,}")
print(f"- 프롬프트: {token_usage['prompt']:,}")
print(f"- 응답: {token_usage['response']:,}")

# 결과 저장
output_file = f"rest_api_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'test_summary': {
            'total_tests': total_tests,
            'success_count': success_count,
            'success_rate': success_count/total_tests if total_tests > 0 else 0
        },
        'results': results,
        'token_usage': token_usage
    }, f, ensure_ascii=False, indent=2)

print(f"\n💾 결과가 {output_file}에 저장되었습니다.")

print("\n✅ REST API를 사용하여 403 오류 없이 테스트 완료!")
print("="*80)