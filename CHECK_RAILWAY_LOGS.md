# Railway 로그 확인 가이드

## 즉시 확인해야 할 사항

### 1. Railway 로그 확인
Railway 대시보드에서 Logs 탭을 열고 다음을 찾아보세요:

#### A. SendGrid 설정 관련 로그
- `SendGrid API Key configured: SG.xxxxx...` (성공)
- `ERROR: SendGrid API key not configured!` (실패)

#### B. 이메일 발송 시도 로그
- `[Email] Sending auth email to:`
- `[Email] ERROR: Email credentials not configured`
- SendGrid 관련 오류 메시지

### 2. 가능한 문제와 해결책

#### 문제 1: "Email credentials not configured"
**원인**: 환경변수가 로드되지 않음
**확인**:
- `DJANGO_SETTINGS_MODULE`이 `config.settings.sendgrid_config`로 설정되었는지
- `SENDGRID_API_KEY`가 올바르게 설정되었는지

#### 문제 2: "The from address does not match a verified Sender Identity"
**원인**: SendGrid에서 발신자 인증이 안됨
**해결**:
1. https://app.sendgrid.com/settings/sender_auth
2. Single Sender Verification에서 vridgeofficial@gmail.com 추가
3. 인증 이메일 확인

#### 문제 3: "Unauthorized" 또는 "Forbidden"
**원인**: API Key 문제
**확인**:
- API Key가 'SG.'로 시작하는지
- Full Access 권한이 있는지

### 3. Railway CLI로 로그 확인 (옵션)
```bash
# 최근 100줄 로그
railway logs --tail 100

# 실시간 로그
railway logs --tail

# SendGrid 관련 로그만
railway logs --tail | grep -i sendgrid

# 이메일 관련 로그만
railway logs --tail | grep -i email
```

### 4. 환경변수 다시 확인
Railway Variables 탭에서:
```
SENDGRID_API_KEY=SG.xxxxxxxxxx (전체 키)
DJANGO_SETTINGS_MODULE=config.settings.sendgrid_config
```

### 5. 테스트 명령어
```bash
# 로그를 보면서 실행
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "test@example.com"}'
```

## 로그에서 찾은 내용을 공유해주세요!

특히 다음 내용이 중요합니다:
1. SendGrid API Key 로드 여부
2. 구체적인 에러 메시지
3. DJANGO_SETTINGS_MODULE 값