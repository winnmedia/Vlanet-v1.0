#!/usr/bin/env python
"""
DALL-E 3 프롬프트 생성 테스트 스크립트
이 스크립트는 개선된 프롬프트 생성 시스템이 올바르게 작동하는지 검증합니다.
"""

import os
import sys
import django
import json
from datetime import datetime

# Django 설정
sys.path.append('/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from video_planning.dalle_service import DalleService
from video_planning.gemini_service import GeminiService

def test_korean_to_english_translation():
    """한국어를 영어로 번역하는 기능 테스트"""
    print("\n🔤 한국어 -> 영어 번역 테스트")
    print("=" * 50)
    
    dalle = DalleService()
    
    test_cases = [
        "카페에 들어가는 남자",
        "신당에서 무당이 손님과 앉아있고 햇살이 창으로 비춰진다",
        "회의실에서 프레젠테이션하는 여성",
        "공원에서 뛰어노는 아이들",
        "클로즈업: 두 사람이 손을 잡는 장면",
        "와이드샷: 사무실 전경"
    ]
    
    for korean_text in test_cases:
        # 영어 체크
        is_english = dalle._is_english(korean_text)
        
        # 번역
        if not is_english:
            english_text = dalle._translate_korean_to_english(korean_text)
            print(f"\n한국어: {korean_text}")
            print(f"영어: {english_text}")
            print(f"영어 감지: {is_english}")
        else:
            print(f"\n이미 영어: {korean_text}")

def test_prompt_generation():
    """프롬프트 생성 테스트"""
    print("\n\n🎨 DALL-E 3 프롬프트 생성 테스트")
    print("=" * 50)
    
    dalle = DalleService()
    
    test_frames = [
        {
            'frame_number': 1,
            'visual_description': '카페에 들어가는 남자',
            'composition': '미디엄샷',
            'lighting': '자연광',
            'title': '카페 입구'
        },
        {
            'frame_number': 2,
            'visual_description': '신당에서 무당이 손님과 앉아있고 햇살이 창으로 비춰진다',
            'composition': '와이드샷',
            'lighting': '부드러운조명',
            'title': '신당 내부'
        },
        {
            'frame_number': 3,
            'visual_description': 'wide shot of modern office interior with people working at computers',
            'composition': 'wide shot',
            'lighting': 'bright',
            'title': 'Office Scene'
        }
    ]
    
    styles = ['minimal', 'realistic', 'sketch', 'cinematic']
    
    for frame in test_frames:
        print(f"\n\n프레임 #{frame['frame_number']}: {frame['title']}")
        print("-" * 40)
        print(f"원본 설명: {frame['visual_description']}")
        
        for style in styles:
            prompt = dalle._create_visual_prompt(frame, style)
            print(f"\n{style} 스타일 프롬프트:")
            print(f"  {prompt}")

def test_forbidden_words_removal():
    """금지 단어 제거 테스트"""
    print("\n\n🚫 금지 단어 제거 테스트")
    print("=" * 50)
    
    dalle = DalleService()
    
    test_texts = [
        "Frame #1: Man entering cafe",
        "Scene 1: Office interior",
        "Storyboard panel showing person walking",
        "프레임 1: 카페 입구 장면",
        "장면 설명: 회의실에서 프레젠테이션"
    ]
    
    for text in test_texts:
        cleaned = dalle._remove_forbidden_words(text)
        print(f"\n원본: {text}")
        print(f"정리됨: {cleaned}")

def test_gemini_storyboard_generation():
    """Gemini의 스토리보드 생성 프롬프트 테스트"""
    print("\n\n🤖 Gemini 스토리보드 생성 지침 테스트")
    print("=" * 50)
    
    try:
        gemini = GeminiService()
        
        # 테스트용 샷 데이터
        test_shot = {
            'shot_number': 1,
            'shot_type': '미디엄샷',
            'description': '주인공이 카페에 들어가는 장면',
            'camera_movement': '고정',
            'duration': '3초'
        }
        
        # 프롬프트 확인 (실제 API 호출 없이)
        prompt = f"""
        당신은 전문 스토리보드 아티스트입니다. 아래 숏 정보를 바탕으로 DALL-E 3가 생성할 수 있는 상세한 시각적 콘티를 작성해주세요.
        
        ⚠️ 중요: visual_description은 DALL-E 3가 이미지를 생성할 때 사용됩니다. 다음 가이드라인을 반드시 따라주세요:
        
        ✅ visual_description 작성 규칙:
        1. 시각적 묘사 중심으로 작성 (장면, 인물 외형, 배경, 감정, 행동 등 구체적으로)
        2. 인물 묘사시: 성별, 나이대, 표정, 옷차림, 제스처, 위치 포함
        3. 카메라 뷰 포함: "wide shot", "close-up", "medium shot", "over-the-shoulder" 등
        4. 구체적인 환경 묘사: 시간대, 조명, 날씨, 분위기
        5. 모든 설명은 영어로 작성
        
        ❌ 절대 포함하면 안 되는 것들:
        - "Frame", "Scene", "Storyboard", "Panel" 등의 단어
        - 텍스트나 글자가 들어간 표현
        - 추상적이거나 개념적인 설명
        
        샷 정보:
        {json.dumps(test_shot, ensure_ascii=False, indent=2)}
        """
        
        print("Gemini에게 전달될 프롬프트 일부:")
        print(prompt[:500] + "...")
        
    except Exception as e:
        print(f"Gemini 서비스 초기화 실패: {e}")

def test_full_workflow():
    """전체 워크플로우 테스트"""
    print("\n\n🔄 전체 워크플로우 시뮬레이션")
    print("=" * 50)
    
    # 1. 한국어 시각 설명
    korean_desc = "신당에서 무당이 손님과 마주 앉아 있다. 향이 피어오르고 촛불이 은은하게 타오른다."
    print(f"1️⃣ 원본 한국어 설명:\n   {korean_desc}")
    
    # 2. DALL-E 서비스로 프롬프트 생성
    dalle = DalleService()
    frame_data = {
        'frame_number': 1,
        'visual_description': korean_desc,
        'composition': '미디엄샷',
        'lighting': '촛불',
        'title': '신당 상담 장면'
    }
    
    # 3. 각 스타일별 프롬프트 생성
    print("\n2️⃣ 생성된 DALL-E 프롬프트:")
    for style in ['minimal', 'realistic', 'cinematic']:
        prompt = dalle._create_visual_prompt(frame_data, style)
        print(f"\n   [{style}] {prompt}")
    
    # 4. 예상 결과
    print("\n3️⃣ 예상 결과:")
    print("   - 텍스트 없는 순수한 시각적 이미지")
    print("   - 무당과 손님이 마주 앉은 장면")
    print("   - 향과 촛불이 있는 신비로운 분위기")
    print("   - 프레임이나 텍스트 박스 없음")

def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 60)
    print("🚀 DALL-E 3 프롬프트 생성 시스템 테스트")
    print("=" * 60)
    print(f"테스트 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 각 테스트 실행
    test_korean_to_english_translation()
    test_prompt_generation()
    test_forbidden_words_removal()
    test_gemini_storyboard_generation()
    test_full_workflow()
    
    print("\n\n" + "=" * 60)
    print("✅ 모든 테스트 완료!")
    print("=" * 60)
    
    # 실제 API 테스트 안내
    print("\n💡 실제 이미지 생성 테스트를 하려면:")
    print("   1. /api/video-planning/debug/test-prompt/ 엔드포인트 사용")
    print("   2. /api/video-planning/debug/test-openai/ 엔드포인트 사용")
    print("   3. 또는 실제 스토리보드 생성 API 호출")

if __name__ == "__main__":
    main()