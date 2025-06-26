# Vlanet 배포 가이드

## 🚀 자동 배포 설정

### 1. Vercel 설정 (프론트엔드)

1. **Vercel 계정 생성 및 프로젝트 연결**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **프로젝트 초기 설정**
   ```bash
   cd vridge_front
   vercel
   ```
   - Framework: Create React App 선택
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **환경 변수 설정 (Vercel Dashboard)**
   ```
   REACT_APP_API_BASE_URL=https://videoplanet.up.railway.app/api
   REACT_APP_BACKEND_API_URL=https://videoplanet.up.railway.app/api
   REACT_APP_BACKEND_URI=https://videoplanet.up.railway.app
   REACT_APP_SOCKET_URI=wss://videoplanet.up.railway.app
   ```

4. **도메인 연결**
   - Vercel Dashboard → Settings → Domains
   - Add Domain: `vlanet.net`
   - DNS 설정:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

### 2. Railway 설정 (백엔드)

이미 설정되어 있음 - GitHub push 시 자동 배포

### 3. GitHub Actions 설정

1. **Secrets 추가** (GitHub Repository Settings → Secrets)
   - `VERCEL_TOKEN`: Vercel 토큰
   - `VERCEL_ORG_ID`: Vercel Organization ID
   - `VERCEL_PROJECT_ID`: Vercel Project ID

2. **토큰 얻는 방법**
   ```bash
   # Vercel 토큰
   vercel token
   
   # Organization ID & Project ID
   cat .vercel/project.json
   ```

## 📦 수동 배포 방법

### 전체 배포 (백엔드 + 프론트엔드)
```bash
./deploy.sh
```

### 백엔드만 배포
```bash
cd vridge_back
git add -A
git commit -m "Update backend"
git push origin main
```

### 프론트엔드만 배포
```bash
cd vridge_front
vercel --prod
```

## 🔄 배포 흐름

1. **개발 완료 후 커밋**
   ```bash
   git add -A
   git commit -m "feat: 새 기능 추가"
   git push origin main
   ```

2. **자동 배포 시작**
   - Railway: 자동으로 백엔드 배포
   - GitHub Actions: 프론트엔드 빌드 및 Vercel 배포

3. **배포 확인**
   - Backend: https://videoplanet.up.railway.app
   - Frontend: https://vlanet.net

## ⚠️ 주의사항

1. **환경 변수 동기화**
   - Railway와 Vercel의 환경 변수가 일치하는지 확인
   - 특히 API URL이 올바른지 확인

2. **CORS 설정**
   - Backend에서 vlanet.net 도메인 허용 확인

3. **빌드 에러 시**
   ```bash
   cd vridge_front
   npm run build  # 로컬에서 빌드 테스트
   ```

4. **캐시 문제**
   - Vercel: Redeploy with clearing cache
   - 브라우저: 강제 새로고침 (Ctrl+F5)

## 📊 모니터링

- **Railway Dashboard**: https://railway.app/project/[project-id]
- **Vercel Dashboard**: https://vercel.com/[username]/[project]
- **GitHub Actions**: Repository → Actions 탭