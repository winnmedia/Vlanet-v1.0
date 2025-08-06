"""
개선된 JWT 인증 클래스 - 2025년 최신 버전
토큰 타입 검증 및 사용자 조회 문제 완전 해결
"""

import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)
User = get_user_model()


class EnhancedJWTAuthentication(JWTAuthentication):
    """
    개선된 JWT 인증 클래스
    - username/email 둘 다 지원
    - 상세한 에러 로깅
    - 토큰 타입 검증 강화
    """
    
    def authenticate(self, request):
        """인증 메서드 오버라이드"""
        header = self.get_header(request)
        if header is None:
            return None
            
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
        
        # 토큰 검증
        validated_token = self.get_validated_token(raw_token)
        
        # 사용자 조회
        user = self.get_user(validated_token)
        
        return user, validated_token
    
    def get_validated_token(self, raw_token):
        """토큰 검증 메서드 개선"""
        messages = []
        
        try:
            # AccessToken으로 먼저 시도
            token = AccessToken(raw_token)
            
            # 토큰 타입 확인
            token_type = token.get('token_type', None)
            if token_type and token_type != 'access':
                raise TokenError(f"Invalid token type: {token_type}")
            
            # 사용자 ID 확인
            user_id = token.get('user_id', None)
            if not user_id:
                raise TokenError("Token missing user_id")
            
            logger.debug(f"Token validated for user_id: {user_id}")
            return token
            
        except TokenError as e:
            messages.append({
                'token_class': 'AccessToken',
                'token_type': 'access',
                'message': str(e)
            })
            
            # RefreshToken으로도 시도 (호환성)
            try:
                token = RefreshToken(raw_token)
                logger.warning("Access token used as refresh token - security risk!")
                raise InvalidToken({
                    'detail': 'Wrong token type. Use access token for authentication.',
                    'messages': messages
                })
            except TokenError:
                pass
        
        # 모든 시도 실패
        raise InvalidToken({
            'detail': '유효하지 않거나 만료된 토큰입니다.',
            'code': 'token_not_valid',
            'messages': messages
        })
    
    def get_user(self, validated_token):
        """사용자 조회 메서드 개선"""
        try:
            user_id = validated_token.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Token contains no user_id')
            
            # 사용자 조회
            user = User.objects.filter(id=user_id).first()
            
            if not user:
                logger.error(f"User not found for id: {user_id}")
                raise AuthenticationFailed('User not found')
            
            if not user.is_active:
                logger.warning(f"Inactive user tried to authenticate: {user_id}")
                raise AuthenticationFailed('User is inactive')
            
            # 이메일 인증 확인 (선택적)
            if hasattr(user, 'email_verified') and not user.email_verified:
                # 기존 사용자는 자동 인증
                from django.utils import timezone
                if user.date_joined.year < 2025:
                    user.email_verified = True
                    user.email_verified_at = timezone.now()
                    user.save(update_fields=['email_verified', 'email_verified_at'])
                    logger.info(f"Auto-verified legacy user: {user.username}")
            
            return user
            
        except User.DoesNotExist:
            logger.error(f"User does not exist: {user_id}")
            raise AuthenticationFailed('User not found')
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            raise AuthenticationFailed('Authentication failed')


def create_tokens_for_user(user):
    """
    사용자를 위한 JWT 토큰 생성
    
    Args:
        user: User 객체
        
    Returns:
        tuple: (access_token, refresh_token) 문자열
    """
    try:
        refresh = RefreshToken.for_user(user)
        
        # 커스텀 클레임 추가
        refresh['username'] = user.username
        refresh['email'] = user.email
        
        # 토큰 타입 명시적 설정
        refresh.access_token['token_type'] = 'access'
        refresh['token_type'] = 'refresh'
        
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        logger.info(f"Tokens created for user {user.id}")
        
        return access_token, refresh_token
        
    except Exception as e:
        logger.error(f"Token creation failed for user {user.id}: {e}")
        raise


def debug_token(token_string):
    """
    토큰 디버깅 유틸리티
    
    Args:
        token_string: JWT 토큰 문자열
        
    Returns:
        dict: 토큰 정보
    """
    try:
        # AccessToken으로 파싱 시도
        token = AccessToken(token_string)
        return {
            'valid': True,
            'type': 'access',
            'user_id': token.get('user_id'),
            'username': token.get('username'),
            'email': token.get('email'),
            'exp': token.get('exp'),
            'iat': token.get('iat'),
            'token_type': token.get('token_type', 'unknown')
        }
    except TokenError:
        try:
            # RefreshToken으로 파싱 시도
            token = RefreshToken(token_string)
            return {
                'valid': True,
                'type': 'refresh',
                'user_id': token.get('user_id'),
                'username': token.get('username'),
                'email': token.get('email'),
                'exp': token.get('exp'),
                'iat': token.get('iat'),
                'token_type': token.get('token_type', 'unknown')
            }
        except TokenError as e:
            return {
                'valid': False,
                'error': str(e)
            }


class JWTAuthenticationMiddleware:
    """
    JWT 인증 미들웨어 (선택적)
    Request에 user 객체를 자동으로 추가
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = EnhancedJWTAuthentication()
    
    def __call__(self, request):
        # 인증 시도
        try:
            auth_result = self.jwt_auth.authenticate(request)
            if auth_result:
                request.user = auth_result[0]
                request.auth = auth_result[1]
        except Exception as e:
            logger.debug(f"JWT middleware auth failed: {e}")
            # 실패해도 계속 진행 (AnonymousUser로)
        
        response = self.get_response(request)
        return response