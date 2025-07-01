# Railway 배포 및 환경변수 적용 가이드

## 현재 상황
환경변수를 설정했지만 아직 이메일 발송이 실패하고 있습니다. 

## 확인 및 해결 단계

### 1. Railway 재배포 확인
```bash
# Railway CLI가 설치되어 있다면
railway logs --tail

# 또는 Railway 웹 대시보드에서
# Deployments 탭 확인
```

### 2. 환경변수 확인
Railway 웹 대시보드에서:
1. Variables 탭 클릭
2. 다음 변수들이 정확히 설정되었는지 확인:
   - `EMAIL_HOST_USER` = `vridgeofficial@gmail.com`
   - `EMAIL_HOST_PASSWORD` = `itwrvymmmwaagouh` (공백 없이)

### 3. 수동 재배포 트리거
환경변수 변경 후 자동 재배포가 안 되었다면:

**방법 1: Railway CLI**
```bash
railway up
```

**방법 2: Railway 웹 대시보드**
1. Deployments 탭
2. "Trigger Deploy" 또는 "Redeploy" 버튼 클릭

### 4. 즉시 테스트 명령어

재배포 완료 후:
```bash
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "vridgeofficial@gmail.com"}'
```

성공 시 응답:
```json
{"message": "이메일이 발송되었습니다."}
```
EOF < /dev/null
