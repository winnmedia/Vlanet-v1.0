# Vercel 프론트엔드 배포 가이드

## 사전 준비사항
1. Vercel 계정 생성 (https://vercel.com)
2. Git repository가 최신 상태인지 확인

## 배포 방법

### 방법 1: Vercel CLI 사용 (추천)

1. Vercel CLI 설치:
```bash
npm i -g vercel
```

2. 프론트엔드 디렉토리로 이동:
```bash
cd vridge_front
```

3. Vercel 배포:
```bash
vercel
```

4. 프롬프트에 따라:
   - 로그인
   - 프로젝트 이름 설정 (예: videoplanet)
   - 빌드 설정 확인

### 방법 2: GitHub 연동 (자동 배포)

1. https://vercel.com/new 접속
2. GitHub repository 연결
3. 다음 설정 입력:
   - **Root Directory**: `vridge_front`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. 환경변수 설정:
   - `REACT_APP_API_BASE_URL`: `https://videoplanet.up.railway.app/api`
   - `REACT_APP_BACKEND_API_URL`: `https://videoplanet.up.railway.app/api`

## 배포 후 설정

1. **백엔드 CORS 업데이트**:
   - Vercel에서 할당받은 URL 확인 (예: https://videoplanet.vercel.app)
   - `vridge_back/config/settings/railway_simple.py`의 `CORS_ALLOWED_ORIGINS`에 추가
   - Railway에 재배포

2. **도메인 설정** (선택사항):
   - Vercel 대시보드 > Settings > Domains
   - 커스텀 도메인 추가 가능

## 테스트

1. 배포된 URL 접속
2. 개발자 도구 > Network 탭 확인
3. API 요청이 `https://videoplanet.up.railway.app/api`로 가는지 확인

## 문제 해결

### CORS 에러
- 백엔드의 CORS_ALLOWED_ORIGINS에 프론트엔드 URL이 포함되어 있는지 확인
- Railway 재배포 필요

### API 연결 실패
- 백엔드가 실행 중인지 확인: https://videoplanet.up.railway.app/api/
- 환경변수가 올바르게 설정되었는지 확인

### 빌드 실패
- Node.js 버전 확인 (18.x 권장)
- `npm ci` 대신 `npm install` 사용 시도