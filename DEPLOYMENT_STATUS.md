# Railway 배포 상태 확인

## 현재 진행 상황
- GitHub 푸시 완료: ✅
- Railway 자동 배포 시작: ✅
- 예상 소요 시간: 2-5분

## 배포 후 확인할 로그 메시지

### SendGrid 사용 시:
```
SendGrid configured with API key: SG.xxxxx...
Email configured successfully
```

### Gmail 사용 시:
```
Gmail configured with user: vridgeofficial@gmail.com
Email configured successfully
```

## 테스트 명령어

배포 완료 후 실행:

```bash
# 이메일 발송 테스트
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "test@example.com"}'

# 성공 시 응답
{"message": "이메일이 발송되었습니다."}
```

## Railway Variables 확인

다음 중 하나가 설정되어 있어야 함:

**SendGrid:**
- SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

**Gmail:**
- EMAIL_HOST_USER=vridgeofficial@gmail.com
- EMAIL_HOST_PASSWORD=itwrvymmmwaagouh

## 문제 발생 시 체크리스트

- [ ] Railway Deployments 탭에서 배포 성공 확인
- [ ] Railway Logs 탭에서 이메일 설정 메시지 확인
- [ ] 환경변수가 올바르게 설정되었는지 확인
- [ ] SendGrid의 경우 Sender Authentication 완료 확인