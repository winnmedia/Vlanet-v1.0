from django.urls import path
from . import views
from .create_users_endpoint import CreateTestUsers
from . import views_signup_with_email

urlpatterns = [
    path("login", views.SignIn.as_view()),
    path("signup", views.SignUp.as_view()),  # 기존 회원가입 (임시 유지)
    
    # 새로운 이메일 인증 회원가입 프로세스
    path("signup/request", views_signup_with_email.SignUpRequest.as_view()),  # Step 1: 이메일 인증 요청
    path("signup/verify", views_signup_with_email.SignUpVerify.as_view()),     # Step 2: 인증번호 확인
    path("signup/complete", views_signup_with_email.SignUpComplete.as_view()),  # Step 3: 회원가입 완료
    
    path("check_email", views.CheckEmail.as_view()),  # 이메일 중복 확인
    path("check_nickname", views.CheckNickname.as_view()),  # 닉네임 중복 확인
    path("send_authnumber/<str:types>", views.SendAuthNumber.as_view()),  # 인증번호 보내기 (회원가입)
    path("signup_emailauth/<str:types>", views.EmailAuth.as_view()),  # 인증번호 확인하기 (회원가입)
    path("password_reset", views.ResetPassword.as_view()),
    path("login/kakao", views.KakaoLogin.as_view()),
    path("login/naver", views.NaverLogin.as_view()),
    path("login/google", views.GoogleLogin.as_view()),
    path("memo", views.UserMemo.as_view()),  # create memo
    path("memo/<int:id>", views.UserMemo.as_view()),  # delete memo
    path("create-test-users", CreateTestUsers.as_view()),  # 테스트 사용자 생성
]
