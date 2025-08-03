#!/usr/bin/env python
"""모든 설정 옵션별 스토리 다양성 테스트"""
import os
import sys
import django
import json
from datetime import datetime
import hashlib
from itertools import product

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from video_planning.gemini_service import GeminiService

print("=" * 80)
print("VideoPlanet 전체 옵션 다양성 테스트")
print("=" * 80)

# 테스트할 모든 옵션들
options = {
    'tone': ['따뜻한', '유머러스한', '진지한', '긴장감 있는', '감동적인'],
    'genre': ['로맨스', '액션', '코미디', '다큐멘터리', '교육'],
    'concept': ['AI 디스토피아', '시간여행', '성장드라마', '미스터리', '판타지'],
    'target': ['10대', '20-30대', '40-50대', '전연령', '어린이'],
    'purpose': ['재미', '교육', '정보전달', '감동', '설득'],
    'duration': ['1분', '3분', '5분', '10분', '30분'],
    'story_framework': ['classic', 'hook_immersion', 'pixar', 'deductive', 'inductive', 'documentary'],
    'development_level': ['minimal', 'light', 'balanced', 'detailed']
}

# 고급 옵션들
advanced_options = {
    'aspectRatio': ['16:9', '9:16', '1:1', '4:3', '21:9'],
    'platform': ['YouTube', 'Instagram', 'TikTok', 'TV', '영화관'],
    'colorTone': ['밝은', '어두운', '파스텔', '모노크롬', '고채도'],
    'editingStyle': ['빠른 편집', '롱테이크', '몽타주', '점프컷', '클래식'],
    'musicStyle': ['팝', '클래식', '앰비언트', '일렉트로닉', '무음']
}

# 기본 기획안
base_planning = """
미래 도시에서 인공지능과 인간이 공존하는 사회를 배경으로,
한 젊은 프로그래머가 AI의 숨겨진 진실을 발견하게 되는 이야기
"""

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

# 결과 저장용
all_results = {}
unique_stories = set()
total_tests = 0
success_count = 0

# 1. 기본 옵션별 테스트
print(f"\n{'='*80}")
print("📊 기본 옵션별 다양성 테스트")
print("="*80)

for option_name, option_values in options.items():
    print(f"\n🔍 {option_name} 옵션 테스트 ({len(option_values)}개 값)")
    option_results = {}
    
    for value in option_values:
        # 기본 컨텍스트 생성
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
        
        print(f"  - {value}: ", end="", flush=True)
        total_tests += 1
        
        try:
            result = service.generate_stories_from_planning(base_planning, context)
            
            if result and 'stories' in result and len(result['stories']) > 0:
                stories = result['stories']
                fingerprints = [get_story_fingerprint(s) for s in stories]
                unique_stories.update(fingerprints)
                
                option_results[value] = {
                    'success': True,
                    'story_count': len(stories),
                    'first_title': stories[0].get('title', 'N/A'),
                    'fingerprints': fingerprints
                }
                print(f"✅ {len(stories)}개 스토리 생성")
                success_count += 1
            else:
                option_results[value] = {'success': False, 'error': '스토리 없음'}
                print("❌ 실패")
                
        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg:
                print("❌ 403 오류 (API 키 제한)")
            else:
                print(f"❌ 오류: {error_msg[:50]}...")
            option_results[value] = {'success': False, 'error': error_msg}
    
    all_results[option_name] = option_results

# 2. 조합 테스트 (몇 가지 대표적인 조합만)
print(f"\n{'='*80}")
print("🎭 옵션 조합 테스트")
print("="*80)

test_combinations = [
    {
        'name': '액션 영화 스타일',
        'context': {
            'tone': '긴장감 있는',
            'genre': '액션',
            'concept': 'AI 디스토피아',
            'target': '20-30대',
            'purpose': '재미',
            'duration': '10분',
            'story_framework': 'hook_immersion',
            'development_level': 'detailed',
            'aspectRatio': '21:9',
            'platform': '영화관',
            'colorTone': '어두운',
            'editingStyle': '빠른 편집',
            'musicStyle': '일렉트로닉'
        }
    },
    {
        'name': '교육용 다큐멘터리',
        'context': {
            'tone': '진지한',
            'genre': '다큐멘터리',
            'concept': '성장드라마',
            'target': '전연령',
            'purpose': '교육',
            'duration': '30분',
            'story_framework': 'documentary',
            'development_level': 'detailed',
            'aspectRatio': '16:9',
            'platform': 'YouTube',
            'colorTone': '밝은',
            'editingStyle': '클래식',
            'musicStyle': '클래식'
        }
    },
    {
        'name': 'SNS 숏폼 콘텐츠',
        'context': {
            'tone': '유머러스한',
            'genre': '코미디',
            'concept': '판타지',
            'target': '10대',
            'purpose': '재미',
            'duration': '1분',
            'story_framework': 'pixar',
            'development_level': 'minimal',
            'aspectRatio': '9:16',
            'platform': 'TikTok',
            'colorTone': '파스텔',
            'editingStyle': '점프컷',
            'musicStyle': '팝'
        }
    }
]

