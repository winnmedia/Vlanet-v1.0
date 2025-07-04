"""
DALL-E 이미지 생성 테스트
"""
import os
import sys

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_minimal')

import django
django.setup()

from video_planning.dalle_service import DalleService
import logging

logging.basicConfig(level=logging.DEBUG)

def test_dalle_generation():
    print("\n=== DALL-E Image Generation Test ===\n")
    
    # API 키 확인
    api_key = os.environ.get('OPENAI_API_KEY', '')
    print(f"OPENAI_API_KEY exists: {bool(api_key)}")
    if api_key:
        print(f"API Key prefix: {api_key[:10]}...")
    
    # 서비스 초기화
    try:
        service = DalleService()
        print(f"\nService available: {service.available}")
        
        if not service.available:
            print("Service not available - API key missing")
            print("Please set OPENAI_API_KEY environment variable")
            return
            
        # 테스트 프레임
        test_frame = {
            'frame_number': 1,
            'visual_description': 'A modern office with people and robots working together',
            'title': 'Future Workplace'
        }
        
        print("\nGenerating image with DALL-E 3...")
        result = service.generate_storyboard_image(test_frame)
        
        print(f"\nResult:")
        print(f"- Success: {result.get('success')}")
        if result.get('success'):
            print(f"- Image URL type: {result.get('image_url', '')[:30]}...")
            print(f"- Model used: {result.get('model_used')}")
            print(f"- Prompt used: {result.get('prompt_used')}")
            if result.get('original_url'):
                print(f"- Original URL: {result.get('original_url')}")
        else:
            print(f"- Error: {result.get('error')}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_dalle_generation()