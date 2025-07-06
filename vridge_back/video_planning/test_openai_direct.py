#!/usr/bin/env python3
"""
Direct OpenAI API test script
"""
import os
import sys
import django

# Django 설정
sys.path.append('/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_openai_direct():
    """OpenAI API 직접 테스트"""
    
    # 1. API 키 확인
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY not found")
        return False
    
    logger.info(f"API Key found: {api_key[:10]}... (length: {len(api_key)})")
    
    # 2. OpenAI 라이브러리 import 테스트
    try:
        from openai import OpenAI
        logger.info("✅ OpenAI library imported successfully")
    except ImportError as e:
        logger.error(f"❌ Failed to import OpenAI: {e}")
        return False
    
    # 3. 클라이언트 초기화 테스트
    try:
        client = OpenAI(api_key=api_key)
        logger.info("✅ OpenAI client initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize client: {e}")
        return False
    
    # 4. 간단한 이미지 생성 테스트
    try:
        logger.info("🎨 Testing image generation...")
        
        response = client.images.generate(
            model="dall-e-3",
            prompt="pencil sketch man walks into cafe, no text",
            size="1792x1024",
            quality="standard",
            n=1,
            style="vivid"
        )
        
        if response.data and len(response.data) > 0:
            image_url = response.data[0].url
            logger.info(f"✅ Image generated successfully: {image_url[:50]}...")
            return True
        else:
            logger.error("❌ No image data received")
            return False
            
    except Exception as e:
        logger.error(f"❌ Image generation failed: {e}")
        return False

if __name__ == "__main__":
    success = test_openai_direct()
    if success:
        print("🎉 OpenAI API test PASSED!")
    else:
        print("💥 OpenAI API test FAILED!")
    sys.exit(0 if success else 1)