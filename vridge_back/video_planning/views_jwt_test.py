from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def test_jwt_auth(request):
    """JWT 인증 테스트 엔드포인트"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', 'No auth header')
    
    # 헤더 정보
    result = {
        'auth_header': auth_header,
        'user': str(request.user),
        'is_authenticated': request.user.is_authenticated,
        'headers': {}
    }
    
    # 주요 헤더 수집
    for key, value in request.META.items():
        if key.startswith('HTTP_'):
            result['headers'][key] = value
    
    # JWT 토큰 직접 파싱 시도
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            
            result['jwt_parsed'] = {
                'success': True,
                'user_id': user.id,
                'username': user.username,
                'email': user.email
            }
        except (InvalidToken, TokenError) as e:
            result['jwt_parsed'] = {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            result['jwt_parsed'] = {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }
    else:
        result['jwt_parsed'] = {
            'success': False,
            'error': 'No valid Bearer token found'
        }
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_jwt_protected(request):
    """JWT 보호 테스트 엔드포인트"""
    return Response({
        'message': 'You are authenticated!',
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email
        }
    }, status=status.HTTP_200_OK)