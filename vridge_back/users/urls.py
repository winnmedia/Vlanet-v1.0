from django.urls import path
from . import views
from .create_users_endpoint import CreateTestUsers
from . import views_signup_with_email
from . import views_profile
from . import views_mypage
from . import views_profile_upload

urlpatterns = [
    path("login/", views.SignIn.as_view()),
    path("signup/", views.SignUp.as_view()),  # 기존 회원가입 (임시 유지)
    
    # 새로운 이메일 인증 회원가입 프로세스
    path("signup/request/", views_signup_with_email.SignUpRequest.as_view()),  # Step 1: 이메일 인증 요청
    path("signup/verify/", views_signup_with_email.SignUpVerify.as_view()),     # Step 2: 인증번호 확인
    path("signup/complete/", views_signup_with_email.SignUpComplete.as_view()),  # Step 3: 회원가입 완료
    
    path("check-email/", views.CheckEmail.as_view()),  # 이메일 중복 확인
    path("check-nickname/", views.CheckNickname.as_view()),  # 닉네임 중복 확인
    path("send_authnumber/<str:types>/", views.SendAuthNumber.as_view()),  # 인증번호 보내기 (회원가입)
    path("signup_emailauth/<str:types>/", views.EmailAuth.as_view()),  # 인증번호 확인하기 (회원가입)
    path("password_reset/", views.ResetPassword.as_view()),
    path("login/kakao/", views.KakaoLogin.as_view()),
    path("login/naver/", views.NaverLogin.as_view()),
    path("login/google/", views.GoogleLogin.as_view()),
    path("memo/", views.UserMemo.as_view()),  # create memo
    path("memo/<int:id>/", views.UserMemo.as_view()),  # delete memo
    path("create-test-users/", CreateTestUsers.as_view()),  # 테스트 사용자 생성
    
    # 프로필 관련 URL
    path("profile/", views_profile.UserProfile.as_view()),  # 프로필 조회/수정
    path("profile/change-password/", views_profile.ChangePassword.as_view()),  # 비밀번호 변경
    path("profile/stats/", views_profile.UserStats.as_view()),  # 사용자 통계
    path("profile/delete-account/", views_profile.DeleteAccount.as_view()),  # 계정 삭제
    
    # 마이페이지 관련 URL
    path("mypage/", views_mypage.MyPageView.as_view()),  # 마이페이지 종합 정보
    path("mypage/activity/", views_mypage.UserActivityView.as_view()),  # 활동 내역
    path("mypage/preferences/", views_mypage.UserPreferencesView.as_view()),  # 사용자 설정
    
    # 프로필 업로드 관련 URL
    path("profile/upload-image/", views_profile_upload.ProfileImageUpload.as_view()),  # 프로필 이미지 업로드/삭제
    path("profile/update/", views_profile_upload.ProfileUpdate.as_view()),  # 프로필 정보 업데이트
]
