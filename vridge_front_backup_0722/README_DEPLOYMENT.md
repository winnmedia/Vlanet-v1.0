# 배포 가이드

## 환경 변수 설정

### 1. 개발 환경 (.env)
- 로컬 개발 시 사용
- Railway 서버를 테스트 백엔드로 사용

### 2. 프로덕션 환경 (.env.production)
실제 배포 시 다음 변수들을 실제 서버 정보로 수정해야 합니다:

```bash
# API URLs - 실제 서버 주소로 변경
REACT_APP_API_BASE_URL=https://your-actual-domain.com/api
REACT_APP_BACKEND_API_URL=https://your-actual-domain.com/api
REACT_APP_BACKEND_URI=https://your-actual-domain.com
REACT_APP_SOCKET_URI=wss://your-actual-domain.com
```

### 3. Vercel 배포 시
Vercel 대시보드에서 Environment Variables 설정:
1. Settings → Environment Variables
2. 위의 환경 변수들을 Production 환경에 추가
3. 재배포

### 4. 다른 플랫폼 배포 시
- **Netlify**: Site settings → Environment variables
- **AWS Amplify**: App settings → Environment variables
- **직접 서버**: 서버의 환경 변수 또는 .env.production 파일 사용

## 백엔드 서버 요구사항

실제 백엔드 서버는 다음을 지원해야 합니다:
1. CORS 설정 (프론트엔드 도메인 허용)
2. WebSocket 지원 (실시간 채팅)
3. 파일 업로드 (최대 600MB)
4. HTTPS 지원

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 파일은 build/ 폴더에 생성됨
```

## 환경별 API 사용

코드에서는 환경 변수를 통해 자동으로 올바른 서버를 사용합니다:
```javascript
const API_URL = process.env.REACT_APP_BACKEND_URI
const SOCKET_URL = process.env.REACT_APP_SOCKET_URI
```

개발 환경에서는 `.env` 파일의 설정을, 프로덕션 빌드 시에는 `.env.production` 파일의 설정을 사용합니다.