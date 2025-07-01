# -*- coding: utf-8 -*-
import logging, json, jwt, random, requests
import os
from django.conf import settings
from datetime import datetime, timedelta
from django.shortcuts import render
from django.contrib.auth import authenticate
from . import models
from django.views import View
from django.http import JsonResponse
from .utils import user_validator, auth_send_email
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView


########## username이 kakao,naver,google이든 회원가입 때 중복되면 생성x
# 이메일 중복 확인
@method_decorator(csrf_exempt, name='dispatch')
class CheckEmail(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            
            if not email:
                return JsonResponse({"message": "이메일을 입력해주세요."}, status=400)
            
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
            import re
            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_regex, email):
                return JsonResponse({"message": "올바른 이메일 형식이 아닙니다."}, status=400)
            
            # 닉네임 길이 검증
            if len(nickname) < 2:
                return JsonResponse({"message": "닉네임은 최소 2자 이상이어야 합니다."}, status=400)
            
            # 비밀번호 길이 검증
            if len(password) < 10:
                return JsonResponse({"message": "비밀번호는 최소 10자 이상이어야 합니다."}, status=400)

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
                    "user": new_user.username,
                    "nickname": new_user.nickname,
                },
                status=201,
            )
            res.set_cookie(
                "vridge_session",
                vridge_session,
                samesite="None",
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
                        "user": user.username,
                    },
                    status=201,
                )
                res.set_cookie(
                    "vridge_session",
                    vridge_session,
                    samesite="None",
                    secure=True,
                    max_age=2419200,
                )
                return res
            else:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=403)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SendAuthNumber(View):
    def post(self, request, types):
        try:
            print(f"[SendAuthNumber] Request received for {types}")
            print(f"[SendAuthNumber] Request body: {request.body}")
            data = json.loads(request.body)
            email = data.get("email")
            print(f"[SendAuthNumber] Email: {email}")
            
            # 이메일 유효성 검사
            import re
            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not email or not re.match(email_regex, email):
                return JsonResponse({"message": "올바른 이메일 주소를 입력해주세요."}, status=400)

            auth_number = random.randint(100000, 999999)  # 6자리 숫자

            user = models.User.objects.get_or_none(username=email)

            if types == "reset":
                if user is None:
                    return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=500)

                if user.login_method != "email":
                    return JsonResponse({"message": "소셜 로그인 계정입니다."}, status=500)

                user.email_secret = auth_number
                user.save()
            else:
                if user:
                    return JsonResponse({"message": "이미 가입되어 있는 사용자입니다."}, status=500)
                email_verify, is_created = models.EmailVerify.objects.get_or_create(email=email)
                email_verify.auth_number = auth_number
                email_verify.save()

            try:
                result = auth_send_email(request, email, auth_number)
                if result:
                    print(f"[SendAuthNumber] Email sent successfully to {email}")
                    return JsonResponse({
                        "message": "success",
                        "detail": "인증번호가 이메일로 발송되었습니다.",
                        "email": email
                    }, status=200)
                else:
                    print(f"[SendAuthNumber] Email sending failed for {email}")
                    return JsonResponse({
                        "message": "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요."
                    }, status=500)
            except Exception as email_error:
                print(f"[SendAuthNumber] Email sending error: {str(email_error)}")
                import traceback
                traceback.print_exc()
                return JsonResponse({
                    "message": "이메일 발송 중 오류가 발생했습니다."
                }, status=500)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class EmailAuth(View):
    def post(self, request, types):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            auth_number = data.get("auth_number")

            if types == "reset":
                user = models.User.objects.get_or_none(username=email)

                if not user:
                    return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=500)

                if auth_number == user.email_secret:
                    return JsonResponse({"message": "success"}, status=200)
                else:
                    return JsonResponse({"message": "인증번호가 틀렸습니다."}, status=500)

            else:
                email_verify = models.EmailVerify.objects.get_or_none(email=email)
                if not email_verify:
                    return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=404)
                if email_verify.auth_number == auth_number:
                    email_verify.delete()
                    return JsonResponse({"message": "success"}, status=200)
                else:
                    return JsonResponse({"message": "인증번호가 일치하지 않습니다"}, status=404)

        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class ResetPassword(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            user = models.User.objects.get_or_none(username=email)
            if user:
                user.set_password(password)
                user.save()
                return JsonResponse({"message": "success"}, status=200)
            else:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=403)
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
                return JsonResponse({"message": "카카오 이메일이 없습니다."}, status=500)

            user, is_created = models.User.objects.get_or_create(username=email)

            if is_created:
                user.login_method = "kakao"
                user.nickname = nickname
                user.save()
            else:
                if user.login_method != "kakao":
                    return JsonResponse({"message": "로그인 방식이 잘못되었습니다."}, status=500)

            vridge_session = jwt.encode(
                {
                    "user_id": user.id,
                    "exp": datetime.utcnow() + timedelta(days=28),
                },
                settings.SECRET_KEY,
                settings.ALGORITHM,
            )
            res = JsonResponse(
                {
                    "message": "success",
                    "vridge_session": vridge_session,
                    "user": user.username,
                },
                status=201,
            )
            res.set_cookie(
                "vridge_session",
                vridge_session,
                samesite="None",
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
                return JsonResponse({"message": "네이버 이메일이 없습니다."}, status=500)

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
                    return JsonResponse({"message": "로그인 방식이 잘못되었습니다."}, status=500)

            vridge_session = jwt.encode(
                {
                    "user_id": user.id,
                    "exp": datetime.utcnow() + timedelta(days=28),
                },
                settings.SECRET_KEY,
                settings.ALGORITHM,
            )
            res = JsonResponse(
                {
                    "message": "success",
                    "vridge_session": vridge_session,
                    "user": user.username,
                },
                status=201,
            )
            res.set_cookie(
                "vridge_session",
                vridge_session,
                samesite="None",
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
                return JsonResponse({"message": "잘못된 요청입니다."}, status=500)

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
                return JsonResponse({"message": "구글 이메일이 없습니다."}, status=500)

            user, is_created = models.User.objects.get_or_create(username=email)
            if is_created:
                user.login_method = "google"
                user.nickname = nickname
                user.save()
            else:
                if user.login_method != "google":
                    return JsonResponse({"message": "로그인 방식이 잘못되었습니다."}, status=500)

            vridge_session = jwt.encode(
                {
                    "user_id": user.id,
                    "exp": datetime.utcnow() + timedelta(days=28),
                },
                settings.SECRET_KEY,
                settings.ALGORITHM,
            )
            res = JsonResponse(
                {
                    "message": "success",
                    "vridge_session": vridge_session,
                    "user": user.username,
                },
                status=201,
            )
            res.set_cookie(
                "vridge_session",
                vridge_session,
                samesite="None",
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
                return JsonResponse({"message": "메모를 찾을 수  없습니다."}, status=500)

            if memo.user != user:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            memo.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)
