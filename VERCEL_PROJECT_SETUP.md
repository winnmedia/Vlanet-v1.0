# Vercel 프로젝트 설정 안내

## 현재 구조
- 프로젝트 루트: `/home/winnmedia/VideoPlanet/vridge_front`
- Next.js 프로젝트가 `vridge_front` 디렉토리에 위치
- Vercel은 `vridge_front`를 직접 프로젝트 루트로 인식

## Vercel 대시보드 설정
1. Vercel 대시보드 (https://vercel.com) 로그인
2. 프로젝트 목록에서 중복된 프로젝트 확인
3. 다음 중 하나를 선택:
   - Option A: 기존 프로젝트 유지하고 중복 프로젝트 삭제
   - Option B: 모든 프로젝트 삭제 후 새로 연결

## 올바른 프로젝트 설정
### General 탭
- **Framework Preset**: Next.js
- **Root Directory**: `./` (vridge_front를 루트로 설정)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install --legacy-peer-deps`

### Environment Variables
- `NEXT_PUBLIC_API_URL`: `https://videoplanet.up.railway.app`

### Git 탭
- **Production Branch**: `main`
- **Preview Branches**: 활성화 (선택사항)

## 중복 프로젝트 제거 방법
1. Vercel 대시보드에서 프로젝트 선택
2. Settings → General
3. 페이지 하단 "Delete Project" 클릭
4. 프로젝트 이름 입력하여 확인

## 재배포 방법
```bash
git add .
git commit -m "fix: Vercel 중복 배포 문제 해결"
git push origin main
```

## 주의사항
- 루트 디렉토리(`/home/winnmedia/VideoPlanet`)에는 vercel.json을 두지 않음
- 모든 Vercel 설정은 `vridge_front/vercel.json`에서 관리
- 하나의 GitHub 저장소당 하나의 Vercel 프로젝트만 연결