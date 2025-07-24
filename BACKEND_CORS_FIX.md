# 🔧 백엔드 데이터 로딩 문제 해결 가이드

## 문제 상황
- 프로젝트 관리, 피드백 페이지에서 데이터가 불러와지지 않음
- 랜딩 페이지로 리다이렉트됨
- CORS 또는 인증 관련 문제로 추정

## 해결 방법

### 1. Railway 백엔드 CORS 설정 확인

Railway 대시보드에서 다음 환경변수를 확인하세요:

```
CORS_ALLOWED_ORIGINS=["http://localhost:3000", "https://vlanet.net", "https://www.vlanet.net", "https://videoplanet.vercel.app", "https://videoplanet-*.vercel.app", "https://videoplanetready.vercel.app"]
```

### 2. 프론트엔드 API 설정 확인

`vridge_front/src/config/axios.js`에서:
- API URL이 올바르게 설정되었는지 확인
- 인증 토큰이 올바르게 전송되는지 확인

### 3. 디버깅 단계

#### A. 브라우저 개발자 도구에서 확인
1. Network 탭 열기
2. API 요청 확인
3. 다음 사항 체크:
   - Status Code (401, 403, 500 등)
   - Response Headers (CORS 관련)
   - Request Headers (Authorization 토큰)

#### B. Console 에러 확인
- CORS 에러 메시지
- 401 Unauthorized 에러
- Network 에러

### 4. 일반적인 해결책

#### CORS 에러의 경우:
```python
# Railway settings.py에서
CORS_ALLOWED_ORIGINS = [
    "https://vlanet.net",
    "https://www.vlanet.net",
    "https://videoplanet.vercel.app",
    "https://videoplanet-seven.vercel.app",  # 스테이징
]
```

#### 인증 에러의 경우:
1. 로그인 상태 확인
2. 토큰 만료 확인
3. 쿠키 설정 확인

### 5. 테스트 방법

```bash
# 로컬에서 테스트
cd vridge_front
npm run dev

# API 직접 테스트
curl -H "Authorization: Bearer YOUR_TOKEN" https://videoplanet.up.railway.app/api/projects/
```

### 6. Railway 로그 확인

Railway 대시보드에서:
1. Deployments → View Logs
2. 에러 메시지 확인
3. 특히 CORS, 인증 관련 로그 확인

## 즉시 적용 가능한 해결책

### Vercel 환경변수 설정
Vercel 프로젝트 설정에서:
```
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
```

### Railway 환경변수 업데이트
```
CORS_ALLOWED_ORIGINS=["https://vlanet.net", "https://www.vlanet.net", "https://*.vercel.app"]
```

---
**중요**: 변경 후 Railway와 Vercel 모두 재배포가 필요합니다!