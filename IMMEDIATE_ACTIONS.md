# VideoPlanet 즉시 실행 사항

## 테스트 결과 요약

### ✅ CORS 설정: 정상
- https://vlanet.net 에서의 요청이 정상적으로 처리됨
- Preflight 요청 정상 응답
- 인증이 필요한 엔드포인트는 401 반환 (정상)

### ❌ 이메일 설정: 문제 발견
- **환경변수가 전혀 설정되지 않음**
- EMAIL_HOST_USER: Not set
- EMAIL_HOST_PASSWORD: Not set
- GOOGLE_ID: Not set  
- GOOGLE_APP_PASSWORD: Not set

## 즉시 해결 방법

### 1. Railway 환경변수 설정 (가장 시급)

Railway CLI 또는 웹 대시보드에서 다음 환경변수를 설정하세요:

```bash
# Railway CLI 사용 시
railway variables set EMAIL_HOST_USER=vridgeofficial@gmail.com
railway variables set EMAIL_HOST_PASSWORD=your-16-digit-app-password

# 또는 Railway 웹 대시보드에서 설정
# https://railway.app 접속 > 프로젝트 선택 > Variables 탭
```

### 2. Gmail 앱 비밀번호 생성

1. https://myaccount.google.com/security 접속
2. 2단계 인증 활성화 확인
3. "앱 비밀번호" 섹션으로 이동
4. 새 앱 비밀번호 생성:
   - 앱 선택: "메일"
   - 기기 선택: "기타" → "VideoPlanet"
5. 생성된 16자리 비밀번호를 복사 (공백 제거)

### 3. Railway 환경변수 확인

```bash
# 설정 후 확인
railway variables

# 재배포 트리거
railway up
```

### 4. 프로덕션 테스트

```bash
# Railway 로그 모니터링
railway logs --tail

# 별도 터미널에서 이메일 발송 테스트
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "test@example.com"}'
```

## 프론트엔드-백엔드 통신은 정상

- CORS 설정 ✅
- API 엔드포인트 응답 ✅
- 인증 로직 작동 ✅

**유일한 문제는 Railway에 이메일 환경변수가 설정되지 않은 것입니다.**

## 대체 방안 (임시)

만약 Gmail SMTP가 계속 문제가 있다면:

1. **SendGrid 무료 플랜 사용** (월 100개 이메일 무료)
   ```python
   # settings.py
   EMAIL_BACKEND = 'sendgrid_backend.SendgridBackend'
   SENDGRID_API_KEY = 'your-sendgrid-api-key'
   ```

2. **Mailgun 무료 플랜 사용**
   ```python
   EMAIL_HOST = 'smtp.mailgun.org'
   EMAIL_PORT = 587
   EMAIL_HOST_USER = 'postmaster@sandbox.mailgun.org'
   EMAIL_HOST_PASSWORD = 'mailgun-password'
   ```

하지만 먼저 Railway 환경변수 설정을 확인하시는 것을 강력히 권장합니다!