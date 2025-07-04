import threading
from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from . import models
from projects import models as project_model

from django.core.mail import EmailMessage, send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def user_validator(function):
    def wrapper(self, request, *args, **kwargs):
        try:
            # Debug logging
            print(f"Request method: {request.method}")
            print(f"Request headers: {request.META.get('HTTP_AUTHORIZATION', 'No auth header')}")
            print(f"Content-Type: {request.content_type}")
            
            # Use Django REST Framework's JWT authentication
            jwt_auth = JWTAuthentication()
            
            try:
                # This will validate the token and return (user, token)
                user, token = jwt_auth.authenticate(request)
                if user:
                    request.user = user
                    print("request.user", request.user)
                    return function(self, request, *args, **kwargs)
                else:
                    # Fallback to cookie if header auth fails
                    vridge_session = request.COOKIES.get("vridge_session", None)
                    if vridge_session:
                        # Create a fake request with the token in header
                        class FakeRequest:
                            def __init__(self, token):
                                self.META = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
                        
                        fake_request = FakeRequest(vridge_session)
                        user, token = jwt_auth.authenticate(fake_request)
                        if user:
                            request.user = user
                            print("request.user", request.user)
                            return function(self, request, *args, **kwargs)
                    
                    return JsonResponse({"message": "NEED_ACCESS_TOKEN"}, status=401)
                    
            except (InvalidToken, TokenError) as e:
                print(f"Token validation error: {e}")
                return JsonResponse({"message": "INVALID_TOKEN"}, status=401)
                
        except Exception as e:
            print(f"Authentication error: {e}")
            return JsonResponse({"message": "AUTHENTICATION_ERROR"}, status=401)

    return wrapper


class EmailThread(threading.Thread):
    def __init__(self, subject, body, recipient_list, html_message):
        self.subject = subject
        self.body = body
        self.recipient_list = recipient_list
        self.fail_silently = False
        self.html_message = html_message
        threading.Thread.__init__(self)

    def run(self):
        try:
            from django.conf import settings
            print(f"[Email] Attempting to send email to {self.recipient_list}")
            print(f"[Email] EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
            print(f"[Email] EMAIL_HOST: {settings.EMAIL_HOST}")
            print(f"[Email] EMAIL_PORT: {settings.EMAIL_PORT}")
            print(f"[Email] EMAIL_HOST_USER: {settings.EMAIL_HOST_USER[:3]}..." if settings.EMAIL_HOST_USER else "[Email] EMAIL_HOST_USER: Not set")
            
            email = EmailMultiAlternatives(
                subject=self.subject, 
                body=self.body, 
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=self.recipient_list
            )
            if self.html_message:
                email.attach_alternative(self.html_message, "text/html")
            result = email.send(self.fail_silently)
            print(f"[Email] Email sent successfully to {self.recipient_list}. Result: {result}")
        except Exception as e:
            print(f"[Email] Failed to send email to {self.recipient_list}: {str(e)}")
            import traceback
            traceback.print_exc()


def auth_send_email(request, email, secret):
    """인증 번호 이메일 발송"""
    try:
        # 이메일 설정 확인
        print(f"[Email] Sending auth email to: {email}")
        print(f"[Email] Auth number: {secret}")
        
        # 실제 이메일 발송이 필요한 경우 설정 확인
        if settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
            if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
                print("[Email] ERROR: Email credentials not configured")
                return False
        
        # HTML 템플릿이 없는 경우를 대비한 간단한 HTML 메시지
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>VideoPlanet 인증번호</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; margin: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #012fff; margin: 0; font-size: 32px;">VideoPlanet</h1>
                    <p style="color: #666; margin-top: 10px; font-size: 18px;">이메일 인증</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        회원가입을 계속하려면 아래 인증번호를 입력해주세요:
                    </p>
                    
                    <div style="background: #012fff; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;">{secret}</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        이 인증번호는 3분간 유효합니다.
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                    <p style="font-size: 12px; color: #999; margin: 0;">
                        이 이메일은 VideoPlanet 회원가입 과정에서 발송되었습니다.
                    </p>
                    <p style="font-size: 12px; color: #999; margin: 5px 0;">
                        본인이 요청하지 않은 경우, 이 메일을 무시하셔도 됩니다.
                    </p>
                    <p style="font-size: 12px; color: #999; margin: 5px 0;">
                        © 2024 VideoPlanet. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        try:
            # verify_email.html 템플릿이 있으면 사용
            html_message = render_to_string("verify_email.html", {"secret": secret})
        except:
            # 템플릿이 없으면 위의 기본 HTML 사용
            pass
        
        to = [email]
        EmailThread("VideoPlanet 인증번호", strip_tags(html_message), to, html_message).start()
        return True
        
    except Exception as e:
        print(f"[Email] Error in auth_send_email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def invite_send_email(request, email, uid, token, name):
    if settings.DEBUG:
        url = "http://localhost:3000/EmailCheck"
    else:
        url = "https://vlanet.net/EmailCheck"
    html_message = render_to_string(
        "invite_email.html",
        {
            "uid": uid,
            "token": token,
            "url": url,
            "scheme": request.scheme,
            "domain": request.META["HTTP_HOST"],
            "name": name,
        },
    )
    to = [email]
    EmailThread("Vlanet", strip_tags(html_message), to, html_message).start()


# request.Meta
# CONTENT_LENGTH– 요청 본문의 길이(문자열).
# CONTENT_TYPE– 요청 본문의 MIME 유형입니다.
# HTTP_ACCEPT– 응답에 허용되는 콘텐츠 유형.
# HTTP_ACCEPT_ENCODING– 응답에 허용되는 인코딩.
# HTTP_ACCEPT_LANGUAGE– 응답에 허용되는 언어.
# HTTP_HOST– 클라이언트가 보낸 HTTP 호스트 헤더입니다.
# HTTP_REFERER– 참조 페이지(있는 경우).
# HTTP_USER_AGENT– 클라이언트의 사용자 에이전트 문자열.
# QUERY_STRING– 쿼리 문자열은 단일(파싱되지 않은) 문자열입니다.
# REMOTE_ADDR– 클라이언트의 IP 주소.
# REMOTE_HOST– 클라이언트의 호스트 이름.
# REMOTE_USER– 웹 서버에서 인증된 사용자(있는 경우).
# REQUEST_METHOD"GET"– 또는 와 같은 문자열 "POST".
# SERVER_NAME– 서버의 호스트 이름.
# SERVER_PORT– 서버의 포트(문자열).

from django.contrib.auth.tokens import default_token_generator  # 여기 참고하면서 토큰 생성
from django.utils.crypto import salted_hmac, constant_time_compare
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str


def project_token_generator(project):
    value = (
        f"{project.id}{project.user.id}{project.user.username}{project.user.password}"
    )
    token = salted_hmac(
        "django.winnmedia.virege.project.inviteToken",
        value,
        secret=settings.SECRET_KEY,
    ).hexdigest()[::2]
    return token


def check_project_token(project, token):
    if not (project and token):
        return False
    return constant_time_compare(project_token_generator(project), token)
