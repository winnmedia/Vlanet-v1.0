from django.urls import path
from . import views
from .create_users_endpoint import CreateTestUsers
from rest_framework_simplejwt.views import TokenRefreshView
# 아래 모듈들은 아직 구현되지 않음
# from . import views_signup_with_email
# from . import views_profile
from . import views_mypage
from . import views_profile_upload
from . import views_email_monitor

urlpatterns = [
    path("csrf-token/", views.get_csrf_token, name="get_csrf_token"),  # CSRF 토큰 발급
    path("login/", views.SignIn.as_view()),
    path("signup/", views.SignUp.as_view()),  # 기존 회원가입 (임시 유지)
    path("me/", views.UserMe.as_view()),  # 현재 사용자 정보
    path("refresh/", TokenRefreshView.as_view()),  # JWT 토큰 갱신
    
    # 새로운 이메일 인증 회원가입 프로세스 (구현 예정)
    # path("signup/request/", views_signup_with_email.SignUpRequest.as_view()),  # Step 1: 이메일 인증 요청
    # path("signup/verify/", views_signup_with_email.SignUpVerify.as_view()),     # Step 2: 인증번호 확인
    # path("signup/complete/", views_signup_with_email.SignUpComplete.as_view()),  # Step 3: 회원가입 완료
    
    path("check-email/", views.CheckEmail.as_view()),  # 이메일 중복 확인
    path("check-nickname/", views.CheckNickname.as_view()),  # 닉네임 중복 확인
    path("send-authnumber/<str:types>/", views.SendAuthNumber.as_view()),  # 인증번호 보내기 (회원가입)
    path("signup-emailauth/<str:types>/", views.EmailAuth.as_view()),  # 인증번호 확인하기 (회원가입)
    path("password-reset/", views.ResetPassword.as_view()),
    path("login/kakao/", views.KakaoLogin.as_view()),
    path("login/naver/", views.NaverLogin.as_view()),
    path("login/google/", views.GoogleLogin.as_view()),
    path("memo/", views.UserMemo.as_view()),  # create memo
    path("memo/<int:id>/", views.UserMemo.as_view()),  # delete memo
    path("create-test-users/", CreateTestUsers.as_view()),  # 테스트 사용자 생성
    
    # 프로필 관련 URL (구현 예정)
    # path("profile/", views_profile.UserProfile.as_view()),  # 프로필 조회/수정
    # path("profile/change-password/", views_profile.ChangePassword.as_view()),  # 비밀번호 변경
    # path("profile/stats/", views_profile.UserStats.as_view()),  # 사용자 통계
    # path("profile/delete-account/", views_profile.DeleteAccount.as_view()),  # 계정 삭제
    
    # 마이페이지 관련 URL
    path("mypage/", views_mypage.MyPageView.as_view()),  # 마이페이지 종합 정보
    path("mypage/activity/", views_mypage.UserActivityView.as_view()),  # 활동 내역
    path("mypage/preferences/", views_mypage.UserPreferencesView.as_view()),  # 사용자 설정
    
    # 프로필 업로드 관련 URL
    path("profile/upload-image/", views_profile_upload.ProfileImageUpload.as_view()),  # 프로필 이미지 업로드/삭제
    path("profile/update/", views_profile_upload.ProfileUpdate.as_view()),  # 프로필 정보 업데이트
    
    # 알림 관련 URL
    path("notifications/", views.NotificationView.as_view()),  # 알림 목록 조회/읽음 처리
    path("notifications/unread-count/", views.UnreadNotificationCount.as_view()),  # 읽지 않은 알림 개수
    path("notifications/mark-read/", views.MarkNotificationsRead.as_view()),  # 여러 알림 읽음 처리
    path("notifications/<int:notification_id>/", views.NotificationDetail.as_view()),  # 알림 삭제
    
    # 친구 관련 URL
    path("friends/", views.FriendshipView.as_view()),  # 친구 목록 조회/친구 요청/친구 삭제
    path("friends/requests/", views.FriendRequestView.as_view()),  # 받은 친구 요청 목록
    path("friends/<int:friendship_id>/response/", views.FriendRequestResponse.as_view()),  # 친구 요청 수락/거절
    path("friends/search/", views.FriendSearch.as_view()),  # 친구 검색
    path("friends/block/", views.FriendBlockView.as_view()),  # 친구 차단/차단 해제
    
    # 최근 초대 관련 URL
    path("recent-invitations/", views.RecentInvitationsView.as_view()),  # 최근 초대한 사람 목록
    
    # 이메일 인증 관련 URL
    path("verify-email/<str:token>/", views.EmailVerificationView.as_view()),  # 이메일 인증 처리
    path("resend-verification-email/", views.ResendVerificationEmailView.as_view()),  # 인증 이메일 재발송
    path("check-verification-status/", views.CheckEmailVerificationStatusView.as_view()),  # 인증 상태 확인
    
    # 디버그 URL (임시)
    path("debug/jwt/", views.JWTDebugView.as_view()),  # JWT 토큰 디버깅
    path("debug/auth/", views.AuthDebugView.as_view()),  # 인증 상태 디버깅
    
    # 이메일 모니터링 URL (관리자용)
    path("email-monitor/status/<str:email_id>/", views_email_monitor.EmailStatusView.as_view()),  # 이메일 상태 조회
    path("email-monitor/dashboard/", views_email_monitor.EmailMonitorDashboardView.as_view()),  # 모니터링 대시보드
    path("email-monitor/resend/<str:email_id>/", views_email_monitor.EmailResendView.as_view()),  # 이메일 재발송
    path("email-monitor/bulk-send/", views_email_monitor.BulkEmailView.as_view()),  # 대량 이메일 발송
    path("email-monitor/cleanup/", views_email_monitor.EmailCleanupView.as_view()),  # 오래된 기록 정리
]
