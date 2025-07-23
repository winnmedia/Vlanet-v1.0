# VideoPlanet Next.js 배포 가이드

## 📋 배포 전 체크리스트

### 1. 코드 준비
- [x] `npm run build` 성공적으로 완료
- [x] 환경 변수 설정 완료 (.env.production)
- [x] .gitignore 파일 확인
- [ ] 모든 변경사항 커밋

### 2. 환경 변수
```
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION=1.0.0
```

## 🚀 Vercel 배포 방법

### 방법 1: GitHub 연동 (권장)

1. **GitHub 저장소에 푸시**
   ```bash
   git add .
   git commit -m "feat: Next.js migration complete"
   git push origin main
   ```

2. **Vercel 대시보드에서 프로젝트 연결**
   - https://vercel.com 로그인
   - "New Project" 클릭
   - GitHub 저장소 선택
   - Framework Preset: Next.js 자동 감지됨

3. **환경 변수 설정**
   - Project Settings > Environment Variables
   - `NEXT_PUBLIC_API_URL` 추가
   - `NEXT_PUBLIC_VERSION` 추가

4. **배포 설정**
   - Build Command: `npm run build`
   - Output Directory: `.next` (기본값)
   - Install Command: `npm install --legacy-peer-deps`

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **로그인**
   ```bash
   vercel login
   ```

3. **배포**
   ```bash
   vercel --prod
   ```

## 📝 중요 사항

### 현재 상태
- ✅ 모든 페이지 빌드 성공 (VideoPlanning 제외)
- ✅ 환경 변수 설정 완료
- ✅ vercel.json 설정 완료
- ⚠️ VideoPlanning 페이지는 임시 버전 사용 중

### 알려진 이슈
1. **VideoPlanning.jsx 문법 오류**
   - 현재 간단한 임시 버전 사용
   - 추후 원본 파일 디버깅 필요

2. **SCSS import 경고**
   - Sass @import 규칙 deprecation 경고
   - 기능에는 영향 없음
   - 추후 @use로 마이그레이션 권장

### 배포 후 확인사항
1. 모든 페이지 접근 가능한지 확인
2. API 연결 정상 작동 확인
3. 로그인/회원가입 기능 테스트
4. 프로젝트 생성 기능 테스트

## 🔧 문제 해결

### 빌드 실패 시
```bash
# 캐시 삭제
rm -rf .next node_modules/.cache

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# 재빌드
npm run build
```

### 환경 변수 문제
- Vercel 대시보드에서 환경 변수가 제대로 설정되었는지 확인
- 배포 후 Environment Variables 탭에서 재확인

## 📊 성능 최적화

현재 빌드 결과:
- First Load JS: ~226 kB (양호)
- 가장 큰 페이지: /feedback/[id] (403 kB)
- 정적 생성 페이지: 404, index-simple

추후 최적화 가능 항목:
- 동적 import 활용
- 이미지 최적화
- 번들 사이즈 분석 및 최적화