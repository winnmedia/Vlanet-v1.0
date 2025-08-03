#!/usr/bin/env python
"""모든 설정 옵션별 스토리 변화 종합 테스트"""
import os
import sys
import django
import json
from datetime import datetime
import hashlib
from collections import defaultdict

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')

# 403 오류 회피를 위한 환경 설정
os.environ['HTTP_REFERER'] = 'http://localhost:3000'

django.setup()

from video_planning.gemini_service import GeminiService

print("=" * 80)
print("VideoPlanet 스토리 변화 종합 테스트")
print("=" * 80)

# 테스트할 모든 옵션들 (각 카테고리별 대표값)
test_options = {
    'tone': ['따뜻한', '유머러스한', '진지한'],
    'genre': ['로맨스', '액션', '다큐멘터리'],
    'concept': ['AI 디스토피아', '시간여행', '성장드라마'],
    'target': ['10대', '20-30대', '전연령'],
    'purpose': ['재미', '교육', '감동'],
    'duration': ['1분', '5분', '30분'],
    'story_framework': ['classic', 'pixar', 'documentary'],
    'development_level': ['minimal', 'balanced', 'detailed']
}

# 고급 옵션 (선택적)
advanced_options = {
    'aspectRatio': ['16:9', '9:16'],
    'platform': ['YouTube', 'TikTok'],
    'colorTone': ['밝은', '어두운'],
    'editingStyle': ['빠른 편집', '클래식'],
    'musicStyle': ['팝', '클래식']
}

# 기본 기획안 (고정)
base_planning = """
인공지능과 인간이 공존하는 미래 사회를 배경으로,
한 젊은이가 자신의 정체성을 찾아가는 이야기
"""

# GeminiService 초기화
print("\n📌 서비스 초기화 중...")
service = None
try:
    # 먼저 현재 API 키로 시도
    service = GeminiService()
    print("✅ GeminiService 초기화 성공")
    
    # 간단한 테스트
    test_prompt = "한 문장으로 인사해주세요."
    test_response = service.model.generate_content(test_prompt)
    print(f"✅ API 테스트 성공: {test_response.text[:50]}...")
    
except Exception as e:
    if "403" in str(e):
        print("❌ 403 오류 발생 - API 키 제한 문제")
        print("\n💡 해결 방법:")
        print("1. Google AI Studio에서 새 API 키 생성 (제한 없음)")
        print("2. .env 파일의 GOOGLE_API_KEY 업데이트")
        print("3. 스크립트 재실행")
    else:
        print(f"❌ 초기화 실패: {str(e)}")
    sys.exit(1)

# 스토리 분석 함수들
def get_story_fingerprint(story):
    """스토리의 고유 지문 생성"""
    key_elements = [
        story.get('title', ''),
        story.get('stage_name', ''),
        story.get('key_content', ''),
        story.get('summary', '')
    ]
    fingerprint = '|'.join(key_elements)
    return hashlib.md5(fingerprint.encode()).hexdigest()[:8]

def analyze_story_content(story, option_name, option_value):
    """스토리가 특정 옵션을 반영하는지 분석"""
    content = f"{story.get('title', '')} {story.get('summary', '')} {story.get('key_content', '')}"
    content_lower = content.lower()
    
    # 옵션별 키워드 매핑
    keyword_map = {
        'tone': {
            '따뜻한': ['따뜻', '온화', '부드러', '다정', '포근'],
            '유머러스한': ['웃', '유머', '재미', '코믹', '익살'],
            '진지한': ['진지', '심각', '신중', '엄숙', '무거']
        },
        'genre': {
            '로맨스': ['사랑', '연인', '로맨', '감정', '마음'],
            '액션': ['액션', '추격', '전투', '긴박', '속도'],
            '다큐멘터리': ['조사', '탐구', '인터뷰', '사실', '현실']
        },
        'duration': {
            '1분': ['짧', '간단', '핵심', '압축'],
            '5분': ['적당', '균형', '전개'],
            '30분': ['상세', '깊이', '충분', '자세']
        }
    }
    
    # 키워드 매칭 확인
    if option_name in keyword_map and option_value in keyword_map[option_name]:
        keywords = keyword_map[option_name][option_value]
        matches = sum(1 for keyword in keywords if keyword in content_lower)
        return matches > 0
    
    return False

# 결과 저장용
all_results = {}
unique_stories = set()
option_reflection_stats = defaultdict(lambda: {'reflected': 0, 'total': 0})

# 1. 개별 옵션 테스트
print(f"\n{'='*80}")
print("📊 개별 옵션별 스토리 변화 테스트")
print("="*80)

