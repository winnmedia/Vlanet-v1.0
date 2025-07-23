# 🚀 즉시 Vercel 배포하기

## 방법 1: Direct Import (가장 빠름)
아래 링크를 클릭하여 바로 배포를 시작하세요:

[**🔗 클릭하여 Vercel로 배포하기**](https://vercel.com/new/clone?repository-url=https://github.com/winnmedia/Vlanet-v1.0&root-directory=vridge_front&install-command=npm%20install%20--legacy-peer-deps&env=NEXT_PUBLIC_API_URL,NEXT_PUBLIC_VERSION&envDescription=Required%20environment%20variables&envLink=https://github.com/winnmedia/Vlanet-v1.0)

### 환경 변수 입력:
```
NEXT_PUBLIC_API_URL = https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION = 1.0.0
```

## 방법 2: Vercel 대시보드
1. https://vercel.com/new 접속
2. "Import Git Repository" 클릭
3. GitHub 저장소 선택: `winnmedia/Vlanet-v1.0`
4. 설정:
   - **Root Directory**: `vridge_front`
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install --legacy-peer-deps`
5. 환경 변수 추가 (위와 동일)
6. "Deploy" 클릭

## 빌드 상태
✅ 로컬 빌드 테스트: **성공**
✅ 25개 페이지 생성 완료
✅ 빌드 시간: 21초
⚠️ VideoPlanning 페이지는 임시 버전 사용 중

## 예상 배포 시간
- 첫 배포: 2-3분
- 이후 업데이트: 1-2분

---
**준비 완료!** 위 링크를 클릭하여 즉시 배포를 시작하세요.