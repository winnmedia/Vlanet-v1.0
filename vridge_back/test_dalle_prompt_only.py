#!/usr/bin/env python
import os
import sys
import django
import logging

# Django 환경 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# 더미 API 키 설정 (프롬프트 테스트용)
os.environ['OPENAI_API_KEY'] = 'test-key-for-prompt-generation'
django.setup()

from video_planning.dalle_service import DalleService

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_prompt_generation():
    """DALL-E 프롬프트 생성만 테스트"""
    
    logger.info("=" * 50)
    logger.info("🎨 DALL-E 프롬프트 생성 테스트")
    logger.info("=" * 50)
    
    # DalleService의 프롬프트 생성 메서드 직접 사용
    dalle_service = DalleService()
    
    # 테스트할 프레임 데이터
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
    
    # 다양한 스타일로 프롬프트 생성
    styles = ['minimal', 'realistic', 'sketch', 'cartoon', 'cinematic', 'watercolor', 'digital', 'noir', 'pastel', 'comic']
    
    for frame_data in test_frames:
        logger.info("\n" + "=" * 50)
        logger.info(f"📸 프레임 {frame_data['frame_number']} 프롬프트 테스트")
        logger.info(f"   설명: {frame_data['visual_description']}")
        logger.info(f"   구도: {frame_data['composition']}")
        logger.info(f"   조명: {frame_data['lighting']}")
        logger.info("=" * 50)
        
        # 각 스타일별로 프롬프트 생성
        for style in styles:
            prompt = dalle_service._create_storyboard_prompt(frame_data, style)
            
            logger.info(f"\n🎨 {style} 스타일:")
            logger.info(f"   {prompt}")
            
            # 금지 단어 체크
            forbidden_words = ['frame', 'scene', 'storyboard', 'Frame', 'Scene', 'Storyboard', 'panel', 'text', 'written', 'caption']
            found_forbidden = [word for word in forbidden_words if word.lower() in prompt.lower()]
            
            if found_forbidden:
                logger.warning(f"   ⚠️  금지 단어 발견: {found_forbidden}")
            else:
                logger.info(f"   ✅ 금지 단어 없음")
    
    # 특수 케이스 테스트
    logger.info("\n" + "=" * 50)
    logger.info("🔬 특수 케이스 테스트")
    logger.info("=" * 50)
    
    special_cases = [
        {
            "visual_description": "Frame 1: 사무실에서 일하는 30대 남성",
            "composition": "클로즈업",
            "lighting": "부드러운 조명"
        },
        {
            "visual_description": "Scene 2: 공원 벤치에 앉아있는 여성과 아이",
            "composition": "투샷",
            "lighting": "자연광"
        },
        {
            "visual_description": "Storyboard frame: 도시 전경",
            "composition": "익스트림 와이드샷",
            "lighting": "황금시간대"
        }
    ]
    
    for i, frame_data in enumerate(special_cases, 1):
        logger.info(f"\n📌 특수 케이스 {i}: {frame_data['visual_description']}")
        prompt = dalle_service._create_storyboard_prompt(frame_data, 'sketch')
        logger.info(f"   원본: {frame_data['visual_description']}")
        logger.info(f"   변환: {prompt}")
        
        # 금지 단어가 제거되었는지 확인
        if any(word in frame_data['visual_description'].lower() for word in ['frame', 'scene', 'storyboard']):
            if not any(word in prompt.lower() for word in ['frame', 'scene', 'storyboard']):
                logger.info("   ✅ 금지 단어가 성공적으로 제거되었습니다!")
            else:
                logger.warning("   ⚠️  금지 단어가 여전히 남아있습니다!")

if __name__ == "__main__":
    test_prompt_generation()