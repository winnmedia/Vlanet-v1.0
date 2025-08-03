#!/usr/bin/env python
"""동일한 기획안으로 여러 번 스토리 생성하여 다양성 검증"""
import os
import sys
import django
import json
from datetime import datetime
import hashlib

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from video_planning.gemini_service import GeminiService

print("=" * 80)
print("VideoPlanet 스토리 다양성 검증 테스트")
print("=" * 80)

# 테스트용 기획안 (고정)
planning_text = """
평범한 대학생이 우연히 발견한 낡은 카메라로 
과거를 촬영할 수 있다는 것을 알게 되는 5분짜리 판타지 영상.
시간여행의 위험성과 선택의 중요성을 다룸.
"""

# 테스트 컨텍스트 (고정)
test_context = {
    'tone': '신비로운',
    'genre': '판타지',
    'concept': '시간여행',
    'target': '10-20대',
    'purpose': '재미와 교훈',
    'duration': '5분',
    'story_framework': 'pixar',  # 픽사 프레임워크로 고정
    'character_name': '김민준',
    'character_description': '호기심 많은 대학생'
}

# GeminiService 초기화
print("\n📌 서비스 초기화 중...")
try:
    service = GeminiService()
    print("✅ GeminiService 초기화 성공")
except Exception as e:
    print(f"❌ 서비스 초기화 실패: {str(e)}")
    sys.exit(1)

# 스토리 고유성 검증을 위한 함수
def get_story_fingerprint(story):
    """스토리의 핵심 요소로 지문 생성"""
    fingerprint = f"{story.get('title', '')}|{story.get('summary', '')}|{story.get('key_content', '')}"
    return hashlib.md5(fingerprint.encode()).hexdigest()[:8]

# 5번 반복 생성 테스트
print(f"\n📝 동일한 기획안으로 5번 스토리 생성 테스트")
print(f"기획안: {planning_text[:50]}...")
print(f"프레임워크: {test_context['story_framework']}")
print("=" * 80)

all_results = []
unique_stories = set()
story_variations = {}

for attempt in range(5):
    print(f"\n🔄 시도 {attempt + 1}/5")
    print("-" * 60)
    
    try:
        # 스토리 생성
        result = service.generate_stories_from_planning(planning_text, test_context)
        
        if result and 'stories' in result and len(result['stories']) > 0:
            stories = result['stories']
            print(f"✅ 성공! {len(stories)}개의 스토리 생성됨")
            
            # 이번 시도의 스토리들 분석
            attempt_fingerprints = []
            
            for i, story in enumerate(stories, 1):
                fingerprint = get_story_fingerprint(story)
                attempt_fingerprints.append(fingerprint)
                
                if fingerprint not in story_variations:
                    story_variations[fingerprint] = {
                        'count': 0,
                        'story': story,
                        'first_seen': attempt + 1
                    }
                story_variations[fingerprint]['count'] += 1
                
                print(f"\n  [스토리 {i}] (ID: {fingerprint})")
                print(f"  제목: {story.get('title', 'N/A')}")
                print(f"  단계: {story.get('stage_name', 'N/A')}")
                print(f"  핵심: {story.get('key_content', 'N/A')[:80]}...")
            
            all_results.append({
                'attempt': attempt + 1,
                'stories': stories,
                'fingerprints': attempt_fingerprints
            })
            
            # 고유 스토리 추가
            unique_stories.update(attempt_fingerprints)
            
        else:
            print(f"❌ 실패: 스토리가 생성되지 않았습니다.")
            
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")

# 결과 분석
print(f"\n{'='*80}")
print("📊 다양성 분석 결과")
print("="*80)

total_stories = sum(len(r['stories']) for r in all_results)
print(f"\n총 생성된 스토리 수: {total_stories}개")
print(f"고유한 스토리 수: {len(unique_stories)}개")
print(f"다양성 비율: {len(unique_stories)/total_stories*100:.1f}%")

# 중복된 스토리 분석
print("\n🔍 스토리 중복 분석:")
duplicates = 0
for fp, data in story_variations.items():
    if data['count'] > 1:
        duplicates += 1
        print(f"\n중복 발견 (ID: {fp})")
        print(f"  제목: {data['story'].get('title', 'N/A')}")
        print(f"  등장 횟수: {data['count']}회")
        print(f"  처음 등장: {data['first_seen']}번째 시도")

if duplicates == 0:
    print("\n✅ 모든 스토리가 고유합니다!")

# 프레임워크별 테스트
print(f"\n{'='*80}")
print("🎭 다른 프레임워크로 동일 기획안 테스트")
print("="*80)

frameworks = ['classic', 'hook_immersion', 'documentary']
framework_results = {}

for framework in frameworks:
    print(f"\n📚 {framework} 프레임워크 테스트")
    test_context['story_framework'] = framework
    
    try:
        result = service.generate_stories_from_planning(planning_text, test_context)
        
        if result and 'stories' in result:
            stories = result['stories']
            print(f"✅ {len(stories)}개 스토리 생성")
            
            # 첫 번째 스토리만 출력
            if stories:
                first = stories[0]
                print(f"  첫 스토리: {first.get('title', 'N/A')}")
                print(f"  단계: {first.get('stage_name', 'N/A')}")
                
            framework_results[framework] = stories
            
    except Exception as e:
        print(f"❌ 오류: {str(e)}")

# 프레임워크 간 차이 분석
print(f"\n{'='*80}")
print("📈 프레임워크별 차이점 요약")
print("="*80)

for framework, stories in framework_results.items():
    if stories:
        print(f"\n[{framework}]")
        stages = [s.get('stage_name', '') for s in stories]
        print(f"단계 구성: {' → '.join(stages)}")
        
        # 주요 키워드 추출
        all_text = ' '.join([s.get('summary', '') + s.get('key_content', '') for s in stories])
        keywords = set(word for word in all_text.split() if len(word) > 3 and word not in ['있습니다', '됩니다', '합니다'])
        print(f"주요 키워드: {', '.join(list(keywords)[:5])}")

# 상세 결과 저장
output_file = f"story_variation_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'planning_text': planning_text,
        'test_context': test_context,
        'multiple_attempts': all_results,
        'unique_story_count': len(unique_stories),
        'total_story_count': total_stories,
        'diversity_ratio': len(unique_stories)/total_stories if total_stories > 0 else 0,
        'framework_comparison': {k: [{'title': s.get('title'), 'stage': s.get('stage_name')} for s in v] for k, v in framework_results.items()}
    }, f, ensure_ascii=False, indent=2)

print(f"\n💾 상세 결과가 {output_file}에 저장되었습니다.")
print("\n" + "="*80)
print("테스트 완료!")
print("="*80)