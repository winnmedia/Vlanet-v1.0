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
def test_openai_direct(request):
    """OpenAI API 직접 테스트"""
    try:
        # API 키 확인
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return Response({
                'status': 'error',
                'message': 'OPENAI_API_KEY not found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Direct test - API Key: {api_key[:10]}... (length: {len(api_key)})")
        
        # OpenAI 라이브러리 import
        from openai import OpenAI
        logger.info("✅ OpenAI library imported")
        
        # 클라이언트 초기화 - 프록시 관련 이슈 해결
        try:
            client = OpenAI(api_key=api_key)
            logger.info("✅ OpenAI client initialized (method 1)")
        except Exception as e1:
            logger.warning(f"Method 1 failed (proxy issue?): {e1}")
            try:
                # 프록시 환경변수 제거
                for proxy_var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
                    if proxy_var in os.environ:
                        logger.info(f"Removing proxy env var: {proxy_var}")
                        del os.environ[proxy_var]
                
                # 환경변수 설정 후 재시도
                os.environ['OPENAI_API_KEY'] = api_key
                client = OpenAI()
                logger.info("✅ OpenAI client initialized (method 2)")
            except Exception as e2:
                logger.error(f"Method 2 failed: {e2}")
                try:
                    # 방법 3: httpx 클라이언트 사용
                    import httpx
                    client = OpenAI(
                        api_key=api_key,
                        http_client=httpx.Client()
                    )
                    logger.info("✅ OpenAI client initialized (method 3)")
                except Exception as e3:
                    logger.error(f"All methods failed: {e3}")
                    raise e3
        
        # 이미지 생성 테스트
        logger.info("🎨 Testing DALL-E 3 image generation...")
        
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
            logger.info(f"✅ Image generated: {image_url[:50]}...")
            
            return Response({
                'status': 'success',
                'message': 'OpenAI API test PASSED!',
                'data': {
                    'image_url': image_url,
                    'api_key_length': len(api_key),
                    'client_initialized': True
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': 'No image data received'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"❌ Direct OpenAI test failed: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'OpenAI test failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        
        # 요청에서 테스트 프롬프트 가져오기
        test_prompt = request.data.get('test_prompt', '카페에 들어가는 남자')
        test_style = request.data.get('test_style', 'minimal')
        
        # DALL-E 서비스가 사용 불가능하더라도 강제로 테스트 진행
        try:
            from .dalle_service import DalleService
            dalle = DalleService()
            
            # 실제 프롬프트 생성 과정 테스트
            test_frame = {
                'frame_number': 1,
                'visual_description': test_prompt,
                'title': 'Test',
                'composition': '미디엄샷',
                'lighting': '자연광'
            }
            
            # 강제로 이미지 생성 시도 (available 체크 무시)
            try:
                # 프롬프트 생성 과정 로깅
                generated_prompt = dalle._create_visual_prompt(test_frame, test_style)
                logger.info(f"Generated prompt: {generated_prompt}")
                
                # 강제 이미지 생성 시도
                if dalle.client:
                    logger.info("Forcing image generation despite availability status...")
                    result = dalle.generate_storyboard_image(test_frame, style=test_style)
                else:
                    logger.error("No OpenAI client available - attempting manual initialization")
                    # 수동으로 클라이언트 초기화 시도
                    try:
                        from openai import OpenAI
                        import os
                        
                        # API 키 직접 설정
                        api_key = os.environ.get('OPENAI_API_KEY')
                        if api_key:
                            logger.info(f"Manual initialization with key: {api_key[:10]}...")
                            client = OpenAI(api_key=api_key)
                            
                            # 테스트 API 호출
                            response = client.images.generate(
                                model="dall-e-3",
                                prompt=generated_prompt,
                                size="1792x1024",
                                quality="standard",
                                n=1,
                                style="vivid"
                            )
                            
                            if response.data and len(response.data) > 0:
                                image_url = response.data[0].url
                                result = {
                                    'success': True,
                                    'image_url': image_url,
                                    'manual_init': True
                                }
                            else:
                                result = {'success': False, 'error': 'No image data received'}
                        else:
                            result = {'success': False, 'error': 'No API key found in environment'}
                    except Exception as manual_e:
                        logger.error(f"Manual initialization failed: {str(manual_e)}", exc_info=True)
                        result = {'success': False, 'error': f'Manual init failed: {str(manual_e)}'}
                
                test_result['image_generation'] = {
                    'success': result['success'],
                    'generated_prompt': generated_prompt,
                    'has_image_url': bool(result.get('image_url')),
                    'error': result.get('error') if not result['success'] else None
                }
            except Exception as img_e:
                logger.error(f"Image generation failed: {str(img_e)}", exc_info=True)
                test_result['image_generation'] = {'error': f'Image generation failed: {str(img_e)}'}
            
            # API 키 및 클라이언트 상태 상세 정보
            test_result['api_key_info'] = {
                'key_exists': bool(dalle.api_key),
                'key_length': len(dalle.api_key) if dalle.api_key else 0,
                'key_format': dalle.api_key[:10] + '...' if dalle.api_key and len(dalle.api_key) > 10 else None,
                'client_initialized': dalle.client is not None,
                'service_available': dalle.available
            }
            
        except Exception as e:
            test_result['image_generation'] = {'error': f'Service initialization failed: {str(e)}'}
            logger.error(f"DALL-E service test failed: {str(e)}", exc_info=True)
        
        service_status['test_result'] = test_result
    
    return Response({
        'status': 'success',
        'services': service_status,
        'settings': {
            'debug': settings.DEBUG,
            'settings_module': os.environ.get('DJANGO_SETTINGS_MODULE', 'not set')
        }
    }, status=status.HTTP_200_OK)