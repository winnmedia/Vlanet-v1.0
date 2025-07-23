# 배포 문제 해결 가이드

## 🔧 GitHub Actions 빌드 오류 해결

### 문제: "Build directory not created"
Next.js 프로젝트는 빌드 출력이 `.next` 디렉토리에 생성되는데, 워크플로우가 `build` 디렉토리를 찾고 있었습니다.

### ✅ 해결책 적용 완료:
1. **워크플로우 수정**: `.next` 디렉토리 확인하도록 변경
2. **디버깅 추가**: 빌드 전후 디렉토리 구조 출력
3. **환경 변수 추가**: 빌드 시 필요한 환경 변수 설정

## 🚀 대체 배포 방법

### 1. Vercel 웹 대시보드 (권장)
가장 안정적이고 간단한 방법입니다:

1. https://vercel.com/new 접속
2. GitHub 저장소 Import
3. **Root Directory**: `vridge_front`
4. **환경 변수 설정**:
   ```
   NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
   NEXT_PUBLIC_VERSION=1.0.0
   ```
5. Deploy 클릭

### 2. Vercel CLI 로컬 배포
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. vridge_front 디렉토리로 이동
cd vridge_front

# 3. Vercel 로그인
vercel login

# 4. 배포
vercel --prod
```

### 3. Import URL 사용
[👉 여기를 클릭하여 바로 배포](https://vercel.com/new/clone?repository-url=https://github.com/winnmedia/Vlanet-v1.0&root-directory=vridge_front&install-command=npm%20install%20--legacy-peer-deps&env=NEXT_PUBLIC_API_URL,NEXT_PUBLIC_VERSION&envDescription=Required%20environment%20variables&envLink=https://github.com/winnmedia/Vlanet-v1.0)

## 📋 체크리스트

### GitHub Actions 사용 시:
- [ ] GitHub Secrets 설정 완료 (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] Vercel 프로젝트 먼저 생성
- [ ] 워크플로우 파일 최신 버전 사용

### 모든 배포 방법 공통:
- [ ] Root Directory: `vridge_front`
- [ ] Install Command: `npm install --legacy-peer-deps`
- [ ] 환경 변수 2개 설정
- [ ] VideoPlanning 페이지는 임시 버전 사용 중

## 🎯 성공 지표
- 빌드 시간: 1-3분
- 배포 상태: Ready
- 접속 가능한 URL 생성
- API 연결 정상 작동

---
**권장사항**: GitHub Actions보다는 Vercel 웹 대시보드를 통한 직접 배포가 더 간단하고 안정적입니다!