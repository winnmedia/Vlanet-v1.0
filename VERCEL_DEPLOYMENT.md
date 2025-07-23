# Vercel 배포 가이드 - VideoPlanet Next.js

## 🚀 배포 준비 완료!

### 📁 프로젝트 구조
- **메인 프론트엔드**: `/vridge_front` (Next.js 15.4.2)
- **백업 폴더**: `/vridge_front_backup_20250723` (기존 React 프로젝트)

### ✅ 완료된 작업
1. vridge-front-next를 vridge_front로 이름 변경
2. 기존 React 프로젝트를 백업 폴더로 이동
3. Git 커밋 완료: "feat: Next.js 마이그레이션 완료"

## 📋 Vercel 배포 단계

### 1. GitHub 푸시
```bash
git push origin main
```

### 2. Vercel 프로젝트 설정
1. https://vercel.com 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. **Root Directory 설정**: `vridge_front` 입력
5. Framework Preset: Next.js (자동 감지)

### 3. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수 추가:
```
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION=1.0.0
```

### 4. 빌드 설정 확인
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install --legacy-peer-deps`

### 5. 배포
"Deploy" 버튼 클릭

## ⚠️ 주의사항

### 알려진 이슈
1. **VideoPlanning 페이지**: 임시 간단 버전 사용 중
   - 파일: `/vridge_front/src/page/Cms/VideoPlanning-simple.jsx`
   - 원본 파일에 빌드 오류가 있어 추후 수정 필요

2. **SCSS 경고**: Sass @import deprecation 경고 (기능 영향 없음)

### 빌드 성공 정보
- 빌드 시간: 약 7초
- 총 페이지: 25개
- First Load JS: 226 kB

## 🔍 배포 후 확인사항
1. 홈페이지 접속 확인
2. 로그인/회원가입 기능 테스트
3. API 연결 확인 (백엔드와 통신)
4. 주요 페이지 접근 테스트

## 📞 문제 발생 시
1. Vercel 빌드 로그 확인
2. 환경 변수 설정 재확인
3. Root Directory가 `vridge_front`로 설정되었는지 확인

---
**준비 완료!** GitHub에 푸시하고 Vercel에서 배포를 진행하세요. 🎉