combination_results = {}
for combo in test_combinations:
    print(f"\n📽️ {combo['name']} 테스트")
    total_tests += 1
    
    try:
        result = service.generate_stories_from_planning(base_planning, combo['context'])
        
        if result and 'stories' in result:
            stories = result['stories']
            fingerprints = [get_story_fingerprint(s) for s in stories]
            unique_stories.update(fingerprints)
            
            combination_results[combo['name']] = {
                'success': True,
                'story_count': len(stories),
                'titles': [s.get('title', 'N/A') for s in stories],
                'fingerprints': fingerprints
            }
            
            print(f"✅ 성공! {len(stories)}개 스토리 생성")
            for i, story in enumerate(stories[:2], 1):  # 처음 2개만 출력
                print(f"   스토리 {i}: {story.get('title', 'N/A')}")
            
            success_count += 1
        else:
            print("❌ 스토리 생성 실패")
            combination_results[combo['name']] = {'success': False}
            
    except Exception as e:
        print(f"❌ 오류: {str(e)[:100]}...")
        combination_results[combo['name']] = {'success': False, 'error': str(e)}

# 3. 극단적 조합 테스트
print(f"\n{'='*80}")
print("🚀 극단적 조합 테스트")
print("="*80)

extreme_combos = [
    {
        'name': '최소 설정',
        'context': {
            'development_level': 'minimal',
            'duration': '1분',
            'story_framework': 'classic'
        }
    },
    {
        'name': '최대 설정',
        'context': {
            **{k: v[-1] for k, v in options.items()},
            **{k: v[-1] for k, v in advanced_options.items()}
        }
    }
]

for combo in extreme_combos:
    print(f"\n🔥 {combo['name']}")
    total_tests += 1
    
    try:
        result = service.generate_stories_from_planning(base_planning, combo['context'])
        
        if result and 'stories' in result:
            stories = result['stories']
            print(f"✅ {len(stories)}개 스토리 생성")
            success_count += 1
        else:
            print("❌ 실패")
            
    except Exception as e:
        print(f"❌ 오류: {str(e)[:50]}...")

# 결과 분석
print(f"\n{'='*80}")
print("📈 최종 분석 결과")
print("="*80)

print(f"\n전체 테스트: {total_tests}개")
print(f"성공: {success_count}개 ({success_count/total_tests*100:.1f}%)")
print(f"생성된 고유 스토리: {len(unique_stories)}개")

# 옵션별 성공률 분석
print("\n📊 옵션별 성공률:")
for option_name, results in all_results.items():
    success = sum(1 for r in results.values() if r.get('success', False))
    total = len(results)
    print(f"- {option_name}: {success}/{total} ({success/total*100:.1f}%)")

# 토큰 사용량
token_usage = service.get_token_usage()
print(f"\n💰 총 토큰 사용량:")
print(f"- 전체: {token_usage['total']:,}")
print(f"- 프롬프트: {token_usage['prompt']:,}")
print(f"- 응답: {token_usage['response']:,}")

# 결과 파일 저장
output_file = f"diversity_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'test_summary': {
            'total_tests': total_tests,
            'success_count': success_count,
            'success_rate': success_count/total_tests if total_tests > 0 else 0,
            'unique_stories': len(unique_stories)
        },
        'option_results': all_results,
        'combination_results': combination_results,
        'token_usage': token_usage
    }, f, ensure_ascii=False, indent=2)

print(f"\n💾 상세 결과가 {output_file}에 저장되었습니다.")

# 403 오류 해결 제안
if any('403' in str(r.get('error', '')) for results in all_results.values() for r in results.values()):
    print("\n⚠️  403 오류 해결 방법:")
    print("1. Google Cloud Console에서 API 키 설정 확인")
    print("2. HTTP referer 제한 해제 또는 localhost 추가")
    print("3. 또는 새로운 API 키 생성 (제한 없음)")
    print("4. Railway 환경변수에도 동일하게 업데이트")

print("\n" + "="*80)
print("테스트 완료!")
print("="*80)