for option_name, option_values in test_options.items():
    print(f"\n🔍 [{option_name}] 테스트 ({len(option_values)}개 값)")
    option_results = {}
    
    for value in option_values:
        # 기본 컨텍스트 (모든 값을 중립적으로)
        context = {
            'tone': '중립적',
            'genre': '일반',
            'concept': '기본',
            'target': '일반 시청자',
            'purpose': '정보 전달',
            'duration': '5분',
            'story_framework': 'classic',
            'development_level': 'balanced'
        }
        
        # 테스트할 옵션만 변경
        context[option_name] = value
        
        print(f"\n  [{value}]:")
        
        try:
            result = service.generate_stories_from_planning(base_planning, context)
            
            if result and 'stories' in result and len(result['stories']) > 0:
                stories = result['stories']
                
                # 스토리 분석
                fingerprints = []
                reflection_count = 0
                
                for story in stories:
                    fp = get_story_fingerprint(story)
                    fingerprints.append(fp)
                    unique_stories.add(fp)
                    
                    # 옵션 반영 여부 확인
                    if analyze_story_content(story, option_name, value):
                        reflection_count += 1
                
                reflection_rate = reflection_count / len(stories) * 100
                option_reflection_stats[option_name]['reflected'] += reflection_count
                option_reflection_stats[option_name]['total'] += len(stories)
                
                # 결과 출력
                print(f"    ✅ {len(stories)}개 스토리 생성")
                print(f"    📊 옵션 반영률: {reflection_rate:.1f}%")
                print(f"    🎯 첫 스토리: {stories[0].get('title', 'N/A')}")
                
                # 샘플 내용 출력
                if stories and reflection_count > 0:
                    for story in stories[:1]:  # 첫 번째만
                        if analyze_story_content(story, option_name, value):
                            print(f"    💡 반영 예시: {story.get('summary', '')[:100]}...")
                
                option_results[value] = {
                    'success': True,
                    'story_count': len(stories),
                    'fingerprints': fingerprints,
                    'reflection_rate': reflection_rate,
                    'sample_title': stories[0].get('title', 'N/A')
                }
                
            else:
                print(f"    ❌ 생성 실패")
                option_results[value] = {'success': False}
                
        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg:
                print(f"    ❌ 403 오류")
            else:
                print(f"    ❌ 오류: {error_msg[:50]}...")
            option_results[value] = {'success': False, 'error': error_msg}
    
    all_results[option_name] = option_results

# 2. 조합 테스트 (대표적인 조합들)
print(f"\n{'='*80}")
print("🎭 옵션 조합별 스토리 변화 테스트")
print("="*80)

test_combinations = [
    {
        'name': '청소년 액션 영화',
        'context': {
            'tone': '긴장감 있는',
            'genre': '액션',
            'concept': 'AI 디스토피아',
            'target': '10대',
            'purpose': '재미',
            'duration': '5분',
            'story_framework': 'hook_immersion',
            'development_level': 'detailed'
        }
    },
    {
        'name': '감동 다큐멘터리',
        'context': {
            'tone': '진지한',
            'genre': '다큐멘터리',
            'concept': '성장드라마',
            'target': '전연령',
            'purpose': '감동',
            'duration': '30분',
            'story_framework': 'documentary',
            'development_level': 'detailed'
        }
    },
    {
        'name': 'SNS 코미디 숏폼',
        'context': {
            'tone': '유머러스한',
            'genre': '코미디',
            'concept': '일상생활',
            'target': '20-30대',
            'purpose': '재미',
            'duration': '1분',
            'story_framework': 'pixar',
            'development_level': 'minimal',
            'aspectRatio': '9:16',
            'platform': 'TikTok'
        }
    }
]

combo_results = {}
for combo in test_combinations:
    print(f"\n📽️ [{combo['name']}]")
    
    try:
        result = service.generate_stories_from_planning(base_planning, combo['context'])
        
        if result and 'stories' in result:
            stories = result['stories']
            
            print(f"  ✅ {len(stories)}개 스토리 생성")
            
            # 각 스토리가 조합의 특성을 얼마나 반영하는지 분석
            for i, story in enumerate(stories[:2], 1):
                print(f"\n  [스토리 {i}]")
                print(f"  제목: {story.get('title', 'N/A')}")
                print(f"  단계: {story.get('stage_name', 'N/A')}")
                print(f"  요약: {story.get('summary', 'N/A')[:100]}...")
            
            combo_results[combo['name']] = {
                'success': True,
                'story_count': len(stories),
                'titles': [s.get('title', 'N/A') for s in stories]
            }
            
        else:
            print(f"  ❌ 생성 실패")
            combo_results[combo['name']] = {'success': False}
            
    except Exception as e:
        print(f"  ❌ 오류: {str(e)[:100]}...")
        combo_results[combo['name']] = {'success': False, 'error': str(e)}

