from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def check_services_status(request):
    """이미지 생성 서비스 상태를 확인합니다."""
    
    # 환경변수 확인
    google_api_key = os.environ.get('GOOGLE_API_KEY', '')
    openai_api_key = os.environ.get('OPENAI_API_KEY', '')
    
    # 서비스 초기화 시도
    service_status = {
        'google_api_key_exists': bool(google_api_key),
        'google_api_key_length': len(google_api_key) if google_api_key else 0,
        'openai_api_key_exists': bool(openai_api_key),
        'openai_api_key_length': len(openai_api_key) if openai_api_key else 0,
        'openai_api_key_prefix': openai_api_key[:10] + '...' if len(openai_api_key) > 10 else openai_api_key,
    }
    
    # 서비스 가용성 확인
    try:
        from .gemini_service import GeminiService
        gemini = GeminiService()
        service_status['gemini_service'] = 'initialized'
        service_status['image_service_available'] = gemini.image_service_available
        service_status['placeholder_service_available'] = gemini.placeholder_service is not None
    except Exception as e:
        service_status['gemini_service'] = f'error: {str(e)}'
        service_status['image_service_available'] = False
        service_status['placeholder_service_available'] = False
    
    # DALL-E 서비스 직접 확인
    try:
        from .dalle_service import DalleService
        dalle = DalleService()
        service_status['dalle'] = {
            'initialized': True,
            'available': dalle.available,
            'model': 'dall-e-3'
        }
    except Exception as e:
        service_status['dalle'] = {
            'initialized': False,
            'error': str(e)
        }
    
    # 플레이스홀더 서비스 확인
    try:
        from .placeholder_image_service import PlaceholderImageService
        ph = PlaceholderImageService()
        service_status['placeholder'] = {
            'initialized': True,
            'available': ph.available
        }
    except Exception as e:
        service_status['placeholder'] = {
            'initialized': False,
            'error': str(e)
        }
    
    # POST 요청일 경우 이미지 생성 테스트
    if request.method == 'POST':
        test_result = {}
        if service_status.get('dalle', {}).get('available'):
            try:
                from .dalle_service import DalleService
                dalle = DalleService()
                test_frame = {
                    'frame_number': 1,
                    'visual_description': 'simple test image',
                    'title': 'Test'
                }
                result = dalle.generate_storyboard_image(test_frame)
                test_result['image_generation'] = result
                
                # API 키 확인 (키는 숨김)
                test_result['api_key_info'] = {
                    'key_exists': bool(dalle.api_key),
                    'key_format': dalle.api_key[:10] + '...' if dalle.api_key and len(dalle.api_key) > 10 else None
                }
            except Exception as e:
                test_result['image_generation'] = {'error': str(e)}
        else:
            test_result['image_generation'] = {'error': 'Service not available'}
        
        service_status['test_result'] = test_result
    
    return Response({
        'status': 'success',
        'services': service_status,
        'settings': {
            'debug': settings.DEBUG,
            'settings_module': os.environ.get('DJANGO_SETTINGS_MODULE', 'not set')
        }
    }, status=status.HTTP_200_OK)