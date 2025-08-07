# -*- coding: utf-8 -*-
"""
안전한 회원가입 뷰 - 이메일 서비스 없이도 작동
"""
import logging
import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.conf import settings
from . import models
from .validators import InputValidator

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class SafeSignUp(View):
    """이메일 서비스 없이도 작동하는 안전한 회원가입"""
    
    def post(self, request):
        try:
            # request.body 검증
            if not request.body:
                return JsonResponse({"message": "요청 본문이 비어있습니다."}, status=400)
            
            try:
                data = json.loads(request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body)
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.error(f"JSON 파싱 오류: {str(e)}")
                return JsonResponse({"message": "잘못된 JSON 형식입니다."}, status=400)
            
            email = data.get("email")
            nickname = data.get("nickname")
            password = data.get("password")

            # 입력값 검증
            if not email or not nickname or not password:
                return JsonResponse({"message": "모든 필드를 입력해주세요."}, status=400)
            
            # 이메일 형식 검증
            is_valid, error_msg = InputValidator.validate_email(email)
            if not is_valid:
                return JsonResponse({
                    "success": False,
                    "message": error_msg,
                    "field": "email"
                }, status=400)
            
            # 닉네임 검증
            is_valid, error_msg = InputValidator.validate_text_input(nickname, "닉네임", max_length=50)
            if not is_valid:
                return JsonResponse({
                    "success": False,
                    "message": error_msg,
                    "field": "nickname"
                }, status=400)
            
            if len(nickname) < 2:
                return JsonResponse({"message": "닉네임은 최소 2자 이상이어야 합니다."}, status=400)
            
            # 비밀번호 검증
            is_valid, error_msg = InputValidator.validate_password(password)
            if not is_valid:
                return JsonResponse({
                    "success": False,
                    "message": error_msg,
                    "field": "password"
                }, status=400)

            logger.info(f"회원가입 시도 - 이메일: {email}, 닉네임: {nickname}")
            
            # 이메일 중복 확인
            user = models.User.objects.filter(username=email).first()
            if user:
                return JsonResponse({"message": "이미 가입되어 있는 이메일입니다."}, status=409)
            
            # 닉네임 중복 확인
            nickname_exists = models.User.objects.filter(nickname=nickname).exists()
            if nickname_exists:
                return JsonResponse({"message": "이미 사용 중인 닉네임입니다."}, status=409)
            
            # 새 사용자 생성
            new_user = models.User(
                username=email, 
                email=email,
                nickname=nickname,
                login_method='email'
            )
            new_user.set_password(password)
            
            # Railway 환경이거나 개발 환경에서는 자동 이메일 인증
            if settings.DEBUG or 'railway' in request.get_host().lower():
                new_user.email_verified = True
                new_user.email_verified_at = timezone.now()
                logger.info(f"자동 이메일 인증 처리: {email}")
            
            new_user.save()
            
            logger.info(f"회원가입 성공 - ID: {new_user.id}, 이메일: {new_user.username}")

            # 회원가입 성공 응답
            return JsonResponse({
                "message": "회원가입이 완료되었습니다. 로그인하실 수 있습니다.",
                "email_sent": False,
                "user": new_user.username,
                "nickname": new_user.nickname,
                "auto_verified": new_user.email_verified
            }, status=201)
            
        except Exception as e:
            logger.error(f"회원가입 에러: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"회원가입 처리 중 오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SafeSignIn(View):
    """안전한 로그인 뷰"""
    
    def post(self, request):
        try:
            # request.body 검증
            if not request.body:
                return JsonResponse({"message": "요청 본문이 비어있습니다."}, status=400)
            
            try:
                data = json.loads(request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body)
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.error(f"JSON 파싱 오류: {str(e)}")
                return JsonResponse({"message": "잘못된 JSON 형식입니다."}, status=400)
            
            # username 또는 email 둘 다 받을 수 있도록 처리
            email = data.get("email") or data.get("username")
            password = data.get("password")

            if not email or not password:
                return JsonResponse({"message": "이메일과 비밀번호를 입력해주세요."}, status=400)

            logger.info(f"로그인 시도 - email: {email}")
            
            # 사용자 찾기
            from django.contrib.auth import authenticate
            
            # 먼저 username으로 시도
            user = authenticate(request, username=email, password=password)
            
            if not user:
                # email로 사용자 찾기
                user_obj = models.User.objects.filter(email=email).first()
                if user_obj:
                    logger.info(f"Found user by email: {user_obj.username}")
                    # username으로 다시 authenticate
                    user = authenticate(request, username=user_obj.username, password=password)
            
            if user is not None:
                # 이메일 인증 확인 (개발/배포 환경에서는 스킵)
                if hasattr(user, 'email_verified') and not user.email_verified:
                    if settings.DEBUG or 'railway' in request.get_host().lower():
                        logger.info(f"자동 인증 처리: {user.email}")
                        user.email_verified = True
                        user.email_verified_at = timezone.now()
                        user.save()
                
                # JWT 토큰 생성
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                res = JsonResponse({
                    "message": "success",
                    "access": access_token,
                    "refresh": refresh_token,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "vridge_session": access_token,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "nickname": user.nickname if user.nickname else user.username,
                    }
                }, status=200)
                
                res.set_cookie(
                    "vridge_session",
                    access_token,
                    httponly=True,
                    samesite="Lax",
                    secure=True,
                    max_age=2419200,
                )
                return res
            else:
                logger.error(f"로그인 실패: {email}")
                return JsonResponse({"message": "이메일 또는 비밀번호가 올바르지 않습니다."}, status=401)
                
        except Exception as e:
            logger.error(f"로그인 에러: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"로그인 처리 중 오류가 발생했습니다: {str(e)}"}, status=500)