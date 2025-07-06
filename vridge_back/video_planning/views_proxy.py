import requests
import logging
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import base64
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def proxy_image(request):
    """
    외부 이미지 URL을 프록시하여 CORS 문제를 해결합니다.
    """
    image_url = request.GET.get('url')
    
    if not image_url:
        return Response({
            'status': 'error',
            'message': '이미지 URL이 필요합니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # OpenAI URL인지 확인
        parsed_url = urlparse(image_url)
        allowed_domains = [
            'oaidalleapiprodscus.blob.core.windows.net',
            'openai.com',
            'dalle-images.s3.amazonaws.com'
        ]
        
        if not any(domain in parsed_url.netloc for domain in allowed_domains):
            logger.warning(f"Unauthorized domain access attempt: {parsed_url.netloc}")
            return Response({
                'status': 'error',
                'message': '허용되지 않은 도메인입니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 이미지 다운로드
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=30)
        
        if response.status_code != 200:
            return Response({
                'status': 'error',
                'message': f'이미지를 가져올 수 없습니다. (상태 코드: {response.status_code})'
            }, status=status.HTTP_502_BAD_GATEWAY)
        
        # Content-Type 확인
        content_type = response.headers.get('Content-Type', 'image/png')
        if not content_type.startswith('image/'):
            return Response({
                'status': 'error',
                'message': '유효한 이미지가 아닙니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # HTTP 응답으로 이미지 반환
        http_response = HttpResponse(
            response.content,
            content_type=content_type
        )
        
        # 캐시 헤더 추가
        http_response['Cache-Control'] = 'public, max-age=86400'  # 24시간 캐시
        http_response['Access-Control-Allow-Origin'] = '*'
        
        return http_response
        
    except requests.Timeout:
        return Response({
            'status': 'error',
            'message': '이미지 다운로드 시간이 초과되었습니다.'
        }, status=status.HTTP_504_GATEWAY_TIMEOUT)
    except Exception as e:
        logger.error(f"Image proxy error: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'이미지 프록시 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def convert_to_base64(request):
    """
    이미지 URL을 base64로 변환하여 반환합니다.
    """
    image_url = request.data.get('image_url')
    
    if not image_url:
        return Response({
            'status': 'error',
            'message': '이미지 URL이 필요합니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 이미지 다운로드
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=30)
        
        if response.status_code != 200:
            return Response({
                'status': 'error',
                'message': f'이미지를 가져올 수 없습니다. (상태 코드: {response.status_code})'
            }, status=status.HTTP_502_BAD_GATEWAY)
        
        # Content-Type 확인
        content_type = response.headers.get('Content-Type', 'image/png')
        if not content_type.startswith('image/'):
            return Response({
                'status': 'error',
                'message': '유효한 이미지가 아닙니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # base64로 인코딩
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        data_url = f"data:{content_type};base64,{image_base64}"
        
        return Response({
            'status': 'success',
            'data': {
                'base64_url': data_url,
                'content_type': content_type,
                'size': len(response.content)
            }
        }, status=status.HTTP_200_OK)
        
    except requests.Timeout:
        return Response({
            'status': 'error',
            'message': '이미지 다운로드 시간이 초과되었습니다.'
        }, status=status.HTTP_504_GATEWAY_TIMEOUT)
    except Exception as e:
        logger.error(f"Base64 conversion error: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'변환 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)