# -*- coding: utf-8 -*-
import logging, json, random, requests
import os
from django.conf import settings
from datetime import datetime, timedelta
from django.shortcuts import render
from django.contrib.auth import authenticate
from . import models
from django.views import View
from django.http import JsonResponse
from .utils import user_validator, auth_send_email
from .security_utils import PasswordResetSecurity
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
from .validators import InputValidator, validate_request_data

# from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView


########## username이 kakao,naver,google이든 회원가입 때 중복되면 생성x
# 이메일 중복 확인
@method_decorator(csrf_exempt, name='dispatch')
class CheckEmail(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            
            # 이메일 유효성 검증
            is_valid, error_msg = InputValidator.validate_email(email)
            if not is_valid:
                return JsonResponse({"message": error_msg}, status=400)
            
            user = models.User.objects.filter(username=email).first()
            if user:
                return JsonResponse({"message": "이미 사용 중인 이메일입니다."}, status=409)
            else:
                return JsonResponse({"message": "사용 가능한 이메일입니다."}, status=200)
                
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)


# 닉네임 중복 확인
@method_decorator(csrf_exempt, name='dispatch')
class CheckNickname(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            nickname = data.get("nickname")
            
            if not nickname:
                return JsonResponse({"message": "닉네임을 입력해주세요."}, status=400)
            
            if len(nickname) < 2:
                return JsonResponse({"message": "닉네임은 최소 2자 이상이어야 합니다."}, status=400)
            
            user = models.User.objects.filter(nickname=nickname).first()
            if user:
                return JsonResponse({"message": "이미 사용 중인 닉네임입니다."}, status=409)
            else:
                return JsonResponse({"message": "사용 가능한 닉네임입니다."}, status=200)
                
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SignUp(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            nickname = data.get("nickname")
            password = data.get("password")

            # 입력값 검증
            if not email or not nickname or not password:
                return JsonResponse({"message": "모든 필드를 입력해주세요."}, status=400)
            
            # 이메일 형식 검증
            is_valid, error_msg = InputValidator.validate_email(email)
            if not is_valid:
                return JsonResponse({"message": error_msg}, status=400)
            
            # 닉네임 검증
            is_valid, error_msg = InputValidator.validate_text_input(nickname, "닉네임", max_length=50)
            if not is_valid:
                return JsonResponse({"message": error_msg}, status=400)
            
            if len(nickname) < 2:
                return JsonResponse({"message": "닉네임은 최소 2자 이상이어야 합니다."}, status=400)
            
            # 비밀번호 검증
            is_valid, error_msg = InputValidator.validate_password(password)
            if not is_valid:
                return JsonResponse({"message": error_msg}, status=400)

            print(f"회원가입 시도 - 이메일: {email}, 닉네임: {nickname}")
            
            # 이메일 중복 확인
            user = models.User.objects.get_or_none(username=email)
            if user:
                return JsonResponse({"message": "이미 가입되어 있는 이메일입니다."}, status=409)
            
            # 닉네임 중복 확인
            nickname_exists = models.User.objects.filter(nickname=nickname).exists()
            if nickname_exists:
                return JsonResponse({"message": "이미 사용 중인 닉네임입니다."}, status=409)
            
            # 새 사용자 생성
            new_user = models.User.objects.create(
                username=email, 
                email=email,  # email 필드도 설정
                nickname=nickname,
                login_method='email'
            )
            new_user.set_password(password)
            new_user.save()
            
            print(f"회원가입 성공 - ID: {new_user.id}, 이메일: {new_user.username}")

            # JWT 토큰 생성 (SimpleJWT 사용)
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(new_user)
            vridge_session = str(refresh.access_token)
            
            res = JsonResponse(
                {
                    "message": "success",
                    "vridge_session": vridge_session,
                    "refresh_token": str(refresh),
                    "user": new_user.username,
                    "nickname": new_user.nickname,
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
            
        except json.JSONDecodeError:
            return JsonResponse({"message": "잘못된 요청 형식입니다."}, status=400)
        except Exception as e:
            print(f"회원가입 에러: {str(e)}")
            logging.error(f"SignUp Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({"message": "회원가입 처리 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SignIn(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            # Debug
            print(f"Login attempt - email: {email}, password: {'*' * len(password) if password else 'None'}")
            
            # Try direct user lookup first
            try:
                user_obj = models.User.objects.get(username=email)
                print(f"User found: {user_obj.username}, has_password: {bool(user_obj.password)}")
                
                # Check password manually
                from django.contrib.auth.hashers import check_password
                if check_password(password, user_obj.password):
                    user = user_obj
                    print("Password check passed")
                else:
                    user = None
                    print("Password check failed")
            except models.User.DoesNotExist:
                user = None
                print("User not found in database")
            
            if user is not None:
                # Use Django REST Framework SimpleJWT instead
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(user)
                vridge_session = str(refresh.access_token)
                res = JsonResponse(
                    {
                        "message": "success",
                        "vridge_session": vridge_session,
                        "refresh_token": str(refresh),
                        "user": user.username,
                        "nickname": user.nickname if user.nickname else user.username,
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
            else:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=404)
        except Exception as e:
            print(e)
            logging.info(str(e))
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
                    return JsonResponse({"message": error_msg}, status=400)

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
                return JsonResponse({"message": error_msg}, status=400)

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
            print(e)
            logging.info(str(e))
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
            print(kakao_user)

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
            print(e)
            logging.info(str(e))
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
            print(profile_json)

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
            print(e)
            logging.info(str(e))
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
            print(userinfo)

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
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


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
            print(e)
            logging.info(str(e))
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
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)
