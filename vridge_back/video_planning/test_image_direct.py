import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_minimal')

import django
django.setup()

from video_planning.stable_diffusion_service import StableDiffusionService

def test_image_generation():
    print("=== Direct Image Generation Test ===\n")
    
    # API 키 확인
    api_key = os.environ.get('HUGGINGFACE_API_KEY')
    print(f"HUGGINGFACE_API_KEY exists: {bool(api_key)}")
    if api_key:
        print(f"API Key length: {len(api_key)}")
        print(f"API Key prefix: {api_key[:10]}...")
    
    # 서비스 초기화
    try:
        service = StableDiffusionService()
        print(f"\nService initialized: {service.available}")
        print(f"Using model: {service.models[0]}")
    except Exception as e:
        print(f"Service initialization failed: {e}")
        return
    
    # 테스트 프레임 데이터
    test_frame = {
        'frame_number': 1,
        'title': 'Test Frame',
        'visual_description': 'office with computer and robot',
        'action': 'robot working with human',
        'shot_type': 'wide'
    }
    
    print("\nGenerating image...")
    print(f"Frame data: {test_frame}")
    
    # 이미지 생성
    result = service.generate_storyboard_image(test_frame)
    
    print(f"\nResult:")
    print(f"Success: {result.get('success')}")
    if result.get('success'):
        print(f"Image URL length: {len(result.get('image_url', ''))}")
        print(f"Model used: {result.get('model_used')}")
        print(f"Prompt used: {result.get('prompt_used')}")
    else:
        print(f"Error: {result.get('error')}")
        if result.get('models_tried'):
            print(f"Models tried: {result.get('models_tried')}")

if __name__ == '__main__':
    test_image_generation()