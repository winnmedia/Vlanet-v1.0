# Railway 이메일 문제 해결 가이드

## 현재 상황
- 환경변수 설정: EMAIL_HOST_USER=vridgeofficial@gmail.com, EMAIL_HOST_PASSWORD=itwrvymmmwaagouh
- 테스트 결과: 여전히 이메일 발송 실패 (500 에러)
- 다른 기능들은 모두 정상 작동

## 즉시 확인해야 할 사항

### 1. Railway 대시보드에서 확인

#### A. 재배포 상태 확인
1. https://railway.app 접속
2. VideoPlanet 프로젝트 선택
3. **Deployments** 탭 클릭
4. 가장 최근 배포 시간 확인 (환경변수 설정 이후여야 함)
5. 배포 상태가 "Success"인지 확인

#### B. 환경변수 확인
1. **Variables** 탭 클릭
2. 다음 변수들이 정확히 있는지 확인:
   ```
   EMAIL_HOST_USER=vridgeofficial@gmail.com
   EMAIL_HOST_PASSWORD=itwrvymmmwaagouh
   ```
3. 변수명 앞뒤에 공백이 없는지 확인
4. 비밀번호가 정확히 16자리인지 확인

### 2. Railway CLI로 직접 확인 (설치되어 있다면)

```bash
# 환경변수 목록 확인
railway variables

# 로그 확인 (이메일 관련 오류 찾기)
railway logs --tail | grep -i email

# 로그 확인 (인증 오류 찾기)
railway logs --tail | grep -i auth

# 전체 로그 확인
railway logs --tail 50
```

### 3. 수동 재배포 강제 실행

#### 방법 1: Railway 대시보드
1. Deployments 탭
2. 최신 배포 옆 ⋮ 메뉴 클릭
3. "Redeploy" 선택

#### 방법 2: Railway CLI
```bash
railway up --detach
```

### 4. Gmail 계정 확인

1. https://myaccount.google.com/lesssecureapps
   - "보안 수준이 낮은 앱 액세스" 활성화 (필요시)

2. https://accounts.google.com/DisplayUnlockCaptcha
   - 계정 잠금 해제 (필요시)

3. Gmail 받은편지함 확인
   - Google에서 보안 경고 이메일이 왔는지 확인
   - 새로운 기기에서의 로그인 시도를 허용

### 5. 대체 테스트 방법

만약 위 방법들이 모두 실패한다면:

#### A. 임시로 콘솔 백엔드 사용
Railway Variables에 추가:
```
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
이렇게 하면 이메일이 실제로 발송되지 않고 로그에만 출력됩니다.

#### B. SendGrid로 전환 (권장)
1. https://sendgrid.com 무료 가입
2. API Key 생성
3. Railway Variables에 추가:
   ```
   SENDGRID_API_KEY=your-api-key
   EMAIL_BACKEND=sendgrid_backend.SendgridBackend
   ```

## 디버깅을 위한 테스트 API

재배포 완료 후 다음 명령으로 테스트:

```bash
# 간단한 테스트
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "vridgeofficial@gmail.com"}'

# 상세한 응답 확인
curl -X POST https://videoplanet.up.railway.app/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://vlanet.net" \
  -d '{"email": "vridgeofficial@gmail.com"}' \
  -v
```

## 예상 문제와 해결책

### 문제 1: 환경변수가 적용되지 않음
- **원인**: Railway가 자동 재배포를 하지 않았음
- **해결**: 수동으로 Redeploy 실행

### 문제 2: Gmail 인증 실패
- **원인**: 앱 비밀번호가 잘못됨
- **해결**: 새 앱 비밀번호 생성

### 문제 3: Gmail 계정 차단
- **원인**: 보안 정책으로 차단
- **해결**: 보안 수준 낮은 앱 허용 또는 SendGrid 사용

## 최종 체크리스트

- [ ] Railway 최신 배포가 환경변수 설정 이후인가?
- [ ] 환경변수명이 정확한가? (EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
- [ ] Gmail 앱 비밀번호가 16자리인가?
- [ ] Gmail 계정에서 보안 경고가 없는가?
- [ ] Railway 로그에 이메일 관련 오류가 있는가?