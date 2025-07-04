"""
직접 이미지 생성 테스트
"""
import os
import sys

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_minimal')

import django
django.setup()

from video_planning.stable_diffusion_service import StableDiffusionService
import logging

logging.basicConfig(level=logging.DEBUG)

def test_direct_generation():
    print("\n=== Direct Image Generation Test ===\n")
    
    # API 키 확인
    api_key = os.environ.get('HUGGINGFACE_API_KEY', '')
    print(f"HUGGINGFACE_API_KEY exists: {bool(api_key)}")
    if api_key:
        print(f"API Key prefix: {api_key[:15]}...")
    
    # 서비스 초기화
    try:
        service = StableDiffusionService()
        print(f"\nService available: {service.available}")
        
        if not service.available:
            print("Service not available - API key missing")
            return
            
        # 테스트 프레임
        test_frame = {
            'frame_number': 1,
            'visual_description': 'simple office scene',
            'title': 'Test Frame'
        }
        
        print("\nGenerating image...")
        result = service.generate_storyboard_image(test_frame)
        
        print(f"\nResult:")
        print(f"- Success: {result.get('success')}")
        if result.get('success'):
            print(f"- Image URL length: {len(result.get('image_url', ''))}")
            print(f"- Model used: {result.get('model_used')}")
        else:
            print(f"- Error: {result.get('error')}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_direct_generation()