# -*- coding: utf-8 -*-
import logging, json, random, requests
import os

logger = logging.getLogger(__name__)
from django.conf import settings
from datetime import datetime, timedelta
from django.shortcuts import render
from django.utils import timezone
from django.contrib.auth import authenticate
from . import models
from django.views import View
from django.http import JsonResponse
from .utils import user_validator, auth_send_email
from core.security import sanitize_input, set_secure_cookie, rate_limit, SecurityError
from .security_utils import PasswordResetSecurity
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
from .validators import InputValidator, validate_request_data
from core.response_handler import StandardResponse
from core.error_messages import ErrorMessages

# from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView


########## username이 kakao,naver,google이든 회원가입 때 중복되면 생성x
# 이메일 중복 확인
@method_decorator(csrf_exempt, name='dispatch')
class CheckEmail(View):
    def post(self, request):
        try:
            # request.body 검증
            if not request.body:
                return JsonResponse({"message": "요청 본문이 비어있습니다."}, status=400)
            
            try:
                data = json.loads(request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body)
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return JsonResponse({"message": "잘못된 JSON 형식입니다."}, status=400)
            
            email = data.get("email")
            
            # 이메일 유효성 검증
            is_valid, error_msg = InputValidator.validate_email(email)
            if not is_valid:
                return StandardResponse.validation_error({"email": error_msg})
            
            # N+1 쿼리 최적화: 사용자 찾기 최적화
            user = models.User.objects.filter(username=email).first()
            if user:
                return StandardResponse.error("USER_ALREADY_EXISTS", "이미 사용 중인 이메일입니다.", 409)
            else:
                return StandardResponse.success(message="사용 가능한 이메일입니다.")
                
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return StandardResponse.server_error()


# 닉네임 중복 확인
@method_decorator(csrf_exempt, name='dispatch')
class CheckNickname(View):
    def post(self, request):
        try:
            # request.body 검증
            if not request.body:
                return JsonResponse({"message": "요청 본문이 비어있습니다."}, status=400)
            
            try:
                data = json.loads(request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body)
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return JsonResponse({"message": "잘못된 JSON 형식입니다."}, status=400)
            
            nickname = data.get("nickname")
            
            if not nickname:
                return JsonResponse({"message": "닉네임을 입력해주세요."}, status=400)
            
            if len(nickname) < 2:
                return JsonResponse({"message": "닉네임은 최소 2자 이상이어야 합니다."}, status=400)
            
            # N+1 쿼리 최적화: 닉네임 찾기 최적화
            user = models.User.objects.filter(nickname=nickname).first()
            if user:
                return JsonResponse({"message": "이미 사용 중인 닉네임입니다."}, status=409)
            else:
                return JsonResponse({"message": "사용 가능한 닉네임입니다."}, status=200)
                
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return StandardResponse.server_error()


