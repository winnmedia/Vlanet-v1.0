# CORS 설정 가이드

## Railway 환경 변수 설정

Railway 대시보드에서 백엔드 서비스(`vridge-back`)의 Variables 탭에 다음 환경 변수를 추가하세요:

```env
CORS_ALLOWED_ORIGINS=https://vridge-front-production.up.railway.app,https://vlanet.net,https://www.vlanet.net,http://localhost:3000
```

## 현재 CORS 설정

프로덕션 환경에서는 다음 도메인들이 허용됩니다:
- https://vridge-front-production.up.railway.app (Railway 프론트엔드)
- https://vlanet.net (커스텀 도메인)
- https://www.vlanet.net (www 서브도메인)
- http://localhost:3000 (로컬 개발용)

## CORS 설정 상세

```python
# 허용된 HTTP 메서드
CORS_ALLOWED_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

# 허용된 헤더
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# 쿠키/인증 정보 포함 허용
CORS_ALLOW_CREDENTIALS = True
```

## 문제 해결

### CORS 에러가 계속 발생하는 경우

1. **브라우저 콘솔 확인**
   - 정확한 오리진 URL 확인
   - 에러 메시지에서 차단된 오리진 확인

2. **Railway 로그 확인**
   ```bash
   railway logs -s vridge-back
   ```

3. **환경 변수 확인**
   - Railway Variables 탭에서 `CORS_ALLOWED_ORIGINS` 확인
   - 쉼표로 구분된 URL 목록인지 확인
   - 공백이 없는지 확인

4. **추가 도메인 허용이 필요한 경우**
   - Railway Variables에서 `CORS_ALLOWED_ORIGINS`에 도메인 추가
   - 예: `https://example.com` 추가 시
   ```env
   CORS_ALLOWED_ORIGINS=https://vridge-front-production.up.railway.app,https://vlanet.net,https://www.vlanet.net,https://example.com
   ```

## 보안 주의사항

- 프로덕션에서는 필요한 도메인만 허용하세요
- `CORS_ALLOW_ALL_ORIGINS = True`는 개발 환경에서만 사용하세요
- 민감한 데이터를 다루는 경우 CORS 설정을 엄격하게 관리하세요