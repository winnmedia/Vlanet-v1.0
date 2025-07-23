# Vercel 다이렉트 임포트 가이드

## 🚀 원클릭 배포

### 방법 1: Vercel Import URL 사용
아래 링크를 클릭하여 바로 배포를 시작할 수 있습니다:

**[Vercel로 배포하기](https://vercel.com/new/clone?repository-url=https://github.com/winnmedia/Vlanet-v1.0&root-directory=vridge_front&install-command=npm%20install%20--legacy-peer-deps&env=NEXT_PUBLIC_API_URL,NEXT_PUBLIC_VERSION)**

### 방법 2: 수동 Import
1. https://vercel.com/new 접속
2. GitHub 저장소 URL 입력:
   ```
   https://github.com/winnmedia/Vlanet-v1.0
   ```

## ⚙️ 필수 설정

### 1. Root Directory 설정
- **Root Directory**: `vridge_front` (매우 중요!)

### 2. 환경 변수 설정
```
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION=1.0.0
```

### 3. 빌드 설정
- **Install Command**: `npm install --legacy-peer-deps`
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)

## 📋 배포 전 체크리스트
- [x] GitHub 저장소 푸시 완료
- [x] vercel.json 설정 파일 준비
- [x] .vercelignore 파일 생성
- [x] package.json 버전 업데이트
- [ ] Root Directory 설정 확인
- [ ] 환경 변수 입력 확인

## 🎯 예상 결과
- 배포 시간: 2-3분
- 도메인: `videoplanet-frontend.vercel.app`
- 상태: Production Ready

## 🔍 배포 후 확인사항
1. 메인 페이지 접속
2. 로그인 페이지 동작 확인
3. API 연결 테스트
4. 콘솔 에러 확인

---
**준비 완료!** 위 Import URL을 클릭하여 배포를 시작하세요! 🎉