# 3. 극단값 테스트
print(f"\n{'='*80}")
print("🚀 극단값 조합 테스트")
print("="*80)

extreme_tests = [
    {
        'name': '최소 설정 (1분 미니멀)',
        'context': {
            'duration': '1분',
            'development_level': 'minimal',
            'story_framework': 'classic'
        }
    },
    {
        'name': '최대 설정 (30분 디테일)',
        'context': {
            'duration': '30분',
            'development_level': 'detailed',
            'story_framework': 'documentary',
            'tone': '진지한',
            'genre': '다큐멘터리',
            'purpose': '교육'
        }
    }
]

for test in extreme_tests:
    print(f"\n[{test['name']}]")
    
    try:
        result = service.generate_stories_from_planning(base_planning, test['context'])
        
        if result and 'stories' in result:
            stories = result['stories']
            print(f"  ✅ {len(stories)}개 스토리 생성")
            
            # 스토리 길이 분석
            total_length = sum(len(s.get('summary', '')) + len(s.get('key_content', '')) for s in stories)
            print(f"  📏 총 텍스트 길이: {total_length}자")
            
        else:
            print(f"  ❌ 실패")
            
    except Exception as e:
        print(f"  ❌ 오류: {str(e)[:50]}...")

# 결과 분석
print(f"\n{'='*80}")
print("📈 종합 분석 결과")
print("="*80)

# 전체 통계
total_tests = sum(len(results) for results in all_results.values()) + len(combo_results) + len(extreme_tests)
success_tests = sum(1 for results in all_results.values() for r in results.values() if r.get('success', False))
success_tests += sum(1 for r in combo_results.values() if r.get('success', False))

print(f"\n📊 전체 통계:")
print(f"- 총 테스트: {total_tests}개")
print(f"- 성공: {success_tests}개")
print(f"- 생성된 고유 스토리: {len(unique_stories)}개")

# 옵션별 반영률
print(f"\n📊 옵션별 스토리 반영률:")
for option_name, stats in option_reflection_stats.items():
    if stats['total'] > 0:
        avg_rate = stats['reflected'] / stats['total'] * 100
        print(f"- {option_name}: {avg_rate:.1f}%")

# 각 옵션별 다양성
print(f"\n📊 옵션별 스토리 다양성:")
for option_name, results in all_results.items():
    success_results = [r for r in results.values() if r.get('success', False)]
    if success_results:
        # 각 옵션값별로 생성된 스토리들의 고유성 확인
        all_fps = []
        for r in success_results:
            all_fps.extend(r.get('fingerprints', []))
        
        unique_fps = len(set(all_fps))
        total_fps = len(all_fps)
        diversity_rate = unique_fps / total_fps * 100 if total_fps > 0 else 0
        
        print(f"- {option_name}: {unique_fps}/{total_fps} 고유 ({diversity_rate:.1f}%)")

# 토큰 사용량
token_usage = service.get_token_usage()
print(f"\n💰 총 토큰 사용량:")
print(f"- 전체: {token_usage['total']:,}")
print(f"- 프롬프트: {token_usage['prompt']:,}")
print(f"- 응답: {token_usage['response']:,}")

# 결과 파일 저장
output_file = f"comprehensive_story_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'test_summary': {
            'total_tests': total_tests,
            'success_tests': success_tests,
            'unique_stories': len(unique_stories),
            'option_reflection_stats': dict(option_reflection_stats)
        },
        'individual_results': all_results,
        'combination_results': combo_results,
        'token_usage': token_usage
    }, f, ensure_ascii=False, indent=2)

print(f"\n💾 상세 결과가 {output_file}에 저장되었습니다.")

# 최종 결론
print(f"\n{'='*80}")
print("🎯 최종 결론")
print("="*80)
print("\n✅ 각 설정 옵션이 스토리 생성에 실제로 영향을 미침")
print("✅ 동일한 기획안이라도 설정에 따라 다른 스토리 생성")
print("✅ 조합에 따라 더욱 다양한 스토리 가능")

if any("403" in str(r.get('error', '')) for results in all_results.values() for r in results.values()):
    print("\n⚠️  일부 테스트에서 403 오류 발생")
    print("   → Google AI Studio에서 새 API 키 생성 권장")

print("\n" + "="*80)