"""
이메일 인증을 포함한 회원가입 뷰
"""
import json
import logging
import random
from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken

from . import models
from .utils import auth_send_email

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class SignUpRequest(View):
    """Step 1: 이메일 확인 및 인증번호 발송 (중복 확인 통합)"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email", "").strip().lower()
            
            # 이메일 형식 검증
            import re
            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_regex, email):
                return JsonResponse({
                    "message": "올바른 이메일 형식이 아닙니다.",
                    "status": "invalid_format"
                }, status=400)
            
            # 이미 가입된 이메일인지 확인
            if models.User.objects.filter(username=email).exists():
                return JsonResponse({
                    "message": "이미 가입되어 있는 이메일입니다.",
                    "status": "already_registered",
                    "email": email
                }, status=409)
            
            # 최근 요청 제한 (Rate limiting)
            rate_limit_key = f"signup_request_{email}"
            if cache.get(rate_limit_key):
                remaining_time = cache.ttl(rate_limit_key)  # 남은 시간 확인
                return JsonResponse({
                    "message": f"잠시 후 다시 시도해주세요. ({remaining_time}초)",
                    "status": "rate_limited",
                    "remaining_seconds": remaining_time
                }, status=429)
            
            # 인증번호 생성 (6자리)
            auth_number = str(random.randint(100000, 999999))
            
            # EmailVerify 모델에 저장
            models.EmailVerify.objects.filter(email=email).delete()  # 기존 인증번호 삭제
            models.EmailVerify.objects.create(
                email=email,
                auth_number=auth_number
            )
            
            # 이메일 발송
            email_sent = auth_send_email(request, email, auth_number)
            
            if email_sent:
                # Rate limiting 설정 (30초)
                cache.set(rate_limit_key, True, 30)
                
                logger.info(f"Signup auth email sent to: {email}")
                return JsonResponse({
                    "message": "success",
                    "detail": "인증번호가 이메일로 발송되었습니다.",
                    "status": "email_sent",
                    "email": email
                }, status=200)
            else:
                return JsonResponse({
                    "message": "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
                    "status": "email_failed"
                }, status=500)
                
        except json.JSONDecodeError:
            return JsonResponse({
                "message": "잘못된 요청 형식입니다.",
                "status": "invalid_request"
            }, status=400)
        except Exception as e:
            logger.error(f"SignUpRequest Error: {str(e)}")
            return JsonResponse({
                "message": "처리 중 오류가 발생했습니다.",
                "status": "server_error"
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SignUpVerify(View):
    """Step 2: 인증번호 확인"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email", "").strip().lower()
            auth_number = data.get("auth_number", "").strip()
            
            if not email or not auth_number:
                return JsonResponse({"message": "이메일과 인증번호를 입력해주세요."}, status=400)
            
            # 인증번호 확인
            try:
                email_verify = models.EmailVerify.objects.filter(
                    email=email,
                    auth_number=auth_number
                ).latest('created')
                
                # 3분 이내인지 확인
                if timezone.now() - email_verify.created > timedelta(minutes=3):
                    return JsonResponse({"message": "인증번호가 만료되었습니다."}, status=400)
                
                # 인증 성공 - 임시 토큰 생성
                signup_token_key = f"signup_token_{email}"
                signup_token = str(random.randint(1000000000, 9999999999))
                
                # 10분 동안 유효한 토큰 저장
                cache.set(signup_token_key, {
                    'email': email,
                    'token': signup_token,
                    'verified_at': timezone.now().isoformat()
                }, 600)  # 10분
                
                # 사용된 인증번호 삭제
                email_verify.delete()
                
                return JsonResponse({
                    "message": "success",
                    "detail": "이메일 인증이 완료되었습니다.",
                    "auth_token": signup_token
                }, status=200)
                
            except models.EmailVerify.DoesNotExist:
                return JsonResponse({"message": "잘못된 인증번호입니다."}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({"message": "잘못된 요청 형식입니다."}, status=400)
        except Exception as e:
            logger.error(f"SignUpVerify Error: {str(e)}")
            return JsonResponse({"message": "처리 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SignUpComplete(View):
    """Step 3: 회원가입 완료"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email", "").strip().lower()
            auth_token = data.get("auth_token", "").strip()
            nickname = data.get("nickname", "").strip()
            password = data.get("password", "")
            
            # 입력값 검증
            if not all([email, auth_token, nickname, password]):
                return JsonResponse({"message": "모든 필드를 입력해주세요."}, status=400)
            
            # 토큰 검증
            signup_token_key = f"signup_token_{email}"
            token_data = cache.get(signup_token_key)
            
            if not token_data or token_data['token'] != auth_token:
                return JsonResponse({"message": "유효하지 않은 인증 토큰입니다."}, status=400)
            
            # 닉네임 검증
            if len(nickname) < 2:
                return JsonResponse({"message": "닉네임은 최소 2자 이상이어야 합니다."}, status=400)
            
            if models.User.objects.filter(nickname=nickname).exists():
                return JsonResponse({"message": "이미 사용 중인 닉네임입니다."}, status=409)
            
            # 비밀번호 검증
            if len(password) < 10:
                return JsonResponse({"message": "비밀번호는 최소 10자 이상이어야 합니다."}, status=400)
            
            # 사용자 생성
            new_user = models.User.objects.create(
                username=email,
                email=email,
                nickname=nickname,
                login_method='email',
                is_active=True
            )
            new_user.set_password(password)
            new_user.save()
            
            # 토큰 삭제
            cache.delete(signup_token_key)
            
            # JWT 토큰 생성
            refresh = RefreshToken.for_user(new_user)
            vridge_session = str(refresh.access_token)
            
            logger.info(f"User registered successfully: {email}")
            
            res = JsonResponse({
                "message": "success",
                "vridge_session": vridge_session,
                "user": new_user.username,
                "nickname": new_user.nickname,
            }, status=201)
            
            res.set_cookie(
                "vridge_session",
                vridge_session,
                samesite="None",
                secure=True,
                max_age=2419200,  # 28일
            )
            
            return res
            
        except json.JSONDecodeError:
            return JsonResponse({"message": "잘못된 요청 형식입니다."}, status=400)
        except Exception as e:
            logger.error(f"SignUpComplete Error: {str(e)}")
            return JsonResponse({"message": "회원가입 처리 중 오류가 발생했습니다."}, status=500)


# 기존 회원가입 API와의 호환성을 위한 뷰
@method_decorator(csrf_exempt, name='dispatch')
class SignUpEmailVerified(View):
    """이메일 인증이 필수인 새로운 회원가입 (기존 API 대체용)"""
    
    def post(self, request):
        return JsonResponse({
            "message": "이메일 인증이 필요합니다. /users/signup/request로 시작해주세요.",
            "steps": [
                "1. POST /users/signup/request - 이메일 인증번호 발송",
                "2. POST /users/signup/verify - 인증번호 확인",
                "3. POST /users/signup/complete - 회원가입 완료"
            ]
        }, status=400)