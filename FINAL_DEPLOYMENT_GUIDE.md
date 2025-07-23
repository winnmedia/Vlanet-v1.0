# 📋 최종 배포 가이드 - VideoPlanet

## 🚀 3가지 배포 방법

### 방법 1: Vercel Import URL (가장 간단!)
1. **아래 링크 클릭**:
   [🚀 Vercel로 바로 배포하기](https://vercel.com/new/clone?repository-url=https://github.com/winnmedia/Vlanet-v1.0&root-directory=vridge_front&install-command=npm%20install%20--legacy-peer-deps)

2. **환경 변수 입력**:
   ```
   NEXT_PUBLIC_API_URL = https://videoplanet.up.railway.app
   NEXT_PUBLIC_VERSION = 1.0.0
   ```

3. **"Deploy" 클릭**

### 방법 2: Vercel 대시보드
1. https://vercel.com/new 접속
2. GitHub 저장소 Import: `winnmedia/Vlanet-v1.0`
3. **Root Directory**: `vridge_front` 설정
4. 환경 변수 추가
5. Deploy 클릭

### 방법 3: GitHub Actions (자동 배포)
1. Vercel 토큰 생성: https://vercel.com/account/tokens
2. GitHub Secrets 추가:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. 이후 main 브랜치 푸시 시 자동 배포

## ✅ 현재 상태
- GitHub 저장소: 최신 커밋 `cd3831c`
- 프로젝트 구조: Next.js 15.4.2
- Root Directory: `vridge_front`
- 빌드 테스트: 성공 ✅

## 📌 중요 설정
- **Root Directory**: `vridge_front` (필수!)
- **Install Command**: `npm install --legacy-peer-deps`
- **환경 변수**: 2개 필수 설정

## 🎯 배포 후 확인
1. 배포 URL 접속
2. 홈페이지 렌더링 확인
3. API 연결 테스트
4. 로그인 기능 확인

---
**준비 완료!** 위 3가지 방법 중 하나를 선택하여 배포하세요. 🎉

가장 빠른 방법은 **방법 1**의 Import URL을 클릭하는 것입니다!