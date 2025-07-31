# 🚨 Railway Django 백엔드 긴급 복구 가이드

## 문제 상황
- Django 앱이 시작되지 않아 응급 서버로 폴백
- 모든 API 엔드포인트에서 503 에러 발생
- 회원가입, 로그인 등 핵심 기능 불가

## 근본 원인
1. Railway 환경변수가 설정되지 않음 (DATABASE_URL, SECRET_KEY 등)
2. Python 명령어가 `python3`로 통일되지 않음
3. 파일 경로가 Railway 환경과 맞지 않음

## 즉시 적용할 수정사항

### 1. start.sh 수정 완료 ✅
- 모든 `python` 명령을 `python3`로 변경
- 환경변수 기본값 설정 추가
- 파일 경로를 상대 경로로 변경
- Gunicorn 설정 개선 (worker, timeout 증가)

### 2. Railway 환경변수 설정 (필수!)

Railway 대시보드에서 다음 환경변수들을 추가해야 합니다:

```bash
# Django 핵심 설정
SECRET_KEY=django-insecure-videoplanet-production-key-change-this
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings_railway

# 데이터베이스 (Railway PostgreSQL 서비스 추가 필요)
# DATABASE_URL은 PostgreSQL 서비스 추가 시 자동 생성됨

# 이메일 (선택사항)
SENDGRID_API_KEY=your-sendgrid-api-key

# CORS 설정
CORS_ALLOWED_ORIGINS=https://vlanet.net,https://www.vlanet.net,http://localhost:3000
```

### 3. Railway 서비스 설정

#### A. PostgreSQL 서비스 추가
1. Railway 대시보드에서 "+ New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. Django 서비스와 연결
4. DATABASE_URL이 자동으로 환경변수에 추가됨

#### B. 빌드 설정 확인
railway.json이 이미 올바르게 설정되어 있음:
- startCommand: `bash start.sh`
- healthcheckPath: `/api/health/`
- restartPolicy: ON_FAILURE

### 4. 배포 순서

1. **로컬 테스트** (완료 ✅)
   ```bash
   cd /home/winnmedia/VideoPlanet/vridge_back
   PORT=8001 ./start.sh
   # 다른 터미널에서
   curl http://localhost:8001/api/health/
   ```

2. **Git 커밋 및 푸시**
   ```bash
   git add start.sh
   git commit -m "fix: Django 백엔드 Railway 배포 문제 해결

   - Python3 명령어로 통일
   - 환경변수 기본값 설정
   - 파일 경로 수정
   - Gunicorn 안정성 개선"
   
   git push origin recovery-20250731
   ```

3. **Railway 배포**
   - Railway가 자동으로 배포 시작
   - 빌드 로그 모니터링
   - 헬스체크 통과 확인

### 5. 배포 후 검증

```bash
# API 헬스체크
curl https://videoplanet.up.railway.app/api/health/

# 회원가입 테스트
curl -X POST https://videoplanet.up.railway.app/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 로그인 테스트
curl -X POST https://videoplanet.up.railway.app/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## 예상 결과

### 배포 성공 시:
- `/api/health/` 엔드포인트가 200 OK 반환
- 응급 모드가 아닌 정상 Django 응답
- 회원가입/로그인 API 정상 작동
- 프론트엔드에서 모든 기능 사용 가능

### 여전히 문제가 있다면:
1. Railway 빌드 로그 확인
2. 환경변수 설정 재확인
3. PostgreSQL 서비스 연결 상태 확인
4. start.sh 실행 로그 분석

## 장기적 개선사항

1. **환경변수 관리 개선**
   - `.env.example` 파일 생성
   - 환경변수 문서화 강화

2. **모니터링 강화**
   - Sentry 또는 로그 수집 서비스 연동
   - 상태 모니터링 대시보드 구축

3. **CI/CD 파이프라인**
   - GitHub Actions로 자동 테스트
   - 스테이징 환경 구축

---

**🎯 다음 단계**: 위 수정사항을 Git에 커밋하고 Railway에 푸시하여 배포를 진행하세요.