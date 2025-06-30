# VideoPlanet 배포 가이드 (Railway + Vercel)

## 1. 백엔드 배포 (Railway)

### 사전 준비
1. [Railway](https://railway.app) 계정 생성
2. GitHub 저장소에 코드 푸시

### Railway 배포 단계

1. **새 프로젝트 생성**
   ```
   - Railway 대시보드에서 "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - VideoPlanet 저장소 선택
   ```

2. **환경 변수 설정**
   Railway 프로젝트 설정에서 다음 환경 변수 추가:
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-app.up.railway.app
   DATABASE_URL=(Railway가 자동으로 제공하는 PostgreSQL URL)
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   DJANGO_SETTINGS_MODULE=config.settings_prod
   ```

3. **PostgreSQL 데이터베이스 추가**
   ```
   - "New" → "Database" → "Add PostgreSQL" 클릭
   - DATABASE_URL이 자동으로 환경 변수에 추가됨
   ```

4. **배포 명령어 확인**
   Procfile이 자동으로 인식되어 다음 명령어가 실행됨:
   ```
   python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application
   ```

5. **도메인 설정**
   - Settings → Domains에서 Railway 제공 도메인 확인
   - 커스텀 도메인 추가 가능

## 2. 프론트엔드 배포 (Vercel)

### 사전 준비
1. [Vercel](https://vercel.com) 계정 생성
2. Vercel CLI 설치 (선택사항)
   ```bash
   npm i -g vercel
   ```

### Vercel 배포 단계

1. **프로젝트 Import**
   ```
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 import
   - Root Directory를 "vridge_front"로 설정
   ```

2. **환경 변수 설정**
   Vercel 프로젝트 설정에서 환경 변수 추가:
   ```
   REACT_APP_API_BASE_URL=https://your-app.up.railway.app
   REACT_APP_BACKEND_API_URL=https://your-app.up.railway.app
   REACT_APP_BACKEND_URI=https://your-app.up.railway.app
   REACT_APP_SOCKET_URI=wss://your-app.up.railway.app
   GENERATE_SOURCEMAP=false
   CI=false
   DISABLE_ESLINT_PLUGIN=true
   ```

3. **빌드 설정**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **배포**
   - "Deploy" 클릭
   - 빌드 및 배포 진행 상황 모니터링

## 3. 배포 후 설정

### 백엔드 (Railway)
1. **관리자 계정 생성**
   ```bash
   railway run python manage.py createsuperuser
   ```

2. **정적 파일 확인**
   - `/static/` 경로로 정적 파일 접근 가능한지 확인

### 프론트엔드 (Vercel)
1. **환경 변수 업데이트**
   - Railway 배포 후 생성된 URL로 API URL 환경 변수 업데이트
   - Vercel에서 재배포 트리거

2. **CORS 확인**
   - Railway 환경 변수에 Vercel URL이 CORS_ALLOWED_ORIGINS에 포함되어 있는지 확인

## 4. 문제 해결

### Railway 배포 실패 시
- 로그 확인: Railway 대시보드 → Deployments → View Logs
- 일반적인 문제:
  - requirements.txt 누락 패키지
  - 환경 변수 설정 오류
  - 마이그레이션 실패

### Vercel 배포 실패 시
- 빌드 로그 확인
- 일반적인 문제:
  - 환경 변수 누락
  - 빌드 명령어 오류
  - 타입스크립트 에러

### CORS 에러
- Railway의 CORS_ALLOWED_ORIGINS에 Vercel URL 추가
- 프로토콜(https://) 포함 여부 확인

## 5. 모니터링

### Railway
- 대시보드에서 메트릭 확인 (CPU, Memory, Network)
- 로그 스트리밍으로 실시간 모니터링

### Vercel
- Analytics 대시보드 활용
- Web Vitals 모니터링
- 함수 사용량 확인

## 6. 업데이트 배포

### 자동 배포
- GitHub main 브랜치에 푸시하면 자동으로 재배포

### 수동 배포
- Railway: "Redeploy" 버튼 클릭
- Vercel: "Redeploy" 버튼 클릭

## 7. 백업 및 복구

### 데이터베이스 백업 (Railway)
```bash
railway run python manage.py dumpdata > backup.json
```

### 복구
```bash
railway run python manage.py loaddata backup.json
```