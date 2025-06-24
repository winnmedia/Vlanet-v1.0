# -*- coding: utf-8 -*-
import logging, json, jwt, my_settings, random, requests
from datetime import datetime, timedelta
from django.shortcuts import render
from django.contrib.auth import authenticate
from . import models
from django.views import View
from django.http import JsonResponse
from .utils import user_validator, auth_send_email
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView


########## username이 kakao,naver,google이든 회원가입 때 중복되면 생성x
class SignUp(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            nickname = data.get("nickname")
            password = data.get("password")

            print(data)
            user = models.User.objects.get_or_none(username=email)
            if user:
                return JsonResponse({"message": "이미 가입되어 있는 사용자입니다."}, status=500)
            else:
                new_user = models.User.objects.create(username=email, nickname=nickname)
                new_user.set_password(password)
                new_user.save()

                vridge_session = jwt.encode(
                    {
                        "user_id": new_user.id,
                        "exp": datetime.utcnow() + timedelta(days=28),
                    },
                    my_settings.SECRET_KEY,
                    my_settings.ALGORITHM,
                )
                res = JsonResponse(
                    {
                        "message": "success",
                        "vridge_session": vridge_session,
                        "user": new_user.username,
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


class SignIn(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            user = authenticate(request, username=email, password=password, login_method="email")
            if user is not None:
                vridge_session = jwt.encode(
                    {"user_id": user.id, "exp": datetime.utcnow() + timedelta(days=28)},
                    my_settings.SECRET_KEY,
                    my_settings.ALGORITHM,
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
            else:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=403)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": str(e)}, status=500)


class SendAuthNumber(View):
    def post(self, request, types):
        try:
            data = json.loads(request.body)
            email = data.get("email")

            auth_number = random.randint(100000, 1000000)

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

            auth_send_email(request, email, auth_number)

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


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
                my_settings.SECRET_KEY,
                my_settings.ALGORITHM,
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

            NAVER_CLIENT_ID = my_settings.NAVER_CLIENT_ID
            NAVER_SECRET_KEY = my_settings.NAVER_SECRET_KEY

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
                my_settings.SECRET_KEY,
                my_settings.ALGORITHM,
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
                my_settings.SECRET_KEY,
                my_settings.ALGORITHM,
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
