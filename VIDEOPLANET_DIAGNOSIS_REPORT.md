# VideoPlanet 시스템 진단 보고서

## 1. 이메일 인증 메일 발송 실패 원인 및 해결 방안

### 가장 유력한 원인들:

1. **환경변수 설정 문제**
   - Railway에 `EMAIL_HOST_USER`와 `EMAIL_HOST_PASSWORD`가 올바르게 설정되어 있는지 확인 필요
   - 코드에서 `GOOGLE_ID`, `GOOGLE_APP_PASSWORD`로 fallback하는 부분이 있어 혼란 가능

2. **Gmail 앱 비밀번호 문제**
   - Gmail 2단계 인증이 활성화되어 있어야 함
   - 앱 비밀번호가 공백 없이 정확히 16자리인지 확인
   - 앱 비밀번호 생성 시 "메일" 앱으로 생성했는지 확인

3. **Gmail 계정 보안 설정**
   - Gmail 계정의 "보안 수준이 낮은 앱 차단" 설정 확인
   - 최근 Gmail 정책 변경으로 SMTP 액세스가 제한될 수 있음

### 즉시 시도해볼 해결 방법:

```bash
# 1. Railway CLI로 환경변수 확인
railway variables

# 2. 테스트 스크립트 실행
cd /home/winnmedia/VideoPlanet
python test_email_system.py

# 3. Railway 로그 확인
railway logs -n 100 | grep -i email
```

### 추가 확인 사항:

1. **Railway 환경에서 아웃바운드 SMTP 연결 확인**
   - Railway가 포트 587로의 아웃바운드 연결을 허용하는지 확인
   - 일부 PaaS는 스팸 방지를 위해 SMTP 포트를 차단할 수 있음

2. **이메일 발송량 제한**
   - Gmail SMTP는 일일 발송량 제한이 있음 (약 500-2000개)
   - 단시간에 많은 이메일 발송 시 일시적 차단 가능

3. **대체 이메일 서비스 고려**
   - SendGrid, Mailgun, AWS SES 등 전문 이메일 서비스 사용 권장
   - 더 높은 신뢰성과 전송률 보장

## 2. 프론트엔드-백엔드 데이터 교환 문제

### 잠재적 원인들:

1. **CORS 설정 문제**
   - `withCredentials: true` 사용 시 CORS 설정이 더 엄격함
   - 와일드카드(*) 사용 불가, 정확한 origin 명시 필요

2. **쿠키 설정 문제**
   - Cross-site 쿠키 전송을 위해 `SameSite=None; Secure` 설정 필요
   - Railway HTTPS와 Vercel HTTPS 간 쿠키 공유 문제 가능

3. **JWT 토큰 관리**
   - 토큰이 localStorage와 쿠키 양쪽에 저장되어 동기화 문제 가능
   - 401 에러 시 자동 로그아웃 로직이 너무 공격적일 수 있음

### 권장 개선사항:

1. **환경변수 정리**
   ```javascript
   // 하나의 환경변수만 사용
   REACT_APP_API_URL=https://videoplanet.up.railway.app
   ```

2. **API 에러 처리 개선**
   - 네트워크 에러와 인증 에러 구분
   - 토큰 갱신 로직 추가
   - 재시도 메커니즘 구현

3. **CORS 디버깅**
   ```python
   # middleware 추가로 CORS 요청 로깅
   class CORSDebugMiddleware:
       def __init__(self, get_response):
           self.get_response = get_response
       
       def __call__(self, request):
           origin = request.META.get('HTTP_ORIGIN')
           if origin:
               print(f"CORS Request from: {origin}")
           response = self.get_response(request)
           return response
   ```

## 3. 인증 시스템 개선 제안

### 보안 강화:

1. **Refresh Token 구현**
   - Access Token: 15분
   - Refresh Token: 7일
   - 자동 토큰 갱신 메커니즘

2. **Rate Limiting**
   - 로그인 시도 제한 (5회/분)
   - 이메일 발송 제한 (3회/시간)

3. **이메일 인증 개선**
   - 인증 코드 유효시간 DB 저장
   - 중복 요청 방지
   - 인증 완료 후 코드 즉시 삭제

### 사용자 경험 개선:

1. **로딩 상태 관리**
   - API 호출 중 명확한 로딩 표시
   - 에러 발생 시 구체적인 메시지

2. **세션 관리**
   - 자동 로그아웃 전 경고
   - "기기 기억하기" 옵션

## 4. 추가 보안 설정 권장사항

### Railway 환경변수 추가:

```bash
# 보안 강화
ALLOWED_HOSTS=videoplanet.up.railway.app
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=true
SECURE_HSTS_PRELOAD=true

# 로깅
DJANGO_LOG_LEVEL=INFO
EMAIL_LOG_LEVEL=DEBUG

# 세션 설정
SESSION_COOKIE_AGE=604800  # 7일
SESSION_EXPIRE_AT_BROWSER_CLOSE=false
```

### 모니터링 추가:

1. **Sentry 통합**
   - 에러 추적
   - 성능 모니터링

2. **로그 집계**
   - Railway 로그 → 외부 서비스
   - 이메일 발송 성공/실패 추적

## 5. 즉시 실행 가능한 액션 아이템

1. **이메일 시스템 테스트**
   ```bash
   python test_email_system.py
   ```

2. **CORS 헤더 확인**
   ```bash
   curl -I -X OPTIONS https://videoplanet.up.railway.app/api/users/login \
     -H "Origin: https://vlanet.net" \
     -H "Access-Control-Request-Method: POST"
   ```

3. **환경변수 검증**
   ```bash
   railway variables | grep -E "(EMAIL|CORS|ALLOWED)"
   ```

4. **프로덕션 로그 모니터링**
   ```bash
   railway logs --tail
   ```

이 진단 보고서를 참고하여 문제를 단계적으로 해결하시기 바랍니다.
가장 우선적으로는 이메일 테스트 스크립트를 실행하여 정확한 문제를 파악하는 것을 권장합니다.