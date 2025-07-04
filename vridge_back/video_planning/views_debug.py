from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_services_status(request):
    """이미지 생성 서비스 상태를 확인합니다."""
    
    # 환경변수 확인
    google_api_key = os.environ.get('GOOGLE_API_KEY', '')
    huggingface_api_key = os.environ.get('HUGGINGFACE_API_KEY', '')
    
    # 서비스 초기화 시도
    service_status = {
        'google_api_key_exists': bool(google_api_key),
        'google_api_key_length': len(google_api_key) if google_api_key else 0,
        'huggingface_api_key_exists': bool(huggingface_api_key),
        'huggingface_api_key_length': len(huggingface_api_key) if huggingface_api_key else 0,
        'huggingface_api_key_prefix': huggingface_api_key[:10] + '...' if len(huggingface_api_key) > 10 else huggingface_api_key,
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
    
    # StableDiffusion 서비스 직접 확인
    try:
        from .stable_diffusion_service import StableDiffusionService
        sd = StableDiffusionService()
        service_status['stable_diffusion'] = {
            'initialized': True,
            'available': sd.available,
            'models': sd.models,
            'current_model': sd.models[sd.current_model_index] if sd.models else None
        }
    except Exception as e:
        service_status['stable_diffusion'] = {
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
    
    return Response({
        'status': 'success',
        'services': service_status,
        'settings': {
            'debug': settings.DEBUG,
            'settings_module': os.environ.get('DJANGO_SETTINGS_MODULE', 'not set')
        }
    }, status=status.HTTP_200_OK)