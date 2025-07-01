# 🚨 긴급: Vercel 환경변수 수정 필요

## 문제
프론트엔드가 잘못된 백엔드 URL을 사용하고 있습니다:
- ❌ 현재: `https://vridge-back-production.up.railway.app`
- ✅ 올바른 URL: `https://videoplanet.up.railway.app`

## 즉시 해결 방법 (Vercel 대시보드에서)

1. **Vercel 대시보드 접속**
   - https://vercel.com 로그인
   - VideoPlanet 프로젝트 선택

2. **Settings → Environment Variables**로 이동

3. **다음 환경변수들을 모두 수정**:
   ```
   REACT_APP_API_BASE_URL = https://videoplanet.up.railway.app
   REACT_APP_BACKEND_API_URL = https://videoplanet.up.railway.app
   REACT_APP_BACKEND_URI = https://videoplanet.up.railway.app
   REACT_APP_SOCKET_URI = wss://videoplanet.up.railway.app
   ```

4. **저장 후 재배포**
   - 환경변수 저장
   - Deployments 탭으로 이동
   - 가장 최근 배포의 ⋮ 메뉴 클릭
   - "Redeploy" 선택
   - "Use existing Build Cache" 체크 해제
   - "Redeploy" 버튼 클릭

## 대안: 코드에서 직접 수정 (임시 방법)

프론트엔드 코드에서 URL을 하드코딩할 수 있지만, 이는 권장하지 않습니다.

## 확인 방법

재배포 완료 후:
1. https://vlanet.net 접속
2. 개발자 도구 열기 (F12)
3. Network 탭 확인
4. API 요청이 `videoplanet.up.railway.app`로 가는지 확인

## 중요!

Vercel의 환경변수는 `vercel.json` 파일의 설정보다 우선순위가 높습니다.
따라서 반드시 Vercel 대시보드에서 직접 수정해야 합니다.