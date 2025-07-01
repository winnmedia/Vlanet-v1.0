# 이메일 시스템 최종 문제 해결 가이드

## 현재 상황
- 이메일 발송이 계속 실패 (500 에러)
- Railway 로그: `[Email] ERROR: Email credentials not configured`
- SendGrid 또는 Gmail 설정이 서버에 적용되지 않음

## 즉시 확인 사항

### 1. Railway 환경변수 확인
Railway 대시보드 → Variables 탭에서 다음 중 하나가 설정되어 있는지 확인:

**SendGrid 사용 시:**
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
DJANGO_SETTINGS_MODULE=config.settings.sendgrid_config
```

**Gmail 사용 시:**
```
EMAIL_HOST_USER=vridgeofficial@gmail.com
EMAIL_HOST_PASSWORD=itwrvymmmwaagouh
DJANGO_SETTINGS_MODULE=config.settings.railway_email_fix
```

### 2. 재배포 상태 확인
- Deployments 탭에서 최신 배포 시간 확인
- 환경변수 설정 **이후**에 배포되었는지 확인
- 배포 상태가 "Success"인지 확인

### 3. 수동 재배포 (필수!)
환경변수 변경 후 재배포가 안 되었다면:

**Railway 대시보드:**
1. Deployments 탭
2. 최신 배포의 ⋮ 메뉴
3. **"Redeploy"** 클릭

**Railway CLI:**
```bash
railway up --detach
```

### 4. 재배포 후 로그 확인
```bash
railway logs --tail | grep -i email
```

성공 시 나타나야 할 로그:
- `Email configured with user: vridgeofficial@gmail.com` (Gmail)
- `SendGrid API Key configured: SG.xxxxxx...` (SendGrid)

## 대체 솔루션

### 옵션 1: 콘솔 백엔드 (테스트용)
Railway Variables에 추가:
```
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
이렇게 하면 이메일이 로그에만 출력됩니다.

### 옵션 2: Mailgun 사용
1. https://mailgun.com 가입
2. Railway Variables:
```
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_HOST_USER=postmaster@sandbox.mailgun.org
EMAIL_HOST_PASSWORD=your-password
```

### 옵션 3: AWS SES 사용
1. AWS SES 설정
2. Railway Variables:
```
EMAIL_BACKEND=django_ses.SESBackend
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## 디버깅 체크리스트

- [ ] Railway Variables에 환경변수가 정확히 설정됨
- [ ] 변수명 앞뒤 공백 없음
- [ ] 재배포가 환경변수 설정 이후에 실행됨
- [ ] 배포 상태가 Success
- [ ] Railway 로그에 이메일 설정 확인 메시지가 나타남

## 테스트 명령어

재배포 완료 후:
```bash
# 이메일 발송 테스트
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "test@example.com"}'

# Railway 로그 실시간 확인
railway logs --tail
```

## 문제 지속 시

1. **Railway 지원팀 문의**
   - 환경변수가 제대로 로드되지 않는 문제일 수 있음

2. **코드 수정 고려**
   - 환경변수 이름 변경
   - 하드코딩으로 임시 테스트

3. **다른 배포 플랫폼 고려**
   - Heroku, Render 등

가장 중요한 것은 **Railway 재배포**입니다. 환경변수 설정 후 반드시 재배포가 필요합니다.