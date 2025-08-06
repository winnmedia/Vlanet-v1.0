"""
개선된 인증 뷰 - 401 오류 해결
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer
import logging

logger = logging.getLogger(__name__)

class ImprovedSignUp(APIView):
    """
    개선된 회원가입 뷰
    이메일 중복 체크 및 명확한 에러 메시지 제공
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = request.data
            
            # 필수 필드 검증
            required_fields = ['username', 'email', 'password', 'nickname']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'success': False,
                        'error': f'{field} is required',
                        'field': field
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # 이메일/사용자명 중복 체크
            if User.objects.filter(username=data['username']).exists():
                return Response({
                    'success': False,
                    'error': 'Username already exists',
                    'field': 'username'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(email=data['email']).exists():
                return Response({
                    'success': False,
                    'error': 'Email already exists',
                    'field': 'email'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 닉네임 중복 체크
            if User.objects.filter(nickname=data['nickname']).exists():
                return Response({
                    'success': False,
                    'error': 'Nickname already exists',
                    'field': 'nickname'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 사용자 생성
            user = User.objects.create(
                username=data['username'],
                email=data['email'],
                nickname=data['nickname'],
                password=make_password(data['password']),
                is_active=True,
                email_verified=True  # 테스트를 위해 임시로 자동 인증
            )
            
            # 토큰 생성
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'nickname': user.nickname
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Signup error: {str(e)}")
            return Response({
                'success': False,
                'error': 'Internal server error',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImprovedSignIn(APIView):
    """
    개선된 로그인 뷰
    명확한 에러 메시지 및 401 오류 해결
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = request.data
            
            # 필수 필드 검증
            if 'username' not in data or 'password' not in data:
                return Response({
                    'success': False,
                    'error': 'Username and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            username = data['username']
            password = data['password']
            
            # 사용자 조회 (이메일 또는 사용자명)
            user = None
            if '@' in username:
                # 이메일로 로그인
                try:
                    user = User.objects.get(email=username)
                    username = user.username
                except User.DoesNotExist:
                    pass
            
            # 인증 시도
            user = authenticate(username=username, password=password)
            
            if user is None:
                # 사용자가 존재하는지 확인
                if '@' in data['username']:
                    exists = User.objects.filter(email=data['username']).exists()
                else:
                    exists = User.objects.filter(username=data['username']).exists()
                
                if exists:
                    return Response({
                        'success': False,
                        'error': 'Invalid password',
                        'code': 'INVALID_PASSWORD'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    return Response({
                        'success': False,
                        'error': 'User not found',
                        'code': 'USER_NOT_FOUND'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            if not user.is_active:
                return Response({
                    'success': False,
                    'error': 'Account is inactive',
                    'code': 'INACTIVE_ACCOUNT'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 토큰 생성
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'nickname': user.nickname
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                'success': False,
                'error': 'Internal server error',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TestUserCreate(APIView):
    """
    테스트 사용자 자동 생성
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        테스트 사용자를 생성하거나 기존 사용자 정보 반환
        """
        test_users = [
            {
                'username': 'test@test.com',
                'email': 'test@test.com',
                'password': 'Test1234!',
                'nickname': 'TestUser'
            },
            {
                'username': 'demo@test.com',
                'email': 'demo@test.com',
                'password': 'Demo1234!',
                'nickname': 'DemoUser'
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'nickname': user_data['nickname'],
                    'password': make_password(user_data['password']),
                    'is_active': True,
                    'email_verified': True
                }
            )
            
            if not created:
                # 기존 사용자 비밀번호 업데이트
                user.set_password(user_data['password'])
                user.is_active = True
                user.email_verified = True
                user.save()
            
            # 토큰 생성
            refresh = RefreshToken.for_user(user)
            
            created_users.append({
                'username': user.username,
                'email': user.email,
                'password': user_data['password'],  # 테스트용이므로 비밀번호 포함
                'nickname': user.nickname,
                'created': created,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            })
        
        return Response({
            'success': True,
            'message': 'Test users ready',
            'users': created_users
        }, status=status.HTTP_200_OK)