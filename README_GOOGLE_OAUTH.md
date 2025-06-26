# Google OAuth 설정 가이드

## 프론트엔드 설정

1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
   - https://console.cloud.google.com/apis/credentials
   - "OAuth 2.0 클라이언트 ID" 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 JavaScript 원본:
     - http://localhost:3000 (개발용)
     - https://videoplanetready.vercel.app (프로덕션)
   - 승인된 리디렉션 URI는 필요 없음 (implicit flow 사용)

2. 환경 변수 설정
   - 로컬: `.env.local` 파일에 `REACT_APP_GOOGLE_CLIENT_ID` 추가
   - Vercel: 대시보드에서 `REACT_APP_GOOGLE_CLIENT_ID` 환경 변수 추가

## 백엔드 설정

백엔드는 이미 Google OAuth를 처리할 준비가 되어 있습니다:
- 엔드포인트: `/api/users/login/google`
- 프론트엔드에서 받은 access_token을 검증하고 JWT 토큰 발급

## 테스트

1. 프론트엔드에서 "구글 로그인" 버튼 클릭
2. Google 계정으로 로그인
3. 성공 시 자동으로 대시보드로 이동