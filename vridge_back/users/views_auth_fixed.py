"""
개선된 인증 뷰 - 2025년 최신 버전
JWT 인증 문제를 완전히 해결한 로그인/회원가입 시스템
"""

import json
import logging
from django.views import View
from django.http import JsonResponse
from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.db import transaction, models
from rest_framework_simplejwt.tokens import RefreshToken
from .jwt_auth_fixed import create_tokens_for_user, debug_token
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()


@method_decorator(csrf_exempt, name='dispatch')
class ImprovedSignIn(View):
    """
    개선된 로그인 뷰
    - username/email 둘 다 지원
    - 상세한 에러 메시지
    - 토큰 생성 최적화
    """
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            login_id = data.get("email") or data.get("username")
            password = data.get("password")
            
            # 입력 검증
            if not login_id or not password:
                return JsonResponse({
                    "success": False,
                    "message": "이메일과 비밀번호를 입력해주세요.",
                    "error_code": "MISSING_CREDENTIALS"
                }, status=400)
            
            # 로깅 (비밀번호 제외)
            logger.info(f"Login attempt for: {login_id}")
            
            # 사용자 찾기 - username과 email 모두 시도
            user = None
            
            # 1. username으로 시도
            user = authenticate(request, username=login_id, password=password)
            
            # 2. email로 시도
            if not user:
                email_user = User.objects.filter(email=login_id).first()
                if email_user:
                    user = authenticate(request, username=email_user.username, password=password)
            
            # 3. 인증 실패 처리
            if not user:
                # 사용자 존재 여부 확인 (디버깅용)
                user_exists = User.objects.filter(
                    models.Q(username=login_id) | models.Q(email=login_id)
                ).exists()
                
                if user_exists:
                    logger.warning(f"Password mismatch for user: {login_id}")
                    return JsonResponse({
                        "success": False,
                        "message": "비밀번호가 올바르지 않습니다.",
                        "error_code": "INVALID_PASSWORD"
                    }, status=401)
                else:
                    logger.warning(f"User not found: {login_id}")
                    return JsonResponse({
                        "success": False,
                        "message": "등록되지 않은 이메일입니다.",
                        "error_code": "USER_NOT_FOUND"
                    }, status=404)
            
            # 4. 계정 상태 확인
            if not user.is_active:
                return JsonResponse({
                    "success": False,
                    "message": "비활성화된 계정입니다. 관리자에게 문의하세요.",
                    "error_code": "ACCOUNT_DISABLED"
                }, status=403)
            
            # 5. 이메일 인증 확인 (선택적)
            if hasattr(user, 'email_verified') and not user.email_verified:
                # 기존 사용자는 자동 인증
                if user.date_joined.year < 2025:
                    user.email_verified = True
                    user.email_verified_at = timezone.now()
                    user.save(update_fields=['email_verified', 'email_verified_at'])
                    logger.info(f"Auto-verified legacy user: {user.username}")
            
            # 6. JWT 토큰 생성
            try:
                access_token, refresh_token = create_tokens_for_user(user)
                
                # 토큰 디버깅 정보 (개발 환경에서만)
                if settings.DEBUG:
                    token_info = debug_token(access_token)
                    logger.info(f"Token created for user {user.id}: {token_info}")
                
            except Exception as e:
                logger.error(f"Token generation failed: {e}")
                return JsonResponse({
                    "success": False,
                    "message": "토큰 생성에 실패했습니다.",
                    "error_code": "TOKEN_GENERATION_FAILED",
                    "detail": str(e)
                }, status=500)
            
            # 7. 마지막 로그인 시간 업데이트
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # 8. 응답 생성
            response_data = {
                "success": True,
                "message": "로그인 성공",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "nickname": getattr(user, 'nickname', user.username),
                    "is_staff": user.is_staff,
                }
            }
            
            response = JsonResponse(response_data, status=200)
            
            # 9. 쿠키 설정 (선택적)
            response.set_cookie(
                "vridge_session",
                access_token,
                max_age=60 * 60 * 24 * 7,  # 7일
                httponly=True,
                secure=not settings.DEBUG,  # HTTPS에서만 secure
                samesite="Lax"
            )
            
            logger.info(f"Login successful for user: {user.username} (ID: {user.id})")
            return response
            
        except json.JSONDecodeError:
            return JsonResponse({
                "success": False,
                "message": "잘못된 JSON 형식입니다.",
                "error_code": "INVALID_JSON"
            }, status=400)
            
        except Exception as e:
            logger.error(f"Login error: {e}", exc_info=True)
            return JsonResponse({
                "success": False,
                "message": "로그인 처리 중 오류가 발생했습니다.",
                "error_code": "INTERNAL_ERROR",
                "detail": str(e) if settings.DEBUG else None
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class TokenRefreshView(View):
    """
    토큰 갱신 뷰
    """
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            refresh_token = data.get("refresh_token")
            
            if not refresh_token:
                return JsonResponse({
                    "success": False,
                    "message": "Refresh token이 필요합니다.",
                    "error_code": "MISSING_REFRESH_TOKEN"
                }, status=400)
            
            # 토큰 갱신
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken(refresh_token)
                
                new_access_token = str(refresh.access_token)
                
                # 선택적: Refresh 토큰도 회전
                if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                    refresh.blacklist()
                    new_refresh = RefreshToken.for_user(refresh.user)
                    new_refresh_token = str(new_refresh)
                else:
                    new_refresh_token = refresh_token
                
                return JsonResponse({
                    "success": True,
                    "access_token": new_access_token,
                    "refresh_token": new_refresh_token
                }, status=200)
                
            except Exception as e:
                logger.error(f"Token refresh failed: {e}")
                return JsonResponse({
                    "success": False,
                    "message": "토큰 갱신에 실패했습니다.",
                    "error_code": "TOKEN_REFRESH_FAILED",
                    "detail": str(e)
                }, status=401)
                
        except Exception as e:
            logger.error(f"Token refresh error: {e}", exc_info=True)
            return JsonResponse({
                "success": False,
                "message": "토큰 갱신 중 오류가 발생했습니다.",
                "error_code": "INTERNAL_ERROR"
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class TokenVerifyView(View):
    """
    토큰 검증 뷰
    """
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            token = data.get("token")
            
            if not token:
                return JsonResponse({
                    "success": False,
                    "message": "검증할 토큰이 필요합니다.",
                    "error_code": "MISSING_TOKEN"
                }, status=400)
            
            # 토큰 검증
            from rest_framework_simplejwt.tokens import AccessToken
            try:
                access_token = AccessToken(token)
                user_id = access_token.get('user_id')
                
                # 사용자 확인
                user = User.objects.filter(id=user_id, is_active=True).first()
                if not user:
                    raise Exception("User not found or inactive")
                
                return JsonResponse({
                    "success": True,
                    "valid": True,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email
                    }
                }, status=200)
                
            except Exception as e:
                logger.debug(f"Token verification failed: {e}")
                return JsonResponse({
                    "success": False,
                    "valid": False,
                    "message": "유효하지 않은 토큰입니다.",
                    "error_code": "INVALID_TOKEN"
                }, status=401)
                
        except Exception as e:
            logger.error(f"Token verify error: {e}", exc_info=True)
            return JsonResponse({
                "success": False,
                "message": "토큰 검증 중 오류가 발생했습니다.",
                "error_code": "INTERNAL_ERROR"
            }, status=500)