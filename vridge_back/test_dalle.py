#!/usr/bin/env python
import os
import sys
import django
import logging
from datetime import datetime

# Django 환경 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from video_planning.dalle_service import DalleService

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_dalle_generation():
    """DALL-E 이미지 생성 테스트"""
    
    # DalleService 초기화
    logger.info("=" * 50)
    logger.info("🎨 DALL-E 이미지 생성 테스트 시작")
    logger.info("=" * 50)
    
    dalle_service = DalleService()
    
    if not dalle_service.available:
        logger.error("❌ DALL-E 서비스를 사용할 수 없습니다.")
        return
    
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
    
    # 각 스타일로 테스트
    styles = ['minimal', 'realistic', 'sketch', 'cartoon', 'cinematic']
    
    for frame_data in test_frames:
        logger.info("\n" + "=" * 50)
        logger.info(f"📸 프레임 {frame_data['frame_number']} 테스트")
        logger.info(f"   설명: {frame_data['visual_description']}")
        logger.info(f"   구도: {frame_data['composition']}")
        logger.info(f"   조명: {frame_data['lighting']}")
        logger.info("=" * 50)
        
        # 기본 스타일(sketch)로 생성
        logger.info("\n🎨 기본 스타일(sketch)로 생성 중...")
        
        # 프롬프트 미리보기
        test_prompt = dalle_service._create_storyboard_prompt(frame_data, 'sketch')
        logger.info(f"\n📝 생성된 프롬프트:")
        logger.info(f"   {test_prompt}")
        
        # 금지 단어 체크
        forbidden_words = ['frame', 'scene', 'storyboard', 'Frame', 'Scene', 'Storyboard']
        found_forbidden = [word for word in forbidden_words if word.lower() in test_prompt.lower()]
        
        if found_forbidden:
            logger.warning(f"⚠️  금지 단어 발견: {found_forbidden}")
        else:
            logger.info("✅ 금지 단어가 포함되지 않았습니다!")
        
        # 실제 이미지 생성
        result = dalle_service.generate_storyboard_image(frame_data, 'sketch')
        
        if result['success']:
            logger.info("✅ 이미지 생성 성공!")
            logger.info(f"   모델: {result.get('model_used', 'Unknown')}")
            logger.info(f"   이미지 URL 타입: {'base64' if result['image_url'].startswith('data:') else 'URL'}")
            if result.get('original_url'):
                logger.info(f"   원본 URL: {result['original_url'][:100]}...")
            
            # 이미지 저장 (선택사항)
            if result['image_url'].startswith('data:'):
                try:
                    import base64
                    img_data = result['image_url'].split(',')[1]
                    img_bytes = base64.b64decode(img_data)
                    
                    # 테스트 결과 디렉토리 생성
                    output_dir = "/home/winnmedia/VideoPlanet/vridge_back/test_results"
                    os.makedirs(output_dir, exist_ok=True)
                    
                    # 파일명 생성
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"frame_{frame_data['frame_number']}_{timestamp}.png"
                    filepath = os.path.join(output_dir, filename)
                    
                    # 이미지 저장
                    with open(filepath, 'wb') as f:
                        f.write(img_bytes)
                    logger.info(f"   💾 이미지 저장: {filepath}")
                except Exception as e:
                    logger.error(f"   이미지 저장 실패: {e}")
        else:
            logger.error(f"❌ 이미지 생성 실패: {result['error']}")
        
        # 다른 스타일 프롬프트 미리보기 (실제 생성은 하지 않음)
        logger.info("\n📋 다른 스타일의 프롬프트 미리보기:")
        for style in styles[:3]:  # 처음 3개만
            if style != 'sketch':
                test_prompt = dalle_service._create_storyboard_prompt(frame_data, style)
                logger.info(f"\n   {style} 스타일: {test_prompt}")
    
    logger.info("\n" + "=" * 50)
    logger.info("🎨 DALL-E 테스트 완료!")
    logger.info("=" * 50)

if __name__ == "__main__":
    test_dalle_generation()