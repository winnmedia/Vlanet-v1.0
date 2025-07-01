# VideoPlanet Railway 배포 체크리스트 및 해결 가이드

## 🚨 현재 파악된 문제점 및 해결 방안

### 1. **이메일 발송 문제 (최우선)**
**문제**: Railway가 Gmail 설정을 사용하고 있어 SendGrid가 작동하지 않음
**해결**: `railway.json` 파일을 수정하여 SendGrid 설정을 사용하도록 변경 완료

### 2. **필요한 작업 단계**

#### Step 1: Railway 환경변수 설정 확인
Railway 대시보드에서 다음 환경변수들이 정확히 설정되어 있는지 확인:

```
# Django 설정
DJANGO_SETTINGS_MODULE=config.settings.sendgrid_config
RAILWAY_ENVIRONMENT=production

# SendGrid 이메일 설정
SENDGRID_API_KEY=[실제 SendGrid API 키]
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=[SendGrid API 키와 동일]
DEFAULT_FROM_EMAIL=VideoPlanet <vridgeofficial@gmail.com>

# CORS 설정
CORS_ALLOWED_ORIGINS=https://vlanet.net,https://www.vlanet.net,https://videoplanetready.vercel.app,https://vlanet-v1-0.vercel.app

# 데이터베이스 (Railway가 자동 제공)
DATABASE_URL=[PostgreSQL 연결 문자열]

# 보안 설정
SECRET_KEY=[고유한 시크릿 키]
DEBUG=False
```

#### Step 2: GitHub에 변경사항 커밋 및 푸시
```bash
git add railway.json check_railway_deployment.py railway_deployment_guide.md
git commit -m "fix: SendGrid 이메일 설정으로 변경 및 진단 스크립트 추가"
git push origin main
```

#### Step 3: Railway 재배포
1. Railway 대시보드에서 `Vlanet-v1.0` 서비스 선택
2. **Deployments** 탭으로 이동
3. 우측 상단의 **"Redeploy"** 버튼 클릭
4. 또는 GitHub 푸시가 자동으로 재배포를 트리거함

#### Step 4: 배포 확인 및 진단
Railway 배포가 완료된 후:

1. **로그 확인**:
   - Railway 대시보드 → Logs 탭
   - "SendGrid configured with API key" 메시지 확인
   - 에러 메시지가 없는지 확인

2. **진단 스크립트 실행** (Railway Shell에서):
   ```bash
   python check_railway_deployment.py
   ```
   
   이메일 테스트까지 하려면:
   ```bash
   python check_railway_deployment.py --test-email your-email@example.com
   ```

#### Step 5: 프론트엔드 테스트
1. https://vlanet.net 접속
2. 회원가입 테스트:
   - 새 이메일로 가입 시도
   - 인증 이메일 수신 확인
   - 같은 이메일로 재가입 시도 → "이미 가입된 이메일" 메시지 확인
3. 프로젝트 생성 테스트:
   - 로그인 후 프로젝트 생성
   - 프로젝트 목록에 표시되는지 확인

## 📋 문제 해결 체크리스트

### ✅ 완료된 작업
- [x] `railway.json`을 SendGrid 설정으로 변경
- [x] `manage.py`와 `wsgi.py`가 환경변수 우선순위를 올바르게 처리
- [x] CORS 설정이 vlanet.net 도메인 포함
- [x] 진단 스크립트 작성

### ⏳ 확인 필요 사항
- [ ] Railway 환경변수 설정 확인 (특히 SENDGRID_API_KEY)
- [ ] SendGrid 발신자 인증 완료 여부
- [ ] GitHub 푸시 및 Railway 재배포
- [ ] 실제 이메일 발송 테스트
- [ ] 데이터베이스 연결 및 마이그레이션 상태

## 🔍 문제 진단 방법

### 1. Railway 로그에서 확인할 사항
```
# 좋은 신호
- "SendGrid configured with API key: SG.xxxxx..."
- "Email sent successfully"
- "Project created successfully with ID: xxx"

# 나쁜 신호
- "SendGrid API key not found"
- "Email credentials not configured"
- "CORS policy" 에러
- "IntegrityError" 또는 데이터베이스 에러
```

### 2. 브라우저 콘솔에서 확인할 사항
- Network 탭에서 API 요청 확인
- CORS 에러가 없는지 확인
- 응답 상태 코드 확인 (200, 201 = 성공)

### 3. SendGrid 대시보드 확인
- Activity Feed에서 이메일 발송 로그 확인
- Bounces/Blocks 목록 확인
- API Key 권한 확인 (Mail Send 권한 필요)

## 🚀 빠른 해결 가이드

### 이메일이 여전히 발송되지 않는 경우:
1. Railway 환경변수에서 `SENDGRID_API_KEY` 확인
2. SendGrid 대시보드에서 발신자 인증 상태 확인
3. Railway Shell에서 진단 스크립트 실행

### 프로젝트 생성이 실패하는 경우:
1. Railway 로그에서 구체적인 에러 메시지 확인
2. 데이터베이스 마이그레이션 상태 확인
3. CORS 설정이 올바른지 확인

### CORS 에러가 발생하는 경우:
1. Railway 환경변수 `CORS_ALLOWED_ORIGINS` 확인
2. 프론트엔드 URL이 모두 포함되어 있는지 확인
3. Railway 재배포 후 캐시 클리어

## 📞 추가 지원

문제가 지속되면 다음 정보와 함께 문의:
- Railway 로그 스크린샷
- 브라우저 콘솔 에러 메시지
- 진단 스크립트 실행 결과