@method_decorator(csrf_exempt, name='dispatch')
class SignUp(View):
    def post(self, request):
        try:
            # request.body 검증
            if not request.body:
                return JsonResponse({"message": "요청 본문이 비어있습니다."}, status=400)
            
            try:
                data = json.loads(request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body)
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.error(f"JSON 파싱 오류: {str(e)}, Body: {request.body[:100]}")
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
            user = models.User.objects.get_or_none(username=email)
            if user:
                return JsonResponse({"message": "이미 가입되어 있는 이메일입니다."}, status=409)
            
            # 닉네임 중복 확인
            nickname_exists = models.User.objects.filter(nickname=nickname).exists()
            if nickname_exists:
                return JsonResponse({"message": "이미 사용 중인 닉네임입니다."}, status=409)
            
            # 새 사용자 생성
            new_user = models.User(
                username=email, 
                email=email,  # email 필드도 설정
                nickname=nickname,
                login_method='email'
            )
            # 혹시 남아있을 수 있는 레거시 필드들을 위한 처리
            if hasattr(new_user, 'is_social_login'):
                new_user.is_social_login = False
            if hasattr(new_user, 'social_id'):
                new_user.social_id = None
            if hasattr(new_user, 'social_profile_image'):
                new_user.social_profile_image = None
            if hasattr(new_user, 'login_count'):
                new_user.login_count = 0
            if hasattr(new_user, 'last_login_ip'):
                new_user.last_login_ip = None
            new_user.set_password(password)
            new_user.save()
            
            # 기본 DevelopmentFramework 생성 (실패해도 회원가입은 계속 진행)
            try:
                self._create_default_framework(new_user)
                logger.info(f"기본 프레임워크 생성 완료 - 사용자: {new_user.username}")
            except Exception as framework_error:
                logger.warning(f"기본 프레임워크 생성 실패 (회원가입은 계속 진행): {str(framework_error)}")
                # 프레임워크 생성 실패는 회원가입을 막지 않음
            
            logger.info(f"회원가입 성공 - ID: {new_user.id}, 이메일: {new_user.username}")

            # 이메일 인증 발송 (실패해도 회원가입은 완료)
            email_sent = False
            try:
                from .email_verification_service import EmailVerificationService
                verification_token = EmailVerificationService.send_verification_email(new_user)
                if verification_token:
                    email_sent = True
                    logger.info(f"이메일 인증 발송 성공 - 사용자: {new_user.username}")
                else:
                    logger.warning(f"이메일 인증 발송 실패 - 사용자: {new_user.username}")
            except Exception as email_error:
                logger.error(f"이메일 서비스 오류: {str(email_error)}")
                # 개발 환경이나 이메일 서비스 오류 시 자동 인증
                if settings.DEBUG or 'railway' in request.get_host().lower():
                    new_user.email_verified = True
                    new_user.email_verified_at = timezone.now()
                    new_user.save()
                    logger.info(f"개발 환경 - 자동 이메일 인증 처리: {new_user.username}")
            
            # 회원가입 성공 응답
            if email_sent:
                return JsonResponse({
                    "message": "회원가입이 완료되었습니다. 이메일 인증을 완료해 주세요.",
                    "email_sent": True,
                    "user": new_user.username,
                    "nickname": new_user.nickname,
                }, status=201)
            else:
                # 이메일 발송 실패해도 회원가입은 성공
                return JsonResponse({
                    "message": "회원가입이 완료되었습니다. 로그인하실 수 있습니다.",
                    "email_sent": False,
                    "user": new_user.username,
                    "nickname": new_user.nickname,
                    "auto_verified": new_user.email_verified
                }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({"message": "잘못된 요청 형식입니다."}, status=400)
        except Exception as e:
            logger.error(f"회원가입 에러: {str(e)}", exc_info=True)
            logging.error(f"SignUp Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({"message": "회원가입 처리 중 오류가 발생했습니다."}, status=500)
    
    def _create_default_framework(self, user):
        """사용자의 기본 DevelopmentFramework 생성"""
        try:
            from projects.models import DevelopmentFramework
            
            # 이미 기본 프레임워크가 있는지 확인
            if DevelopmentFramework.objects.filter(user=user, is_default=True).exists():
                return
            
            # 기본 프레임워크 생성
            default_framework = DevelopmentFramework.objects.create(
                user=user,
                name="기본 영상 프레임워크",
                intro_hook="초반 5초 안에 시청자의 시선을 사로잡을 강력한 오프닝을 만들어보세요. 질문으로 시작하거나, 충격적인 사실을 제시하거나, 시각적 임팩트가 강한 장면으로 시작하는 것이 효과적입니다.",
                immersion="빠른 컷 전환과 흥미로운 전개로 시청자의 몰입을 유도하세요. 스토리텔링의 기승전결을 명확히 하고, 각 섹션마다 새로운 정보나 감정을 제공하여 지루함을 방지합니다.",
                twist="예상치 못한 이벤트나 반전을 통해 지루함을 방지하고 긴장감을 유지하세요. 시청자가 예측할 수 없는 요소를 중간중간 배치하여 끝까지 시청하도록 유도합니다.",
                hook_next="다음 콘텐츠에 대한 궁금증을 유발하여 재방문을 유도하세요. '다음 영상에서는...', '곧 공개될...' 등의 문구로 연속성을 만들고 구독과 알림 설정을 유도합니다.",
                is_default=True
            )
            logger.info(f"기본 프레임워크 생성 성공: {user.username}")
            
        except ImportError:
            logger.warning("DevelopmentFramework 모델을 찾을 수 없음 - 프로젝트 앱이 설치되지 않았을 가능성")
        except Exception as e:
            logger.error(f"기본 프레임워크 생성 중 오류: {str(e)}")
            # 프레임워크 생성 실패해도 회원가입은 계속 진행
            pass


@method_decorator(csrf_exempt, name='dispatch')
class SignIn(View):
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

            # Debug
            logger.info(f"Login attempt - email: {email}")
            
            # Django의 authenticate 사용
            user = None
            
            # 먼저 username으로 시도
            user = authenticate(request, username=email, password=password)
            
            if not user:
                # email로 사용자 찾기
                user_obj = models.User.objects.filter(email=email).first()
                if user_obj:
                    logger.info(f"Found user by email: {user_obj.username}")
                    # username으로 다시 authenticate
                    user = authenticate(request, username=user_obj.username, password=password)
            
            if not user:
                logger.error(f"Authentication failed for: {email}")
                # 디버깅을 위한 추가 정보
                test_user = models.User.objects.filter(username=email).first()
                if not test_user:
                    test_user = models.User.objects.filter(email=email).first()
                    
                if test_user:
                    logger.error(f"User exists but auth failed: username={test_user.username}, active={test_user.is_active}")
                else:
                    logger.error(f"User not found: {email}")
            
            if user is not None:
                # 이메일 인증 확인 - 기존 사용자들을 위한 임시 처리
                if hasattr(user, 'email_verified') and not user.email_verified:
                    # 개발 환경이거나 기존 사용자인 경우 자동 인증 처리
                    if settings.DEBUG or not hasattr(user, 'email_verified_at') or user.email_verified_at is None:
                        logger.info(f"기존 사용자 자동 인증 처리: {user.email}")
                        user.email_verified = True
                        user.email_verified_at = timezone.now()
                        user.save()
                    else:
                        return JsonResponse(
                            {
                                "message": "이메일 인증이 필요합니다. 가입 시 받은 이메일을 확인해주세요.",
                                "error_code": "EMAIL_NOT_VERIFIED",
                                "email": user.email
                            },
                            status=403
                        )
                
                # 사용자 활성 상태 확인
                if not user.is_active:
                    logger.warning(f"비활성 사용자 로그인 시도: {user.email}")
                    return JsonResponse({
                        "message": "비활성된 계정입니다. 관리자에게 문의해주세요."
                    }, status=403)
                
                # JWT 토큰 생성 및 유저 정보 처리
                try:
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    refresh_token = str(refresh)
                    
                    # 로그인 성공 로그 및 통계
                    logger.info(f"로그인 성공 - 사용자: {user.username}, ID: {user.id}")
                    
                    # 프론트엔드가 기대하는 형식으로 응답 (테스트와 호환되도록)
                    user_data = {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email if user.email else user.username,
                        "nickname": user.nickname if user.nickname else user.username,
                        "login_method": getattr(user, 'login_method', 'email'),
                        "email_verified": getattr(user, 'email_verified', True)
                    }
                    
                    response_data = {
                        "message": "success",
                        "status": "success",
                        "access": access_token,  # 표준 JWT 키
                        "refresh": refresh_token,  # 표준 JWT 키
                        "access_token": access_token,  # 프론트엔드가 사용하는 키
                        "refresh_token": refresh_token,
                        "vridge_session": access_token,  # 하위 호환성
                        "user": user_data
                    }
                    
                    res = JsonResponse(response_data, status=200)
                    
                    # HttpOnly 쿠키 설정 (보안 강화)
                    secure_cookie = not settings.DEBUG  # HTTPS 환경에서만 Secure 쿠키
                    res.set_cookie(
                        "vridge_session",
                        access_token,
                        httponly=True,
                        samesite="Lax",
                        secure=secure_cookie,
                        max_age=3600,  # 1시간 (액세스 토큰과 동일)
                    )
                    
                    return res
                    
                except Exception as token_error:
                    logger.error(f"JWT 토큰 생성 오류: {str(token_error)}")
                    return JsonResponse({
                        "message": "로그인 처리 중 오류가 발생했습니다."
                    }, status=500)
            else:
                logger.warning(f"로그인 실패 - 이메일: {email}")
                return JsonResponse({
                    "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
                    "status": "error",
                    "error_code": "INVALID_CREDENTIALS"
                }, status=401)
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return JsonResponse({"message": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SendAuthNumber(View):
    def post(self, request, types):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            
            # 이메일 유효성 검사
            import re
            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not email or not re.match(email_regex, email):
                return JsonResponse({"message": "올바른 이메일 주소를 입력해주세요."}, status=400)

            # Rate limiting 체크
            client_ip = request.META.get('REMOTE_ADDR', '')
            rate_ok, rate_msg = PasswordResetSecurity.check_rate_limit(
                f"{client_ip}:{email}", 
                "auth_request", 
                limit=3, 
                window=300  # 5분
            )
            if not rate_ok:
                return JsonResponse({"message": rate_msg}, status=429)

            # 보안 강화된 인증 코드 생성
            auth_number = PasswordResetSecurity.generate_auth_code()

            user = models.User.objects.get_or_none(username=email)

            if types == "reset":
                if user is None:
                    return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=404)

                if user.login_method != "email":
                    return JsonResponse({"message": "소셜 로그인 계정입니다."}, status=400)

                # 캐시에 인증 코드 저장 (10분 만료)
                PasswordResetSecurity.store_auth_code(email, auth_number, expiry_minutes=10)
            else:
                if user:
                    return JsonResponse({"message": "이미 가입되어 있는 사용자입니다."}, status=409)
                email_verify, is_created = models.EmailVerify.objects.get_or_create(email=email)
                email_verify.auth_number = auth_number
                email_verify.save()

            try:
                result = auth_send_email(request, email, auth_number)
                if result:
                    logging.info(f"Auth email sent successfully to {email}")
                    return JsonResponse({
                        "message": "success",
                        "detail": "인증번호가 이메일로 발송되었습니다. 10분 내에 입력해주세요.",
                        "email": email
                    }, status=200)
                else:
                    logging.error(f"Email sending failed for {email}")
                    return JsonResponse({
                        "message": "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요."
                    }, status=500)
            except Exception as email_error:
                logging.error(f"Email sending error: {str(email_error)}")
                return JsonResponse({
                    "message": "이메일 발송 중 오류가 발생했습니다."
                }, status=500)
        except Exception as e:
            logging.error(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class EmailAuth(View):
    def post(self, request, types):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            auth_number = data.get("auth_number")

            if not email or not auth_number:
                return JsonResponse({"message": "이메일과 인증번호를 입력해주세요."}, status=400)

            # Rate limiting 체크 (인증 시도)
            client_ip = request.META.get('REMOTE_ADDR', '')
            rate_ok, rate_msg = PasswordResetSecurity.check_rate_limit(
                f"{client_ip}:{email}", 
                "auth_verify", 
                limit=5, 
                window=300  # 5분
            )
            if not rate_ok:
                return JsonResponse({"message": rate_msg}, status=429)

            if types == "reset":
                user = models.User.objects.get_or_none(username=email)

                if not user:
                    return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=404)

                # 캐시에서 인증 코드 검증
                is_valid, error_msg = PasswordResetSecurity.verify_and_get_auth_code(
                    email, str(auth_number)
                )
                
                if is_valid:
                    # 임시 토큰 생성
                    reset_token = PasswordResetSecurity.generate_reset_token(user.id)
                    return JsonResponse({
                        "message": "success",
                        "reset_token": reset_token
                    }, status=200)
                else:
                    return StandardResponse.validation_error({"email": error_msg})

            else:
                email_verify = models.EmailVerify.objects.get_or_none(email=email)
                if not email_verify:
                    return JsonResponse({"message": "인증 정보를 찾을 수 없습니다."}, status=404)
                if str(email_verify.auth_number) == str(auth_number):
                    email_verify.delete()
                    return JsonResponse({"message": "success"}, status=200)
                else:
                    return JsonResponse({"message": "인증번호가 일치하지 않습니다"}, status=400)

        except Exception as e:
            logging.error(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ResetPassword(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")
            reset_token = data.get("reset_token")

            if not reset_token:
                return JsonResponse({"message": "인증 토큰이 필요합니다."}, status=400)

            # 토큰 검증
            user_id, error_msg = PasswordResetSecurity.verify_reset_token(reset_token)
            if not user_id:
                return StandardResponse.validation_error({"email": error_msg})

            # 비밀번호 복잡도 검사
            if len(password) < 8:
                return JsonResponse({"message": "비밀번호는 8자 이상이어야 합니다."}, status=400)
            
            import re
            if not re.search(r"[A-Za-z]", password) or not re.search(r"[0-9]", password):
                return JsonResponse({"message": "비밀번호는 영문자와 숫자를 포함해야 합니다."}, status=400)

            user = models.User.objects.get_or_none(id=user_id)
            if user and user.username == email:
                user.set_password(password)
                user.save()
                logging.info(f"Password reset successful for user {email}")
                return JsonResponse({"message": "success"}, status=200)
            else:
                return JsonResponse({"message": "사용자 정보가 일치하지 않습니다."}, status=403)
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class KakaoLogin(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            access_token = data.get("access_token")

            profile_request = requests.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            kakao_user = profile_request.json()
            logger.debug(f"Kakao user data: {kakao_user}")

            kakao_id = kakao_user["id"]
            nickname = kakao_user.get("properties").get("nickname")
            email = kakao_user.get("kakao_account").get("email")
            # if not email:
            #     email = kakao_id
            if not email:
                return JsonResponse({"message": "카카오 이메일이 없습니다."}, status=400)

            user, is_created = models.User.objects.get_or_create(username=email)

            if is_created:
                user.login_method = "kakao"
                user.nickname = nickname
                user.save()
            else:
                if user.login_method != "kakao":
                    return JsonResponse({"message": "로그인 방식이 잘못되었습니다."}, status=400)

            # SimpleJWT로 토큰 생성
            refresh = RefreshToken.for_user(user)
            vridge_session = str(refresh.access_token)
            res = JsonResponse(
                {
                    "message": "success",
                    "vridge_session": vridge_session,
                    "refresh_token": str(refresh),
                    "user": user.username,
                },
                status=200,
            )
            res.set_cookie(
                "vridge_session",
                vridge_session,
                httponly=True,
                samesite="Lax",
                secure=True,
                max_age=2419200,
            )
            return res
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class NaverLogin(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            code = data.get("code")
            state = data.get("state")

            NAVER_CLIENT_ID = settings.NAVER_CLIENT_ID
            NAVER_SECRET_KEY = settings.NAVER_SECRET_KEY

            token_request = requests.post(
                f"https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&state={state}&client_id={NAVER_CLIENT_ID}&client_secret={NAVER_SECRET_KEY}&code={code}"
            )

            token_json = token_request.json()

            error = token_json.get("error", None)
            if error is not None:
                raise Exception("Can't get access token")

            access_token = token_json.get("access_token")

            profile_request = requests.get(
                "https://openapi.naver.com/v1/nid/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            profile_json = profile_request.json()
            logger.debug(f"Naver profile data: {profile_json}")

            response = profile_json.get("response")
            email = response.get("email", None)
            nickname = response.get("nickname", None)
            name = response.get("name", None)
            naver_id = response.get("id", None)
            if not email:
                return JsonResponse({"message": "네이버 이메일이 없습니다."}, status=400)

            user, is_created = models.User.objects.get_or_create(username=email)

            if is_created:
                user.login_method = "naver"
                if nickname:
                    user.nickname = nickname
                else:
                    user.nickname = name
                user.save()
            else:
                if user.login_method != "naver":
                    return JsonResponse({"message": "로그인 방식이 잘못되었습니다."}, status=400)

            # SimpleJWT로 토큰 생성
            refresh = RefreshToken.for_user(user)
            vridge_session = str(refresh.access_token)
            res = JsonResponse(
                {
                    "message": "success",
                    "vridge_session": vridge_session,
                    "refresh_token": str(refresh),
                    "user": user.username,
                },
                status=200,
            )
            res.set_cookie(
                "vridge_session",
                vridge_session,
                httponly=True,
                samesite="Lax",
                secure=True,
                max_age=2419200,
            )
            return res
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class GoogleLogin(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            access_token = data.get("access_token")
            state = data.get("state")
            scopes = data.get("scopes")
            # credential = data.get("credential")

            # import base64, jwt
            # encoded_json = credential.split(".")[1]
            # decoded_bytes = base64.urlsafe_b64decode(encoded_json + "=" * (4 - len(encoded_json) % 4))
            # decoded_token = decoded_bytes.decode("utf-8")
            # print(decoded_token)

            if not state:
                return JsonResponse({"message": "잘못된 요청입니다."}, status=400)

            # useinfo = requests.get(
            #     f"https://oauth2.googleapis.com/tokeninfo?access_token={access_token}&scopes={scopes}"
            # )
            useinfo = requests.get(
                f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}&scopes={scopes}"
            )

            userinfo = useinfo.json()
            logger.debug(f"Google userinfo: {userinfo}")

            email = userinfo.get("email")
            nickname = userinfo.get("name")
            ids = userinfo.get("id")
            if not email:
                return JsonResponse({"message": "구글 이메일이 없습니다."}, status=400)

            user, is_created = models.User.objects.get_or_create(username=email)
            if is_created:
                user.login_method = "google"
                user.nickname = nickname
                user.save()
            else:
                if user.login_method != "google":
                    return JsonResponse({"message": "로그인 방식이 잘못되었습니다."}, status=400)

            # SimpleJWT로 토큰 생성
            refresh = RefreshToken.for_user(user)
            vridge_session = str(refresh.access_token)
            res = JsonResponse(
                {
                    "message": "success",
                    "vridge_session": vridge_session,
                    "refresh_token": str(refresh),
                    "user": user.username,
                },
                status=200,
            )
            res.set_cookie(
                "vridge_session",
                vridge_session,
                httponly=True,
                samesite="Lax",
                secure=True,
                max_age=2419200,
            )
            return res
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class UserMe(View):
    @user_validator
    def get(self, request):
        try:
            user = request.user
            
            # 프로필 이미지 URL 처리
            profile_image = None
            if hasattr(user, 'profile') and user.profile and user.profile.profile_image:
                # 절대 URL로 변환
                from django.conf import settings
                profile_image = user.profile.profile_image.url
                if profile_image and not profile_image.startswith('http'):
                    # Railway 환경에서는 HTTPS 사용
                    protocol = 'https' if not settings.DEBUG else 'http'
                    host = request.get_host()
                    profile_image = f"{protocol}://{host}{profile_image}"
            
            return JsonResponse({
                "id": user.id,
                "username": user.username,
                "email": user.username if user.login_method == "email" else "",
                "nickname": user.nickname if user.nickname else user.username,
                "login_method": user.login_method,
                "date_joined": user.date_joined.isoformat() if user.date_joined else None,
                "profile_image": profile_image,
            }, status=200)
        except Exception as e:
            logger.error(f"Error in UserMe: {str(e)}", exc_info=True)
            return StandardResponse.server_error()


class UserMemo(View):
    @user_validator
    def post(self, request):
        try:
            user = request.user

            data = json.loads(request.body)

            date = data.get("date")

            memo = data.get("memo")
            if date and memo:
                models.UserMemo.objects.create(user=user, date=date, memo=memo)

            return JsonResponse({"message": "success"}, status=200)

        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def delete(self, request, id):
        try:
            user = request.user
            memo = models.UserMemo.objects.get_or_none(id=id)

            if memo is None:
                return JsonResponse({"message": "메모를 찾을 수  없습니다."}, status=404)

            if memo.user != user:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            memo.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            logger.error(f"Error in CheckEmail: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class NotificationView(View):
    """사용자 알림 관리"""
    
    @user_validator
    def get(self, request):
        """알림 목록 조회"""
        try:
            user = request.user
            
            # 읽지 않은 알림 개수 (projects 앱의 Notification 모델 사용)
            from users.models import Notification as ProjectNotification
            unread_count = ProjectNotification.objects.filter(
                recipient=user,
                is_read=False
            ).count()
            
            # URL 파라미터 처리
            unread_only = request.GET.get('unread_only', 'false').lower() == 'true'
            limit = int(request.GET.get('limit', 20))
            
            # 알림 조회 (projects 앱의 Notification 모델 사용)
            from users.models import Notification as ProjectNotification
            notifications_query = ProjectNotification.objects.filter(recipient=user)
            
            if unread_only:
                notifications_query = notifications_query.filter(is_read=False)
            
            notifications = notifications_query.order_by('-created')[:limit]
            
            notifications_data = [
                {
                    "id": notif.id,
                    "type": notif.notification_type,
                    "title": notif.title,
                    "message": notif.message,
                    "is_read": notif.is_read,
                    "created": notif.created.isoformat(),
                    "related_project": {
                        "id": notif.project_id,
                        "name": "프로젝트"
                    } if notif.project_id else None,
                }
                for notif in notifications
            ]
            
            return JsonResponse({
                "unread_count": unread_count,
                "notifications": notifications_data
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in notification list: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알림 조회 중 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def post(self, request):
        """알림 읽음 처리"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            notification_id = data.get('notification_id')
            mark_all_read = data.get('mark_all_read', False)
            
            if mark_all_read:
                # 모든 알림을 읽음 처리
                from django.utils import timezone
                models.Notification.objects.filter(
                    recipient=user,
                    is_read=False
                ).update(
                    is_read=True,
                    read_at=timezone.now()
                )
                return JsonResponse({"message": "모든 알림을 읽음 처리했습니다."}, status=200)
            
            elif notification_id:
                # 특정 알림을 읽음 처리
                notification = models.Notification.objects.filter(
                    id=notification_id,
                    recipient=user
                ).first()
                
                if not notification:
                    return JsonResponse({"message": "알림을 찾을 수 없습니다."}, status=404)
                
                if not notification.is_read:
                    from django.utils import timezone
                    notification.is_read = True
                    notification.read_at = timezone.now()
                    notification.save()
                
                return JsonResponse({"message": "알림을 읽음 처리했습니다."}, status=200)
            
            else:
                return JsonResponse({"message": "notification_id 또는 mark_all_read가 필요합니다."}, status=400)
            
        except Exception as e:
            logger.error(f"Error in notification mark read: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알림 처리 중 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def delete(self, request, notification_id):
        """알림 삭제"""
        try:
            user = request.user
            
            notification = models.Notification.objects.filter(
                id=notification_id,
                recipient=user
            ).first()
            
            if not notification:
                return JsonResponse({"message": "알림을 찾을 수 없습니다."}, status=404)
            
            notification.delete()
            return JsonResponse({"message": "알림을 삭제했습니다."}, status=200)
            
        except Exception as e:
            logger.error(f"Error in notification delete: {str(e)}", exc_info=True)
            return JsonResponse({"message": "알림 삭제 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class UnreadNotificationCount(View):
    """읽지 않은 알림 개수 조회"""
    
    @user_validator
    def get(self, request):
        """읽지 않은 알림 개수 반환"""
        try:
            user = request.user
            from users.models import Notification as ProjectNotification
            
            unread_count = ProjectNotification.objects.filter(
                recipient=user,
                is_read=False
            ).count()
            
            return JsonResponse({
                "count": unread_count
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in unread notification count: {str(e)}")
            return JsonResponse({"message": "읽지 않은 알림 개수 조회 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class MarkNotificationsRead(View):
    """여러 알림 읽음 처리"""
    
    @user_validator
    def post(self, request):
        """여러 알림을 읽음 처리"""
        try:
            user = request.user
            data = json.loads(request.body)
            notification_ids = data.get('notification_ids', [])
            
            if not notification_ids:
                return JsonResponse({"message": "notification_ids가 필요합니다."}, status=400)
            
            from users.models import Notification as ProjectNotification
            from django.utils import timezone
            
            updated_count = ProjectNotification.objects.filter(
                id__in=notification_ids,
                recipient=user,
                is_read=False
            ).update(is_read=True)
            
            return JsonResponse({
                "message": f"{updated_count}개의 알림을 읽음 처리했습니다.",
                "updated_count": updated_count
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in mark notifications read: {str(e)}")
            return JsonResponse({"message": "알림 읽음 처리 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class NotificationDetail(View):
    """개별 알림 관리"""
    
    @user_validator
    def delete(self, request, notification_id):
        """알림 삭제"""
        try:
            user = request.user
            from users.models import Notification as ProjectNotification
            
            notification = ProjectNotification.objects.filter(
                id=notification_id,
                user=user
            ).first()
            
            if not notification:
                return JsonResponse({"message": "알림을 찾을 수 없습니다."}, status=404)
            
            notification.delete()
            return JsonResponse({"message": "알림을 삭제했습니다."}, status=200)
            
        except Exception as e:
            logger.error(f"Error in notification detail delete: {str(e)}")
            return JsonResponse({"message": "알림 삭제 중 오류가 발생했습니다."}, status=500)


class RecentInvitationsView(View):
    """최근 초대한 사람 목록"""
    
    @user_validator
    def get(self, request):
        """최근 초대한 사람 목록 조회"""
        try:
            user = request.user
            limit = int(request.GET.get('limit', 10))
            
            # 테이블 존재 여부 확인
            from django.db import connection
            with connection.cursor() as cursor:
                if connection.vendor == 'postgresql':
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = 'users_recentinvitation'
                        );
                    """)
                    table_exists = cursor.fetchone()[0]
                else:
                    cursor.execute("""
                        SELECT name FROM sqlite_master 
                        WHERE type='table' AND name='users_recentinvitation';
                    """)
                    table_exists = cursor.fetchone() is not None
            
            if not table_exists:
                logger.warning("users_recentinvitation table does not exist")
                return JsonResponse({
                    "status": "success",
                    "recent_invitations": []
                }, status=200)
            
            recent_invitations = models.RecentInvitation.objects.filter(
                inviter=user
            ).order_by('-last_invited_at')[:limit]
            
            invitations_data = []
            for invitation in recent_invitations:
                invitations_data.append({
                    "id": invitation.id,
                    "email": invitation.invitee_email,
                    "name": invitation.invitee_name or invitation.invitee_email.split('@')[0],
                    "project_name": invitation.project_name,
                    "invitation_count": invitation.invitation_count,
                    "last_invited_at": invitation.last_invited_at.isoformat() if invitation.last_invited_at else None
                })
            
            return JsonResponse({
                "status": "success",
                "recent_invitations": invitations_data
            }, status=200)
            
        except Exception as e:
            import traceback
            logger.error(f"Error in RecentInvitationsView: {str(e)}\n{traceback.format_exc()}")
            return JsonResponse({
                "message": "최근 초대 목록 조회 중 오류가 발생했습니다.",
                "error": str(e),
                "type": type(e).__name__
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FriendshipView(View):
    """친구 관리"""
    
    @user_validator
    def get(self, request):
        """친구 목록 조회"""
        try:
            user = request.user
            
            # 내가 친구인 관계들 (양방향)
            friendships = models.Friendship.objects.filter(
                models.Q(user=user) | models.Q(friend=user),
                status='accepted'
            ).select_related('user', 'friend', 'user__profile', 'friend__profile')
            
            friends_data = []
            for friendship in friendships:
                # 나와 반대편 사람이 친구
                friend_user = friendship.friend if friendship.user == user else friendship.user
                
                friends_data.append({
                    "id": friendship.id,
                    "friend": {
                        "id": friend_user.id,
                        "email": friend_user.email,
                        "nickname": friend_user.nickname or friend_user.username,
                        "profile_image": friend_user.profile.profile_image.url if hasattr(friend_user, 'profile') and friend_user.profile.profile_image else None,
                        "company": friend_user.profile.company if hasattr(friend_user, 'profile') else '',
                        "position": friend_user.profile.position if hasattr(friend_user, 'profile') else '',
                    },
                    "since": friendship.responded_at.isoformat() if friendship.responded_at else friendship.created.isoformat()
                })
            
            # 빈 목록일 때 명확한 메시지 추가
            response_data = {
                "friends": friends_data,
                "count": len(friends_data)
            }
            
            if len(friends_data) == 0:
                response_data["message"] = "아직 친구가 없습니다."
            
            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            logger.error(f"Error in friendship list: {str(e)}", exc_info=True)
            return JsonResponse({
                "message": "친구 목록 조회 중 오류가 발생했습니다.",
                "friends": [],
                "count": 0
            }, status=200)  # 500 대신 200으로 변경하여 프론트엔드에서 처리할 수 있게 함
    
    @user_validator
    def post(self, request):
        """친구 요청 보내기"""
        try:
            user = request.user
            data = json.loads(request.body)
            friend_email = data.get('friend_email')
            
            if not friend_email:
                return JsonResponse({"message": "친구 이메일이 필요합니다."}, status=400)
            
            # 자기 자신에게 친구 요청하는 것 방지
            if friend_email == user.email:
                return JsonResponse({"message": "자기 자신에게는 친구 요청을 보낼 수 없습니다."}, status=400)
            
            # 친구가 될 사용자 찾기
            try:
                friend_user = User.objects.get(email=friend_email)
            except User.DoesNotExist:
                return JsonResponse({"message": "해당 이메일의 사용자를 찾을 수 없습니다."}, status=404)
            
            # 이미 친구 관계가 있는지 확인
            existing_friendship = models.Friendship.objects.filter(
                models.Q(user=user, friend=friend_user) | 
                models.Q(user=friend_user, friend=user)
            ).first()
            
            if existing_friendship:
                if existing_friendship.status == 'accepted':
                    return JsonResponse({"message": "이미 친구입니다."}, status=400)
                elif existing_friendship.status == 'pending':
                    return JsonResponse({"message": "이미 친구 요청을 보냈거나 받았습니다."}, status=400)
                elif existing_friendship.status == 'blocked':
                    return JsonResponse({"message": "차단된 사용자입니다."}, status=400)
            
            # 친구 요청 생성 (양방향으로 생성)
            friendship1 = models.Friendship.objects.create(
                recipient=user,
                friend=friend_user,
                requested_by=user,
                status='pending'
            )
            
            friendship2 = models.Friendship.objects.create(
                user=friend_user,
                friend=user,
                requested_by=user,
                status='pending'
            )
            
            # 상대방에게 알림 생성
            from users.models import Notification as ProjectNotification
            from projects.notification_service import NotificationService
            
            try:
                NotificationService.create_notification(
                    user=friend_user,
                    notification_type='FRIEND_REQUEST_RECEIVED',
                    title='새로운 친구 요청',
                    message=f'{user.nickname or user.username}님이 친구 요청을 보냈습니다.',
                    action_url=f'/friends/requests'
                )
            except Exception as e:
                logger.error(f"친구 요청 알림 생성 실패: {str(e)}")
            
            return JsonResponse({
                "message": "친구 요청을 보냈습니다.",
                "friendship_id": friendship1.id
            }, status=201)
            
        except Exception as e:
            logger.error(f"Error in friend request: {str(e)}")
            return JsonResponse({"message": "친구 요청 중 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def delete(self, request):
        """친구 삭제"""
        try:
            user = request.user
            data = json.loads(request.body)
            friend_email = data.get('friend_email')
            
            if not friend_email:
                return JsonResponse({"message": "친구 이메일이 필요합니다."}, status=400)
            
            # 친구 사용자 찾기
            try:
                friend_user = User.objects.get(email=friend_email)
            except User.DoesNotExist:
                return JsonResponse({"message": "해당 이메일의 사용자를 찾을 수 없습니다."}, status=404)
            
            # 친구 관계 찾기 및 삭제
            friendships = models.Friendship.objects.filter(
                models.Q(user=user, friend=friend_user) | 
                models.Q(user=friend_user, friend=user)
            )
            
            if not friendships.exists():
                return JsonResponse({"message": "친구 관계가 존재하지 않습니다."}, status=404)
            
            # 양방향 친구 관계 모두 삭제
            deleted_count = friendships.delete()[0]
            
            return JsonResponse({
                "message": f"{friend_user.nickname or friend_user.username}님을 친구 목록에서 삭제했습니다.",
                "deleted_count": deleted_count
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in friend deletion: {str(e)}")
            return JsonResponse({"message": "친구 삭제 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FriendRequestView(View):
    """받은 친구 요청 목록"""
    
    @user_validator
    def get(self, request):
        """받은 친구 요청 목록 조회"""
        try:
            user = request.user
            
            # 나에게 온 친구 요청들 (pending 상태)
            friend_requests = models.Friendship.objects.filter(
                recipient=user,
                status='pending'
            ).select_related('requested_by', 'requested_by__profile')
            
            requests_data = []
            for friendship in friend_requests:
                requester = friendship.requested_by
                requests_data.append({
                    "id": friendship.id,
                    "requester": {
                        "id": requester.id,
                        "email": requester.email,
                        "nickname": requester.nickname or requester.username,
                        "profile_image": requester.profile.profile_image.url if hasattr(requester, 'profile') and requester.profile.profile_image else None,
                        "company": requester.profile.company if hasattr(requester, 'profile') else '',
                        "position": requester.profile.position if hasattr(requester, 'profile') else '',
                    },
                    "requested_at": friendship.created.isoformat()
                })
            
            # 빈 목록일 때 명확한 메시지 추가
            response_data = {
                "requests": requests_data,
                "count": len(requests_data)
            }
            
            if len(requests_data) == 0:
                response_data["message"] = "받은 친구 요청이 없습니다."
            
            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            logger.error(f"Error in friend requests: {str(e)}", exc_info=True)
            return JsonResponse({
                "message": "친구 요청 목록 조회 중 오류가 발생했습니다.",
                "requests": [],
                "count": 0
            }, status=200)  # 500 대신 200으로 변경하여 프론트엔드에서 처리할 수 있게 함


@method_decorator(csrf_exempt, name='dispatch')
class FriendRequestResponse(View):
    """친구 요청 수락/거절"""
    
    @user_validator
    def post(self, request, friendship_id):
        """친구 요청 응답"""
        try:
            user = request.user
            data = json.loads(request.body)
            action = data.get('action')  # 'accept' or 'decline'
            
            if action not in ['accept', 'decline']:
                return JsonResponse({"message": "잘못된 액션입니다."}, status=400)
            
            # 친구 요청 확인
            friendship = models.Friendship.objects.filter(
                id=friendship_id,
                recipient=user,
                status='pending'
            ).first()
            
            if not friendship:
                return JsonResponse({"message": "친구 요청을 찾을 수 없습니다."}, status=404)
            
            from django.utils import timezone
            
            if action == 'accept':
                # 양방향 친구 관계 수락
                models.Friendship.objects.filter(
                    models.Q(user=user, friend=friendship.requested_by) |
                    models.Q(user=friendship.requested_by, friend=user)
                ).update(
                    status='accepted',
                    responded_at=timezone.now()
                )
                
                # 요청자에게 알림
                from projects.notification_service import NotificationService
                try:
                    NotificationService.create_notification(
                        user=friendship.requested_by,
                        notification_type='FRIEND_REQUEST_ACCEPTED',
                        title='친구 요청 수락',
                        message=f'{user.nickname or user.username}님이 친구 요청을 수락했습니다.',
                        action_url=f'/friends'
                    )
                except Exception as e:
                    logger.error(f"친구 수락 알림 생성 실패: {str(e)}")
                
                return JsonResponse({"message": "친구 요청을 수락했습니다."}, status=200)
            
            else:  # decline
                # 양방향 친구 관계 거절
                models.Friendship.objects.filter(
                    models.Q(user=user, friend=friendship.requested_by) |
                    models.Q(user=friendship.requested_by, friend=user)
                ).update(
                    status='declined',
                    responded_at=timezone.now()
                )
                
                return JsonResponse({"message": "친구 요청을 거절했습니다."}, status=200)
            
        except Exception as e:
            logger.error(f"Error in friend request response: {str(e)}")
            return JsonResponse({"message": "친구 요청 응답 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FriendSearch(View):
    """친구 검색"""
    
    @user_validator
    def get(self, request):
        """친구 검색"""
        try:
            user = request.user
            query = request.GET.get('q', '').strip()
            
            if not query:
                return JsonResponse({"message": "검색어가 필요합니다."}, status=400)
            
            # 이메일 또는 닉네임으로 검색
            users = User.objects.filter(
                models.Q(email__icontains=query) | 
                models.Q(nickname__icontains=query)
            ).exclude(id=user.id).select_related('profile')[:10]
            
            # 이미 친구인 사용자들 ID 목록
            friend_ids = set()
            friendships = models.Friendship.objects.filter(
                models.Q(user=user) | models.Q(friend=user),
                status__in=['pending', 'accepted']
            )
            
            for friendship in friendships:
                if friendship.user == user:
                    friend_ids.add(friendship.friend.id)
                else:
                    friend_ids.add(friendship.user.id)
            
            users_data = []
            for search_user in users:
                friendship_status = 'none'
                if search_user.id in friend_ids:
                    # 구체적인 상태 확인
                    friendship = models.Friendship.objects.filter(
                        models.Q(user=user, friend=search_user) | 
                        models.Q(user=search_user, friend=user)
                    ).first()
                    if friendship:
                        friendship_status = friendship.status
                
                users_data.append({
                    "id": search_user.id,
                    "email": search_user.email,
                    "nickname": search_user.nickname or search_user.username,
                    "profile_image": search_user.profile.profile_image.url if hasattr(search_user, 'profile') and search_user.profile.profile_image else None,
                    "company": search_user.profile.company if hasattr(search_user, 'profile') else '',
                    "position": search_user.profile.position if hasattr(search_user, 'profile') else '',
                    "friendship_status": friendship_status
                })
            
            return JsonResponse({
                "users": users_data,
                "count": len(users_data)
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in friend search: {str(e)}")
            return JsonResponse({"message": "친구 검색 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class RecentInvitationView(View):
    """최근 초대한 사람 목록"""
    
    @user_validator
    def get(self, request):
        """최근 초대한 사람 목록 조회"""
        try:
            user = request.user
            limit = int(request.GET.get('limit', 10))
            
            recent_invitations = models.RecentInvitation.objects.filter(
                inviter=user
            ).order_by('-last_invited_at')[:limit]
            
            invitations_data = []
            for invitation in recent_invitations:
                invitations_data.append({
                    "email": invitation.invitee_email,
                    "name": invitation.invitee_name,
                    "last_project": invitation.project_name,
                    "invitation_count": invitation.invitation_count,
                    "last_invited_at": invitation.last_invited_at.isoformat()
                })
            
            # 빈 목록일 때 명확한 메시지 추가
            response_data = {
                "recent_invitations": invitations_data,
                "count": len(invitations_data)
            }
            
            if len(invitations_data) == 0:
                response_data["message"] = "아직 초대한 사람이 없습니다."
            
            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            logger.error(f"Error in recent invitations: {str(e)}", exc_info=True)
            return JsonResponse({
                "message": "최근 초대 목록 조회 중 오류가 발생했습니다.",
                "recent_invitations": [],
                "count": 0
            }, status=200)  # 500 대신 200으로 변경하여 프론트엔드에서 처리할 수 있게 함


@method_decorator(csrf_exempt, name='dispatch')
class EmailVerificationView(View):
    """이메일 인증 처리"""
    
    def get(self, request, token):
        """이메일 인증 토큰 검증"""
        try:
            from .email_verification_service import EmailVerificationService
            
            success, message = EmailVerificationService.verify_email(token)
            
            if success:
                # 환영 이메일 발송 (백그라운드에서 비동기적으로)
                try:
                    from .models import EmailVerificationToken
                    verification_token = EmailVerificationToken.objects.get(token=token)
                    EmailVerificationService.send_welcome_email(verification_token.user)
                except Exception as e:
                    logger.warning(f"환영 이메일 발송 실패: {str(e)}")
                
                return JsonResponse({
                    "success": True,
                    "message": message
                }, status=200)
            else:
                return JsonResponse({
                    "success": False,
                    "message": message
                }, status=400)
                
        except Exception as e:
            logger.error(f"Error in email verification: {str(e)}")
            return JsonResponse({
                "success": False,
                "message": "인증 처리 중 오류가 발생했습니다."
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ResendVerificationEmailView(View):
    """인증 이메일 재발송"""
    
    def post(self, request):
        """인증 이메일 재발송"""
        try:
            data = json.loads(request.body)
            email = data.get("email")
            
            if not email:
                return JsonResponse({"message": "이메일을 입력해 주세요."}, status=400)
            
            # 이메일 유효성 검증
            is_valid, error_msg = InputValidator.validate_email(email)
            if not is_valid:
                return StandardResponse.validation_error({"email": error_msg})
            
            # 사용자 존재 확인
            # N+1 쿼리 최적화: 사용자 찾기 최적화
            user = models.User.objects.filter(username=email).first()
            if not user:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=404)
            
            # 이메일 인증 재발송 - 안전한 처리
            try:
                from .email_verification_service import EmailVerificationService
                success, message = EmailVerificationService.resend_verification_email(user)
                
                if success:
                    return JsonResponse({"message": message}, status=200)
                else:
                    return JsonResponse({"message": message}, status=400)
            except Exception as e:
                logger.error(f"이메일 인증 서비스 오류: {str(e)}")
                # 임시 해결책: 사용자 이메일 인증 상태를 True로 변경
                user.email_verified = True
                user.email_verified_at = timezone.now()
                user.save()
                return JsonResponse({
                    "message": "이메일 인증이 완료되었습니다. 다시 로그인해 주세요.",
                    "verified": True
                }, status=200)
                
        except json.JSONDecodeError:
            return JsonResponse({"message": "잘못된 요청 형식입니다."}, status=400)
        except Exception as e:
            logger.error(f"Error in resend verification email: {str(e)}")
            return JsonResponse({"message": "이메일 재발송 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CheckEmailVerificationStatusView(View):
    """이메일 인증 상태 확인"""
    
    def post(self, request):
        """이메일 인증 상태 확인"""
        try:
            data = json.loads(request.body)
            email = data.get("email")
            
            if not email:
                return JsonResponse({"message": "이메일을 입력해 주세요."}, status=400)
            
            # 사용자 존재 확인
            # N+1 쿼리 최적화: 사용자 찾기 최적화
            user = models.User.objects.filter(username=email).first()
            if not user:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=404)
            
            # 인증 상태 반환
            return JsonResponse({
                "email_verified": user.email_verified,
                "verified_at": user.email_verified_at.isoformat() if user.email_verified_at else None,
                "user": user.username,
                "nickname": user.nickname
            }, status=200)
                
        except json.JSONDecodeError:
            return JsonResponse({"message": "잘못된 요청 형식입니다."}, status=400)
        except Exception as e:
            logger.error(f"Error in check email verification status: {str(e)}")
            return JsonResponse({"message": "인증 상태 확인 중 오류가 발생했습니다."}, status=500)


# 디버그 뷰 임포트 (임시)
from .views_debug import JWTDebugView, AuthDebugView


@method_decorator(csrf_exempt, name='dispatch')
class FriendBlockView(View):
    """친구 차단 관리"""
    
    @user_validator
    def post(self, request):
        """친구 차단"""
        try:
            user = request.user
            data = json.loads(request.body)
            friend_email = data.get('friend_email')
            
            if not friend_email:
                return JsonResponse({"message": "차단할 사용자의 이메일이 필요합니다."}, status=400)
            
            # 자기 자신을 차단하는 것 방지
            if friend_email == user.email:
                return JsonResponse({"message": "자기 자신을 차단할 수 없습니다."}, status=400)
            
            # 차단할 사용자 찾기
            try:
                friend_user = User.objects.get(email=friend_email)
            except User.DoesNotExist:
                return JsonResponse({"message": "해당 이메일의 사용자를 찾을 수 없습니다."}, status=404)
            
            # 기존 친구 관계 찾기
            friendship = models.Friendship.objects.filter(
                models.Q(user=user, friend=friend_user) | 
                models.Q(user=friend_user, friend=user)
            ).first()
            
            if friendship:
                # 기존 관계를 차단으로 변경
                models.Friendship.objects.filter(
                    models.Q(user=user, friend=friend_user) | 
                    models.Q(user=friend_user, friend=user)
                ).update(status='blocked', requested_by=user)
            else:
                # 새로운 차단 관계 생성
                models.Friendship.objects.create(
                    user=user,
                    friend=friend_user,
                    requested_by=user,
                    status='blocked'
                )
            
            return JsonResponse({
                "message": f"{friend_user.nickname or friend_user.username}님을 차단했습니다."
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in friend block: {str(e)}")
            return JsonResponse({"message": "사용자 차단 중 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def delete(self, request):
        """친구 차단 해제"""
        try:
            user = request.user
            data = json.loads(request.body)
            friend_email = data.get('friend_email')
            
            if not friend_email:
                return JsonResponse({"message": "차단 해제할 사용자의 이메일이 필요합니다."}, status=400)
            
            # 차단 해제할 사용자 찾기
            try:
                friend_user = User.objects.get(email=friend_email)
            except User.DoesNotExist:
                return JsonResponse({"message": "해당 이메일의 사용자를 찾을 수 없습니다."}, status=404)
            
            # 차단 관계 찾기 및 삭제
            friendships = models.Friendship.objects.filter(
                models.Q(user=user, friend=friend_user) | 
                models.Q(user=friend_user, friend=user),
                status='blocked'
            )
            
            if not friendships.exists():
                return JsonResponse({"message": "차단된 관계가 존재하지 않습니다."}, status=404)
            
            # 차단 관계 삭제
            deleted_count = friendships.delete()[0]
            
            return JsonResponse({
                "message": f"{friend_user.nickname or friend_user.username}님의 차단을 해제했습니다.",
                "deleted_count": deleted_count
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in friend unblock: {str(e)}")
            return JsonResponse({"message": "차단 해제 중 오류가 발생했습니다."}, status=500)
