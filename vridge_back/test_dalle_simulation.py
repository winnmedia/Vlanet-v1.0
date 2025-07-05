#!/usr/bin/env python
import os
import sys
import django
import logging
import json
from datetime import datetime

# Django 환경 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from video_planning.dalle_service import DalleService

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def analyze_prompts():
    """생성된 프롬프트 분석 및 테스트 결과 시뮬레이션"""
    
    logger.info("=" * 70)
    logger.info("🎨 DALL-E 프롬프트 분석 및 개선 사항")
    logger.info("=" * 70)
    
    # DalleService 인스턴스 생성 (API 키 없이)
    os.environ['OPENAI_API_KEY'] = 'dummy-key-for-testing'
    dalle_service = DalleService()
    
    # 테스트 프레임 데이터
    test_frames = [
        {
            "frame_number": 1,
            "visual_description": "카페에 들어가는 남자",
            "composition": "미디엄샷",
            "lighting": "자연광"
        },
        {
            "frame_number": 2,
            "visual_description": "회의실에서 프레젠테이션하는 여성",
            "composition": "와이드샷",
            "lighting": "실내조명"
        },
        {
            "frame_number": 3,
            "visual_description": "공원에서 뛰어노는 아이들",
            "composition": "풀샷",
            "lighting": "황금시간대"
        }
    ]
    
    # 각 프레임에 대한 분석
    results = []
    
    for frame in test_frames:
        logger.info(f"\n{'='*70}")
        logger.info(f"📸 프레임 {frame['frame_number']} 분석")
        logger.info(f"{'='*70}")
        
        result = {
            "frame_number": frame['frame_number'],
            "original_description": frame['visual_description'],
            "prompts": {}
        }
        
        # 주요 스타일들로 프롬프트 생성
        styles = ['sketch', 'realistic', 'cartoon', 'watercolor', 'cinematic']
        
        for style in styles:
            prompt = dalle_service._create_storyboard_prompt(frame, style)
            result['prompts'][style] = prompt
            
            logger.info(f"\n🎨 {style.upper()} 스타일:")
            logger.info(f"   프롬프트: {prompt}")
            
            # 프롬프트 품질 체크
            issues = []
            
            # 1. 금지 단어 체크
            forbidden_words = ['frame', 'scene', 'storyboard', 'panel', 'text', 'written']
            found_forbidden = [w for w in forbidden_words if w.lower() in prompt.lower()]
            if found_forbidden:
                issues.append(f"금지 단어 포함: {found_forbidden}")
            
            # 2. 한국어 잔존 체크
            korean_chars = [char for char in prompt if ord('가') <= ord(char) <= ord('힣')]
            if korean_chars:
                korean_text = ''.join(korean_chars)
                issues.append(f"한국어 미번역: {korean_text}")
            
            # 3. 문법 오류 체크
            if '  ' in prompt:
                issues.append("연속 공백 발견")
            if prompt.endswith(','):
                issues.append("끝에 쉼표")
            if ', ,' in prompt or ' ,' in prompt:
                issues.append("빈 구문 존재")
            
            # 4. 길이 체크
            if len(prompt) > 1000:
                issues.append(f"프롬프트 너무 김: {len(prompt)}자")
            elif len(prompt) < 50:
                issues.append(f"프롬프트 너무 짧음: {len(prompt)}자")
            
            if issues:
                logger.warning(f"   ⚠️  문제점: {', '.join(issues)}")
            else:
                logger.info(f"   ✅ 품질 검사 통과")
        
        results.append(result)
    
    # 예상 DALL-E 응답 시뮬레이션
    logger.info(f"\n{'='*70}")
    logger.info("🔮 예상 DALL-E 이미지 생성 결과")
    logger.info(f"{'='*70}")
    
    for result in results:
        logger.info(f"\n📸 프레임 {result['frame_number']}: {result['original_description']}")
        
        # sketch 스타일 프롬프트로 예상 결과
        sketch_prompt = result['prompts']['sketch']
        logger.info(f"\n   최종 프롬프트: {sketch_prompt}")
        
        # 예상 이미지 특성
        logger.info("\n   예상 이미지 특성:")
        
        if "pencil sketch" in sketch_prompt:
            logger.info("   - 흑백 연필 스케치 스타일")
        if "hand-drawn" in sketch_prompt:
            logger.info("   - 손으로 그린 듯한 느낌")
        if "soft shading" in sketch_prompt:
            logger.info("   - 부드러운 음영 처리")
        
        # 한국어가 남아있는 경우 경고
        if any(ord('가') <= ord(char) <= ord('힣') for char in sketch_prompt):
            logger.warning("   ⚠️  한국어가 포함되어 있어 DALL-E가 이해하지 못할 수 있습니다!")
        
        # 구도 분석
        if "wide" in sketch_prompt.lower():
            logger.info("   - 넓은 화각의 전체적인 장면")
        elif "medium" in sketch_prompt.lower() or "waist up" in sketch_prompt.lower():
            logger.info("   - 인물의 상반신이 보이는 중간 샷")
        elif "close" in sketch_prompt.lower() or "face" in sketch_prompt.lower():
            logger.info("   - 얼굴에 초점을 맞춘 클로즈업")
        elif "full figure" in sketch_prompt.lower():
            logger.info("   - 전신이 보이는 풀샷")
    
    # 개선 권장사항
    logger.info(f"\n{'='*70}")
    logger.info("💡 개선 권장사항")
    logger.info(f"{'='*70}")
    
    logger.info("\n1. 한국어 번역 개선:")
    logger.info("   - '~에 들어가는' → 'entering'")
    logger.info("   - '~에서' → 'in' 또는 'at'")
    logger.info("   - '~하는' → 동사의 -ing 형태")
    
    logger.info("\n2. 프롬프트 구조 개선:")
    logger.info("   - 현재: [스타일], [장소]에 [동작] [인물], [구도], [조명]")
    logger.info("   - 개선: [스타일], [인물] [동작] in [장소], [구도], [조명]")
    
    logger.info("\n3. 텍스트 없는 순수 일러스트레이션을 위해:")
    logger.info("   - 'no text' 추가 고려")
    logger.info("   - 'illustration only' 추가 고려")
    logger.info("   - 'wordless' 추가 고려")
    
    # 결과 저장
    output_dir = "/home/winnmedia/VideoPlanet/vridge_back/test_results"
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = os.path.join(output_dir, f"dalle_analysis_{timestamp}.json")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info(f"\n📊 분석 결과 저장: {report_file}")

if __name__ == "__main__":
    analyze_prompts()