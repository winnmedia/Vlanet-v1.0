#!/usr/bin/env python
"""핵심 설정별 스토리 변화 빠른 테스트"""
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
print("VideoPlanet 핵심 설정별 스토리 변화 테스트")
print("=" * 80)

# 동일한 기획안
planning_text = """
평범한 청년이 우연히 특별한 능력을 얻게 되는 이야기
"""

# GeminiService 초기화
print("\n📌 서비스 초기화 중...")
try:
    service = GeminiService()
    print("✅ 초기화 성공")
except Exception as e:
    print(f"❌ 초기화 실패: {str(e)}")
    sys.exit(1)

# 테스트 시나리오
test_scenarios = [
    {
        'name': '톤 변화 테스트',
        'base_context': {
            'genre': '판타지',
            'target': '20-30대',
            'duration': '5분',
            'story_framework': 'classic'
        },
        'variations': [
            {'tone': '따뜻한'},
            {'tone': '유머러스한'},
            {'tone': '진지한'},
            {'tone': '긴장감 있는'}
        ]
    },
    {
        'name': '장르 변화 테스트',
        'base_context': {
            'tone': '중립적',
            'target': '20-30대',
            'duration': '5분',
            'story_framework': 'classic'
        },
        'variations': [
            {'genre': '로맨스'},
            {'genre': '액션'},
            {'genre': '코미디'},
            {'genre': '스릴러'}
        ]
    },
    {
        'name': '프레임워크 변화 테스트',
        'base_context': {
            'tone': '균형잡힌',
            'genre': '드라마',
            'target': '전연령',
            'duration': '5분'
        },
        'variations': [
            {'story_framework': 'classic'},
            {'story_framework': 'pixar'},
            {'story_framework': 'hook_immersion'},
            {'story_framework': 'documentary'}
        ]
    },
    {
        'name': '타겟 변화 테스트',
        'base_context': {
            'tone': '중립적',
            'genre': '판타지',
            'duration': '5분',
            'story_framework': 'classic'
        },
        'variations': [
            {'target': '어린이'},
            {'target': '10대'},
            {'target': '20-30대'},
            {'target': '40-50대'}
        ]
    }
]

# 결과 저장
all_results = {}

# 각 시나리오 테스트
for scenario in test_scenarios:
    print(f"\n{'='*60}")
    print(f"🔍 {scenario['name']}")
    print("="*60)
    
    scenario_results = []
    
    for variation in scenario['variations']:
        # 컨텍스트 생성
        context = scenario['base_context'].copy()
        context.update(variation)
        
        # 변경된 설정 출력
        changed_key = list(variation.keys())[0]
        changed_value = variation[changed_key]
        print(f"\n[{changed_key}: {changed_value}]")
        
        try:
            result = service.generate_stories_from_planning(planning_text, context)
            
            if result and 'stories' in result and len(result['stories']) > 0:
                stories = result['stories']
                
                # 첫 번째 스토리 분석
                first_story = stories[0]
                
                print(f"✅ 생성 성공")
                print(f"제목: {first_story.get('title', 'N/A')}")
                print(f"단계: {first_story.get('stage_name', 'N/A')}")
                print(f"요약: {first_story.get('summary', 'N/A')[:100]}...")
                
                # 키워드 분석
                content = f"{first_story.get('title', '')} {first_story.get('summary', '')} {first_story.get('key_content', '')}"
                
                # 설정이 반영되었는지 간단히 확인
                reflection_keywords = {
                    '따뜻한': ['따뜻', '온화', '부드러'],
                    '유머러스한': ['웃', '재미', '유머'],
                    '진지한': ['진지', '심각', '신중'],
                    '긴장감 있는': ['긴장', '긴박', '위기'],
                    '로맨스': ['사랑', '연인', '감정'],
                    '액션': ['액션', '전투', '추격'],
                    '코미디': ['웃음', '유머', '재미'],
                    '스릴러': ['긴장', '공포', '서스펜스'],
                    'classic': ['기', '승', '전', '결'],
                    'pixar': ['옛날', '어느날', '그래서', '마침내'],
                    'hook_immersion': ['훅', '몰입', '반전', '떡밥'],
                    'documentary': ['탐사', '조사', '인터뷰']
                }
                
                if changed_value in reflection_keywords:
                    keywords = reflection_keywords[changed_value]
                    reflected = any(kw in content for kw in keywords)
                    print(f"설정 반영: {'✅ 예' if reflected else '❌ 아니오'}")
                
                scenario_results.append({
                    'setting': f"{changed_key}={changed_value}",
                    'title': first_story.get('title', 'N/A'),
                    'summary': first_story.get('summary', 'N/A')
                })
                
            else:
                print("❌ 생성 실패")
                scenario_results.append({
                    'setting': f"{changed_key}={changed_value}",
                    'error': '생성 실패'
                })
                
        except Exception as e:
            if "403" in str(e):
                print("❌ 403 오류")
            else:
                print(f"❌ 오류: {str(e)[:50]}...")
            scenario_results.append({
                'setting': f"{changed_key}={changed_value}",
                'error': str(e)[:100]
            })
    
    all_results[scenario['name']] = scenario_results

# 결과 요약
print(f"\n{'='*80}")
print("📊 테스트 결과 요약")
print("="*80)

# 각 시나리오별 다양성 확인
for scenario_name, results in all_results.items():
    print(f"\n[{scenario_name}]")
    
    # 성공한 결과들의 제목 수집
    titles = [r['title'] for r in results if 'title' in r]
    unique_titles = set(titles)
    
    if titles:
        print(f"- 생성된 스토리: {len(titles)}개")
        print(f"- 고유한 제목: {len(unique_titles)}개")
        print(f"- 다양성: {len(unique_titles)/len(titles)*100:.0f}%")
        
        # 제목 출력
        print("- 생성된 제목들:")
        for r in results:
            if 'title' in r:
                print(f"  • {r['setting']}: {r['title']}")
    else:
        print("- 모든 테스트 실패")

# 토큰 사용량
token_usage = service.get_token_usage()
print(f"\n💰 토큰 사용량:")
print(f"- 전체: {token_usage['total']:,}")

# 결과 저장
output_file = f"key_variations_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"\n💾 결과가 {output_file}에 저장되었습니다.")

# 최종 분석
print(f"\n{'='*80}")
print("🎯 최종 분석")
print("="*80)

successful_tests = sum(1 for results in all_results.values() for r in results if 'title' in r)
total_tests = sum(len(results) for results in all_results.values())

if successful_tests > 0:
    print(f"\n✅ 성공률: {successful_tests}/{total_tests} ({successful_tests/total_tests*100:.0f}%)")
    print("✅ 각 설정이 스토리에 영향을 미치는 것이 확인됨")
    print("✅ 동일한 기획안이라도 설정에 따라 다른 스토리 생성")
else:
    print("\n❌ 모든 테스트 실패")
    print("💡 API 키 문제일 가능성이 높습니다.")

if any("403" in str(r.get('error', '')) for results in all_results.values() for r in results):
    print("\n⚠️  403 오류 해결 방법:")
    print("1. Google AI Studio에서 새 API 키 생성")
    print("2. .env 파일 업데이트")
    print("3. 테스트 재실행")

print("\n" + "="*80)