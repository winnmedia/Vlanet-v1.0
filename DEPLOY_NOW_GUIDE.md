# 🚀 실제 배포 실행 가이드

## Step 1: Vercel CLI Direct Deploy 실행

### 실행 방법:
1. **[GitHub Actions 페이지](https://github.com/winnmedia/Vlanet-v1.0/actions)** 접속
2. 왼쪽에서 **"Vercel CLI Direct Deploy"** 클릭
3. **"Run workflow"** 버튼 클릭
4. Branch: `main` 확인
5. **"Run workflow"** 녹색 버튼 클릭

### 직접 링크:
```
https://github.com/winnmedia/Vlanet-v1.0/actions/workflows/vercel-cli-direct.yml
```

## Step 2: 배포 진행 상황 확인

### 예상 소요 시간:
- 첫 배포: 2-3분
- 재배포: 1-2분

### 성공 시 로그:
```
✅ Deploying to production
✅ Deployment URL: https://[프로젝트명].vercel.app
✅ Production: https://vlanet.net (도메인 연결된 경우)
```

## Step 3: 배포 후 확인

### 1. Production URL 확인
- 로그에서 배포 URL 복사
- 브라우저에서 접속

### 2. 주요 기능 테스트
- [ ] 홈페이지 렌더링
- [ ] 로그인 페이지 접근
- [ ] API 연결 확인

### 3. Vercel 대시보드 확인
- https://vercel.com/dashboard
- 프로젝트 선택
- Deployments 탭에서 상태 확인

## 🚨 문제 발생 시

### "Deployment failed"
1. 로그에서 구체적 오류 확인
2. Vercel 대시보드에서 Build Logs 확인

### "404 Not Found"
1. Root Directory가 `vridge_front`인지 확인
2. Vercel 프로젝트 설정 확인

### 대체 방법
만약 CLI 배포가 실패하면:
1. "Vercel Deploy with Node Setup" 실행
2. 또는 Vercel 웹 대시보드에서 수동 배포

---
**지금 바로 실행**: [Vercel CLI Direct Deploy](https://github.com/winnmedia/Vlanet-v1.0/actions/workflows/vercel-cli-direct.yml) 🚀