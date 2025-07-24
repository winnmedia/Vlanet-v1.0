# Vercel 배포 통합 가이드

## 현재 상황
- **videoplanetready**: 테스트/스테이징 환경
- **videoplanet**: 프로덕션 환경
- 현재 3개가 동시에 배포되며 1개는 실패하는 문제 발생

## 해결 방법

### 1. Vercel 대시보드에서 확인
1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 목록에서 중복된 프로젝트 확인
3. 다음 프로젝트만 유지:
   - `videoplanet` (프로덕션)
   - `videoplanetready` (스테이징) - 선택사항

### 2. 중복 프로젝트 삭제
1. 불필요한 프로젝트 클릭
2. Settings → General
3. 페이지 하단의 "Delete Project" 클릭

### 3. GitHub Integration 정리
1. 남은 프로젝트의 Settings → Git
2. Connected Git Repository 확인
3. 올바른 브랜치(`main`)가 연결되어 있는지 확인

### 4. 배포 브랜치 설정
```
프로덕션 (videoplanet):
- Branch: main
- Domain: vlanet.net

스테이징 (videoplanetready):
- Branch: develop 또는 staging
- Domain: videoplanetready.vercel.app
```

### 5. Environment Variables 확인
각 프로젝트에서 다음 환경변수가 설정되어 있는지 확인:
- `NEXT_PUBLIC_API_URL`: https://videoplanet.up.railway.app
- `NEXT_PUBLIC_VERSION`: 1.0.0

### 6. 배포 최적화
vercel.json 파일 수정:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["icn1"],
  "functions": {
    "pages/api/*.js": {
      "maxDuration": 10
    }
  }
}
```

### 7. 단일 배포 보장
.github/workflows/vercel-deploy.yml 수정:
```yaml
name: Vercel Production Deployment
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    # 동시 실행 방지
    concurrency:
      group: vercel-deploy
      cancel-in-progress: true
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./vridge_front
```

## 권장 배포 프로세스

### 1단계: 로컬 테스트
```bash
cd vridge_front
npm run build
npm start
```

### 2단계: 스테이징 배포 (선택사항)
```bash
git checkout -b staging
git push origin staging
# videoplanetready에 자동 배포
```

### 3단계: 프로덕션 배포
```bash
git checkout main
git merge staging  # 또는 직접 main에 커밋
git push origin main
# videoplanet에 자동 배포
```

## 문제 해결

### 배포가 여전히 중복되는 경우
1. Vercel 대시보드에서 Integrations 확인
2. GitHub Integration이 여러 개 있다면 하나만 남기고 삭제
3. 프로젝트별 Git 연결 재확인

### 배포 실패 시
1. Vercel 대시보드에서 빌드 로그 확인
2. 주요 확인사항:
   - Node.js 버전 (18.x 권장)
   - 환경변수 설정
   - 빌드 명령어 (`npm run build`)
   - Root Directory 설정 (`vridge_front`)

## 최종 목표
- main 브랜치 푸시 시 videoplanet 하나만 배포
- 선택적으로 staging 브랜치로 videoplanetready 배포
- 중복 배포 및 실패 제거