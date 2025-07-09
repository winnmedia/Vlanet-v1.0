# Railway 환경변수 설정 가이드

## 필수 환경변수

Railway 대시보드의 Variables 탭에서 다음 환경변수를 설정해야 합니다:

### 1. Django 핵심 설정
```
SECRET_KEY=your-secure-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.railway
```

### 2. 데이터베이스 (Railway가 자동 제공)
```
DATABASE_URL=postgresql://...
PGDATABASE=railway
PGHOST=...
PGPASSWORD=...
PGPORT=...
PGUSER=...
```

### 3. Redis (Railway가 자동 제공)
```
REDIS_URL=redis://...
REDISHOST=...
REDISPASSWORD=...
REDISPORT=...
REDISUSER=...
```

### 4. API 키 (선택사항)
```
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
HUGGINGFACE_API_KEY=...
TWELVE_LABS_API_KEY=...
```

### 5. 이메일 설정 (선택사항)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=VideoPlanet <noreply@vlanet.net>
```

### 6. CORS 설정
```
CORS_ALLOWED_ORIGINS=https://vlanet.net,https://www.vlanet.net
```

### 7. 성능 설정 (선택사항)
```
WEB_CONCURRENCY=2
WEB_THREADS=4
WORKER_CLASS=sync
LOG_LEVEL=info
```

## 설정 방법

1. Railway 대시보드에 로그인
2. 프로젝트 선택
3. Settings → Variables 탭 이동
4. "Add Variable" 클릭
5. 위의 환경변수 추가

## 확인 방법

배포 후 다음 URL로 헬스체크:
```
https://your-app.up.railway.app/api/health/
```

응답 예시:
```json
{
  "status": "healthy",
  "service": "vridge-backend",
  "database": "connected",
  "environment": "production",
  "settings": "config.settings.railway",
  "env_check": {
    "SECRET_KEY": "set",
    "DATABASE_URL": "set",
    "PORT": "8000"
  }
}
```

## 트러블슈팅

### 500 에러가 발생하는 경우

1. **SECRET_KEY 누락**: 가장 흔한 원인
   - Railway Variables에서 SECRET_KEY 설정 확인
   - Django 보안을 위해 강력한 키 사용

2. **DATABASE_URL 문제**:
   - PostgreSQL 서비스가 Railway에 연결되어 있는지 확인
   - Variables에 DATABASE_URL이 자동 생성되었는지 확인

3. **마이그레이션 실패**:
   - Railway 로그에서 마이그레이션 에러 확인
   - 필요시 수동으로 마이그레이션 실행

4. **정적 파일 문제**:
   - frontend_build 디렉토리가 있는지 확인
   - collectstatic이 성공적으로 실행되었는지 확인

## Railway CLI로 디버깅

```bash
# 로그 확인
railway logs

# 셸 접속
railway run bash

# Django 셸
railway run python manage.py shell

# 마이그레이션 상태 확인
railway run python manage.py showmigrations

# 수동 마이그레이션
railway run python manage.py migrate
```