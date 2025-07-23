# Vercel 웹 대시보드 배포 가이드

## ✅ GitHub 푸시 완료!
- 커밋 해시: `b9d130f`
- 메시지: "feat: Next.js 마이그레이션 완료 - vridge_front를 Next.js로 전환"

## 🚀 Vercel 웹 대시보드에서 배포하기

### 1. Vercel 접속
1. https://vercel.com 로그인
2. 우측 상단 "Add New..." → "Project" 클릭

### 2. GitHub 저장소 연결
1. "Import Git Repository" 섹션에서
2. `winnmedia/Vlanet-v1.0` 저장소 찾기
3. "Import" 버튼 클릭

### 3. 프로젝트 설정 (중요!)
Configure Project 화면에서:

#### 📁 Root Directory 설정
- **Root Directory**: `vridge_front` 입력 (매우 중요!)
- Edit 버튼 클릭 후 `vridge_front` 입력

#### 🔧 Build and Output Settings
- **Framework Preset**: Next.js (자동 감지됨)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install --legacy-peer-deps`

#### 🔐 Environment Variables
다음 환경 변수 추가:
```
Name: NEXT_PUBLIC_API_URL
Value: https://videoplanet.up.railway.app

Name: NEXT_PUBLIC_VERSION  
Value: 1.0.0
```

### 4. 배포 시작
- 모든 설정 확인 후 "Deploy" 버튼 클릭
- 배포 진행 상황 모니터링 (약 2-5분 소요)

## 📋 배포 전 체크리스트
- [x] GitHub 푸시 완료
- [ ] Root Directory를 `vridge_front`로 설정했나요?
- [ ] Install Command를 `npm install --legacy-peer-deps`로 설정했나요?
- [ ] 환경 변수를 모두 추가했나요?

## 🔍 배포 상태 확인
1. 배포 진행 중 로그 확인
2. 빌드 에러 발생 시:
   - Root Directory 설정 재확인
   - 환경 변수 설정 확인
   - Install Command 확인

## 💡 예상 배포 결과
- 도메인: `[프로젝트명].vercel.app`
- 빌드 시간: 약 1-2분
- 상태: ✅ Ready

## 🎯 배포 후 테스트
1. 배포된 URL 접속
2. 홈페이지 렌더링 확인
3. 로그인 페이지 접근 테스트
4. API 연결 확인 (개발자 도구 Network 탭)

---
**준비 완료!** Vercel 대시보드에서 위 가이드를 따라 배포를 진행하세요. 🎉