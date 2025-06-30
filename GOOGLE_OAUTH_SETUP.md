# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### OAuth 2.0 클라이언트 ID 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스** → **사용자 인증 정보** 이동
4. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID** 클릭

### OAuth 클라이언트 설정

1. **애플리케이션 유형**: 웹 애플리케이션
2. **이름**: VideoPlanet (또는 원하는 이름)
3. **승인된 JavaScript 원본** 추가:
   ```
   http://localhost:3000              # 로컬 개발
   http://172.18.100.174:3000        # WSL 개발
   https://vlanet.net                # 프로덕션
   https://your-app.vercel.app       # Vercel 배포 URL
   ```
4. **승인된 리디렉션 URI**: 필요 없음 (implicit flow 사용)
5. **만들기** 클릭

### OAuth 동의 화면 설정

1. **OAuth 동의 화면** 메뉴 이동
2. **외부** 선택 (일반 사용자 로그인)
3. 앱 정보 입력:
   - 앱 이름: VideoPlanet
   - 사용자 지원 이메일: 본인 이메일
   - 앱 도메인: vlanet.net
4. 범위 추가:
   - userinfo.email
   - userinfo.profile
   - openid

## 2. 환경 변수 설정

### 로컬 개발 환경

`vridge_front/.env` 파일에 추가:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### 프로덕션 환경 (Vercel)

1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. 다음 환경 변수 추가:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
   ```
3. 모든 환경(Production, Preview, Development)에 적용

### 프로덕션 환경 (GitHub Actions)

`.github/workflows/deploy.yml`에 이미 설정되어 있음:
```yaml
env:
  REACT_APP_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
```

GitHub Secrets에 추가:
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. **New repository secret** 클릭
3. Name: `GOOGLE_CLIENT_ID`
4. Value: Google Cloud Console에서 생성한 클라이언트 ID

## 3. 기능 확인

### 로컬 테스트
```bash
# 프론트엔드 재시작
cd vridge_front
npm start
```

### 테스트 절차
1. http://localhost:3000/login 접속
2. "구글 로그인" 버튼 클릭
3. Google 계정으로 로그인
4. 성공 시 자동으로 대시보드(/CmsHome)로 이동

### 디버깅

브라우저 개발자 도구 콘솔에서 확인:
- `process.env.REACT_APP_GOOGLE_CLIENT_ID` 값 확인
- 네트워크 탭에서 `/api/users/login/google` 요청 확인

## 4. 주의사항

1. **Client ID 보안**: 
   - GitHub에 직접 커밋하지 않기
   - 환경 변수로만 관리

2. **도메인 설정**:
   - 프로덕션 배포 시 Google Console에서 도메인 추가 필수
   - http와 https 구분 주의

3. **에러 처리**:
   - "로그인 방식이 잘못되었습니다": 이미 다른 방법으로 가입한 이메일
   - "구글 이메일이 없습니다": Google 계정에 이메일 권한 없음

## 5. 추가 설정 (선택사항)

### 커스텀 로그인 버튼
현재 기본 텍스트 버튼을 Google 스타일 버튼으로 변경하려면:

1. Google 브랜드 가이드라인 준수
2. SVG 아이콘 추가
3. CSS 스타일링 적용

### 로그인 후 리다이렉트
특정 페이지로 리다이렉트하려면 `Login.jsx`의 `CommonLoginSuccess` 함수 수정