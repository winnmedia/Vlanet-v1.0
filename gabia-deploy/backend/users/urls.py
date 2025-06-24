from django.urls import path
from . import views

urlpatterns = [
    path("login", views.SignIn.as_view()),
    path("signup", views.SignUp.as_view()),
    path("send_authnumber/<str:types>", views.SendAuthNumber.as_view()),  # 인증번호 보내기 (회원가입)
    path("signup_emailauth/<str:types>", views.EmailAuth.as_view()),  # 인증번호 확인하기 (회원가입)
    path("password_reset", views.ResetPassword.as_view()),
    path("login/kakao", views.KakaoLogin.as_view()),
    path("login/naver", views.NaverLogin.as_view()),
    path("login/google", views.GoogleLogin.as_view()),
    path("memo", views.UserMemo.as_view()),  # create memo
    path("memo/<int:id>", views.UserMemo.as_view()),  # delete memo
]
