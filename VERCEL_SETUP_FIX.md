# 🔧 Vercel 배포 경로 문제 해결

## 문제
GitHub Actions가 잘못된 경로 `vridge_front/vridge_front/package.json`을 찾고 있었습니다.
실제 경로는 `vridge_front/package.json`입니다.

## 해결책

### 1. 즉시 해결 방법 (권장)
Vercel 웹 대시보드에서 직접 설정:

1. https://vercel.com 로그인
2. 프로젝트 설정 → General
3. **Root Directory**: `vridge_front` (중복 경로 없이!)
4. **Build & Development Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install --legacy-peer-deps`

### 2. GitHub Actions 수정 완료
새로운 워크플로우 파일 생성:
- `deploy-simple.yml`: 가장 단순한 배포 설정
- `vercel-production.yml`: Vercel CLI 직접 사용

기존 문제 워크플로우 비활성화:
- `vercel-deploy.yml` → `vercel-deploy.yml.disabled`

### 3. 환경 변수 확인
Vercel 대시보드에서 설정:
```
NEXT_PUBLIC_API_URL = https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION = 1.0.0
```

## 프로젝트 구조 확인
```
Vlanet-v1.0/
├── vridge_front/          # ✅ Next.js 프로젝트 (여기가 Root)
│   ├── package.json       # ✅ 실제 위치
│   ├── next.config.js
│   ├── src/
│   └── public/
├── vridge_back/           # Django 백엔드
└── .github/workflows/     # GitHub Actions
```

## 다음 단계
1. Git 푸시하여 새 워크플로우 적용
2. Vercel 대시보드에서 Root Directory 확인
3. 재배포 실행

---
**중요**: Root Directory는 `vridge_front`입니다. 중복 경로 없이!