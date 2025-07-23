# 🔧 백엔드 CORS 오류 해결 가이드

## 🚨 문제
```
Access to XMLHttpRequest at 'https://videoplanet.up.railway.app/users/login/' 
from origin 'https://videoplanet-bc6or7dvz-vlanets-projects.vercel.app' 
has been blocked by CORS policy
```

## ✅ 해결 방법

### 1. Railway 환경변수 업데이트

1. **[Railway Dashboard](https://railway.app/dashboard)** 접속
2. **videoplanet** 프로젝트 선택
3. **Variables** 탭 클릭
4. `CORS_ALLOWED_ORIGINS` 찾기
5. 다음 값으로 업데이트:

```
https://vlanet.net,https://www.vlanet.net,https://videoplanet-bc6or7dvz-vlanets-projects.vercel.app,https://*.vercel.app,http://localhost:3000
```

### 2. Railway 재배포
환경변수 수정 후:
1. **Deploy** 탭으로 이동
2. **Redeploy** 클릭
3. 또는 자동으로 재배포됨 (1-2분 대기)

### 3. 백엔드 상태 확인
재배포 후:
- https://videoplanet.up.railway.app/api/health/
- 정상 응답 확인

## 🎯 영구 해결책

### Vercel 커스텀 도메인 설정
1. Vercel 대시보드 → Settings → Domains
2. `api.vlanet.net` 또는 원하는 도메인 추가
3. DNS 설정 후 CORS에 고정 도메인만 사용

### 현재 허용된 도메인:
- https://vlanet.net ✅
- https://www.vlanet.net ✅
- https://videoplanet-seven.vercel.app ✅
- https://videoplanet-bc6or7dvz-vlanets-projects.vercel.app ❌ (추가 필요)

## 📝 테스트
1. Railway 환경변수 업데이트
2. 1-2분 대기 (재배포)
3. 로그인 페이지에서 테스트
4. 성공!

---
**즉시 해결**: Railway Variables에서 CORS_ALLOWED_ORIGINS 업데이트!