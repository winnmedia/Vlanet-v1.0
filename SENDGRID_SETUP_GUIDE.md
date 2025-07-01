# SendGrid 설정 가이드

## SendGrid 설정 단계

### 1. SendGrid 계정 설정 확인
1. https://app.sendgrid.com 로그인
2. Settings → API Keys
3. API Key가 Full Access 권한을 가지고 있는지 확인

### 2. Railway 환경변수 설정
Railway Variables에 다음을 추가:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
DJANGO_SETTINGS_MODULE=config.settings.sendgrid_config
```

**중요**: 
- SENDGRID_API_KEY는 'SG.'로 시작해야 함
- 전체 API 키를 공백 없이 입력

### 3. Sender Authentication (중요!)
SendGrid는 발신자 인증이 필요합니다:

1. https://app.sendgrid.com/settings/sender_auth
2. "Single Sender Verification" 클릭
3. 다음 정보로 발신자 추가:
   - From Email: vridgeofficial@gmail.com
   - From Name: VideoPlanet
   - Reply To: vridgeofficial@gmail.com
4. 인증 이메일 확인 및 승인

### 4. Railway 재배포
```bash
railway up --detach
```

또는 Railway 대시보드에서 Redeploy

### 5. 테스트 명령어

```bash
# 간단한 테스트
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "your-email@example.com"}'

# 성공 시 응답
{"message": "이메일이 발송되었습니다."}
```

## 일반적인 SendGrid 오류와 해결책

### 오류 1: 401 Unauthorized
- **원인**: API Key가 잘못됨
- **해결**: API Key 재확인, 'SG.'로 시작하는지 확인

### 오류 2: 403 Forbidden
- **원인**: 발신자 인증 안됨
- **해결**: Sender Authentication 완료

### 오류 3: Connection refused
- **원인**: 포트가 차단됨
- **해결**: 포트 587 사용 확인

## 대체 SMTP 설정 (SendGrid 문제 시)

Gmail로 다시 전환하려면:
```
EMAIL_HOST_USER=vridgeofficial@gmail.com
EMAIL_HOST_PASSWORD=itwrvymmmwaagouh
DJANGO_SETTINGS_MODULE=config.settings.railway_email_fix
```

## SendGrid 장점
- 월 100개 무료
- 높은 전송률
- 상세한 분석
- 스팸 방지 기능
- API 및 SMTP 모두 지원